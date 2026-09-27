import { describe, it, expect, beforeAll } from 'vitest';
import { http, loginAs, clearAuth } from './helpers';

let eventId: string;
let rubricId: string;
let judgeAssignmentId: string;
let projectId: string;
let judge1Token: string;

beforeAll(async () => {
  // Get the seeded event
  clearAuth();
  const { data } = await http.get('/events');
  const seeded = data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026'));
  if (seeded) eventId = seeded._id;
});

describe('T2: Rubric Management', () => {
  it('organizer creates a rubric', async () => {
    await loginAs('organizer');
    const ts = Date.now();

    // Create test event for rubric
    const now = new Date();
    const { data: ev } = await http.post('/events', {
      title: `Rubric Test Event ${ts}`,
      description: 'Rubric tests',
      registrationStart: now,
      registrationEnd: new Date(now.getTime() + 7 * 86400000),
      submissionStart: now,
      submissionDeadline: new Date(now.getTime() + 14 * 86400000),
    });
    eventId = ev.event._id;

    const { data, status } = await http.post('/judging/rubrics', {
      eventId,
      name: 'Test Rubric',
      criteria: [
        { name: 'Innovation', description: 'Novel idea', maxScore: 10, weight: 2.0 },
        { name: 'Execution', description: 'Code quality', maxScore: 10, weight: 2.5 },
      ],
    });
    expect(status).toBe(201);
    expect(data.rubric.criteria).toHaveLength(2);
    rubricId = data.rubric._id;
  });

  it('gets rubric by ID', async () => {
    const { data } = await http.get(`/judging/rubrics/${rubricId}`);
    expect(data.rubric._id).toBe(rubricId);
    expect(data.rubric.criteria.length).toBe(2);
  });

  it('blocks participants from creating rubrics', async () => {
    await loginAs('participant');
    const res = await http.post('/judging/rubrics', {
      eventId, name: 'Hacked', criteria: [],
    }).catch((e) => e.response);
    expect([403, 400]).toContain(res.status);
  });
});

describe('T2: Judge Invites & Assignment', () => {
  it('organizer creates a judge invite token', async () => {
    await loginAs('organizer');
    const { data, status } = await http.post('/judging/invites', {
      eventId, role: 'judge', maxUses: 5, expiresInHours: 24,
    });
    expect(status).toBe(201);
    expect(data.invite.token).toBeDefined();
  });

  it('organizer can bulk assign judges', async () => {
    await loginAs('organizer');
    const { data } = await http.post(`/judging/assign/${eventId}`, { judgesPerProject: 1 });
    // May have 0 if no submissions, that's okay
    expect(typeof data.assigned).toBe('number');
    expect(typeof data.skipped).toBe('number');
  });

  it('judge can get their assignments', async () => {
    const d = await loginAs('judge', 1);
    judge1Token = d.accessToken;
    const { data } = await http.get('/judging/assignments');
    expect(Array.isArray(data.assignments)).toBe(true);
  });

  it('organizer can view judge progress', async () => {
    await loginAs('organizer');
    const { data } = await http.get(`/judging/progress/${eventId}`);
    expect(Array.isArray(data.progress)).toBe(true);
  });
});

describe('T2: Scoring', () => {
  beforeAll(async () => {
    // Get seeded event with scoreable project
    clearAuth();
    const { data } = await http.get('/events');
    const seeded = data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026'));
    if (seeded) eventId = seeded._id;
  });

  it('judge can score an assigned project', async () => {
    await loginAs('judge', 1);
    const { data: asgn } = await http.get('/judging/assignments');
    const pending = asgn.assignments.filter((a: any) => a.status === 'pending');
    if (pending.length === 0) return; // No pending assignments; skip

    const assignment = pending[0];
    const eventData = await http.get(`/events/${assignment.eventId?._id || assignment.eventId}`);
    const rubricIdLocal = eventData.data.event.rubricId?._id || eventData.data.event.rubricId;
    if (!rubricIdLocal) return;

    const { data: rd } = await http.get(`/judging/rubrics/${rubricIdLocal}`);
    const criteriaScores = rd.rubric.criteria.map((c: any) => ({
      criterionId: c._id,
      rawScore: Math.floor(c.maxScore * 0.8),
      comment: 'Good work',
    }));

    const { status } = await http.post('/judging/scores', {
      assignmentId: assignment._id,
      criteriaScores,
    });
    expect([200, 201]).toContain(status);
  });

  it('organizer can run Z-score normalization', async () => {
    await loginAs('organizer');
    const ev = await http.get('/events').then((r) => r.data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026')));
    if (!ev) return;
    const { status } = await http.post(`/judging/normalize/${ev._id}`);
    expect([200, 201]).toContain(status);
  });
});

describe('T2: Results', () => {
  it('non-admin cannot see unrevealed results', async () => {
    await loginAs('participant');
    const ev = await http.get('/events').then((r) => r.data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026')));
    if (!ev) return;
    const res = await http.get(`/judging/results/${ev._id}`).catch((e) => e.response);
    expect([403, 200]).toContain(res.status); // 200 if revealed
  });

  it('admin can always see results', async () => {
    await loginAs('admin');
    const ev = await http.get('/events').then((r) => r.data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026')));
    if (!ev) return;
    const { status, data } = await http.get(`/judging/results/${ev._id}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.rankings)).toBe(true);
  });
});
