import { Types } from 'mongoose';
import { JudgeAssignment } from '../models/JudgeAssignment';
import { Project } from '../models/Project';
import { User } from '../models/User';

/**
 * Round-robin judge assignment algorithm.
 *
 * Algorithm:
 * 1. Fetch all submitted projects for the event (optionally filtered by track).
 * 2. Fetch all judge IDs assigned to the event.
 * 3. For each project, assign judges round-robin ensuring:
 *    - No judge reviews a project their own team submitted (conflict check).
 *    - No duplicate assignments (unique constraint in DB).
 *    - Judges-per-project honoured (judgesPerProject param, default 2).
 * 4. Persist assignments in bulk.
 *
 * @param eventId - target event
 * @param judgeIds - list of judge user IDs to assign
 * @param judgesPerProject - how many judges per project (default 2)
 * @param trackId - optional: restrict to one track
 */
export async function assignJudgesRoundRobin(
  eventId: string,
  judgeIds: string[],
  judgesPerProject = 2,
  trackId?: string
): Promise<{ assigned: number; skipped: number }> {
  const projectFilter: any = { eventId, status: 'submitted' };
  if (trackId) projectFilter.trackId = new Types.ObjectId(trackId);

  const projects = await Project.find(projectFilter).select('_id teamId trackId');
  if (projects.length === 0) return { assigned: 0, skipped: 0 };
  if (judgeIds.length === 0) return { assigned: 0, skipped: projects.length };

  // Build team → member map for conflict detection
  const { Team } = await import('../models/Team');
  const teams = await Team.find({
    _id: { $in: projects.map((p) => p.teamId) },
  }).select('_id members');
  const teamMembers = new Map<string, string[]>();
  for (const t of teams) {
    teamMembers.set(
      t._id.toString(),
      t.members.map((m: any) => m.toString())
    );
  }

  // Fetch existing assignments to avoid duplicates
  const existing = await JudgeAssignment.find({ eventId }).select('judgeId projectId');
  const alreadyAssigned = new Set(
    existing.map((a) => `${a.judgeId}:${a.projectId}`)
  );

  const toCreate: any[] = [];
  let skipped = 0;

  // Judge workload tracker
  const judgeWorkload = new Map<string, number>();
  for (const jid of judgeIds) judgeWorkload.set(jid, 0);

  for (const project of projects) {
    const teamId = project.teamId?.toString();
    const conflictMembers = teamId ? (teamMembers.get(teamId) || []) : [];

    // Sort judges by current workload (least loaded first)
    const eligibleJudges = judgeIds
      .filter((jid) => {
        if (conflictMembers.includes(jid)) return false;
        if (alreadyAssigned.has(`${jid}:${project._id}`)) return false;
        return true;
      })
      .sort((a, b) => (judgeWorkload.get(a) || 0) - (judgeWorkload.get(b) || 0));

    const assigned = eligibleJudges.slice(0, judgesPerProject);

    if (assigned.length < judgesPerProject) {
      skipped++;
    }

    for (const jid of assigned) {
      toCreate.push({
        eventId: new Types.ObjectId(eventId),
        judgeId: new Types.ObjectId(jid),
        projectId: project._id,
        trackId: project.trackId,
        status: 'pending',
        assignedAt: new Date(),
      });
      alreadyAssigned.add(`${jid}:${project._id}`);
      judgeWorkload.set(jid, (judgeWorkload.get(jid) || 0) + 1);
    }
  }

  if (toCreate.length > 0) {
    await JudgeAssignment.insertMany(toCreate, { ordered: false }).catch(() => {
      // ignore duplicate key errors from race conditions
    });
  }

  return { assigned: toCreate.length, skipped };
}

/**
 * Get judge progress for an event.
 */
export async function getJudgeProgress(eventId: string): Promise<
  Array<{
    judgeId: string;
    judgeName: string;
    total: number;
    completed: number;
    pending: number;
    completionPct: number;
  }>
> {
  const assignments = await JudgeAssignment.find({ eventId })
    .populate('judgeId', 'name email')
    .lean();

  const byJudge = new Map<
    string,
    { name: string; total: number; completed: number }
  >();

  for (const a of assignments) {
    const jid = (a.judgeId as any)._id?.toString() || a.judgeId.toString();
    const name = (a.judgeId as any).name || 'Unknown';
    if (!byJudge.has(jid)) byJudge.set(jid, { name, total: 0, completed: 0 });
    const entry = byJudge.get(jid)!;
    entry.total++;
    if (a.status === 'completed') entry.completed++;
  }

  return Array.from(byJudge.entries()).map(([judgeId, data]) => ({
    judgeId,
    judgeName: data.name,
    total: data.total,
    completed: data.completed,
    pending: data.total - data.completed,
    completionPct: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));
}
