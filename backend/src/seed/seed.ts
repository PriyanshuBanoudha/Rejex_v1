import mongoose from 'mongoose';
import argon2 from 'argon2';
import { config } from '../config';

// Import all models
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Track } from '../models/Track';
import { Team } from '../models/Team';
import { Project } from '../models/Project';
import { Rubric } from '../models/Rubric';
import { JudgeAssignment } from '../models/JudgeAssignment';
import { Score } from '../models/Score';
import '../models/Vote';
import '../models/Comment';
import { AuditLog } from '../models/AuditLog';
import { Webhook } from '../models/Webhook';

async function seed() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('[Seed] Connected to MongoDB');

  const count = await User.countDocuments();
  if (count > 0) {
    console.log('[Seed] DB already seeded, skipping.');
    await mongoose.disconnect();
    return;
  }

  console.log('[Seed] Seeding database...');

  // ── Users ─────────────────────────────────────────────────────
  const passwordHash = await argon2.hash('Password123!');

  const [admin, organizer, judge1, judge2, judge3, p1, p2, p3, p4] = await User.insertMany([
    { email: 'admin@hackathon.local', passwordHash, name: 'Platform Admin', role: 'admin' },
    { email: 'organizer@hackathon.local', passwordHash, name: 'Event Organizer', role: 'organizer' },
    { email: 'judge1@hackathon.local', passwordHash, name: 'Alice Judge', role: 'judge' },
    { email: 'judge2@hackathon.local', passwordHash, name: 'Bob Judge', role: 'judge' },
    { email: 'judge3@hackathon.local', passwordHash, name: 'Carol Judge', role: 'judge' },
    { email: 'participant1@hackathon.local', passwordHash, name: 'Dave Builder', role: 'participant' },
    { email: 'participant2@hackathon.local', passwordHash, name: 'Eve Coder', role: 'participant' },
    { email: 'participant3@hackathon.local', passwordHash, name: 'Frank Dev', role: 'participant' },
    { email: 'participant4@hackathon.local', passwordHash, name: 'Grace Hacker', role: 'participant' },
  ]);

  console.log('[Seed] Users created');

  // ── Event ─────────────────────────────────────────────────────
  const now = new Date();
  const event = await Event.create({
    title: 'Raptors 2026 Hackathon',
    description: 'The premier hackathon event powering the next generation of builders. Build something amazing in 48 hours.',
    organizerId: organizer._id,
    status: 'judging',
    registrationStart: new Date(now.getTime() - 30 * 86400000),
    registrationEnd: new Date(now.getTime() - 7 * 86400000),
    submissionStart: new Date(now.getTime() - 7 * 86400000),
    submissionDeadline: new Date(now.getTime() - 1 * 86400000),
    judgingStart: new Date(now.getTime() - 1 * 86400000),
    judgingEnd: new Date(now.getTime() + 3 * 86400000),
    votingStart: new Date(now.getTime() + 3 * 86400000),
    votingEnd: new Date(now.getTime() + 7 * 86400000),
    maxTeamSize: 4,
    minTeamSize: 1,
    allowSoloParticipants: true,
    votingEnabled: false,
    resultsRevealed: false,
    tags: ['ai', 'web3', 'open-source', 'climate'],
    prizes: [
      { place: 1, title: 'Grand Prize', description: 'AWS Credits + Trophy', value: '$5,000' },
      { place: 2, title: 'Runner Up', description: 'Swag + Credits', value: '$2,000' },
      { place: 3, title: 'Third Place', description: 'Swag', value: '$1,000' },
    ],
  });

  console.log('[Seed] Event created');

  // ── Rubric ────────────────────────────────────────────────────
  const rubric = await Rubric.create({
    eventId: event._id,
    name: 'Standard Judging Rubric',
    description: 'Multi-dimensional evaluation rubric for technical projects',
    criteria: [
      { name: 'Innovation', description: 'How novel and creative is the idea?', maxScore: 10, weight: 2.0 },
      { name: 'Technical Execution', description: 'Quality of code and architecture', maxScore: 10, weight: 2.5 },
      { name: 'Impact & Usefulness', description: 'Real-world applicability and impact', maxScore: 10, weight: 2.0 },
      { name: 'Presentation', description: 'Demo quality and communication', maxScore: 10, weight: 1.5 },
    ],
  });

  await Event.findByIdAndUpdate(event._id, { rubricId: rubric._id });
  console.log('[Seed] Rubric created');

  // ── Tracks ────────────────────────────────────────────────────
  const [trackAI, trackWeb3] = await Track.insertMany([
    {
      eventId: event._id,
      name: 'AI & ML',
      description: 'Projects leveraging artificial intelligence and machine learning',
      prizes: [{ place: 1, title: 'Best AI Project', value: '$1,500' }],
    },
    {
      eventId: event._id,
      name: 'Web3 & DeFi',
      description: 'Decentralized applications and blockchain projects',
      prizes: [{ place: 1, title: 'Best Web3 Project', value: '$1,500' }],
    },
  ]);

  console.log('[Seed] Tracks created');

  // ── Teams ─────────────────────────────────────────────────────
  const [team1, team2, team3] = await Team.insertMany([
    { eventId: event._id, name: 'Neural Ninjas', leaderId: p1._id, members: [p1._id, p2._id], status: 'locked', inviteCode: 'TEAM001ABC' },
    { eventId: event._id, name: 'Block Busters', leaderId: p3._id, members: [p3._id], status: 'locked', inviteCode: 'TEAM002DEF' },
    { eventId: event._id, name: 'Green Coders', leaderId: p4._id, members: [p4._id], status: 'locked', inviteCode: 'TEAM003GHI' },
  ]);

  console.log('[Seed] Teams created');

  // ── Projects ──────────────────────────────────────────────────
  const [proj1, proj2, proj3] = await Project.insertMany([
    {
      eventId: event._id,
      teamId: team1._id,
      title: 'AutoRaptor AI',
      description: 'An AI-powered code review assistant that helps developers catch bugs before they ship. Uses transformer models fine-tuned on open-source codebases to provide context-aware suggestions.',
      repoUrl: 'https://github.com/example/autoraptor-ai',
      demoUrl: 'https://autoraptor.demo',
      trackId: trackAI._id,
      tags: ['ai', 'devtools', 'typescript'],
      status: 'submitted',
      submittedAt: new Date(now.getTime() - 26 * 3600000),
    },
    {
      eventId: event._id,
      teamId: team2._id,
      title: 'DeFi Compass',
      description: 'A decentralized portfolio tracker and yield optimizer built on Ethereum. Automatically rebalances assets across protocols to maximize returns while minimizing gas costs.',
      repoUrl: 'https://github.com/example/defi-compass',
      demoUrl: 'https://deficompass.demo',
      trackId: trackWeb3._id,
      tags: ['web3', 'ethereum', 'defi', 'solidity'],
      status: 'submitted',
      submittedAt: new Date(now.getTime() - 20 * 3600000),
    },
    {
      eventId: event._id,
      teamId: team3._id,
      title: 'EcoML Predictor',
      description: 'Machine learning model predicting local air quality 72 hours ahead using satellite imagery, weather patterns, and IoT sensor data. Deployable on low-cost edge devices.',
      repoUrl: 'https://github.com/example/ecoml',
      demoUrl: 'https://ecoml.demo',
      trackId: trackAI._id,
      tags: ['ai', 'climate', 'iot', 'python'],
      status: 'submitted',
      submittedAt: new Date(now.getTime() - 18 * 3600000),
    },
  ]);

  console.log('[Seed] Projects created');

  // ── Judge Assignments ─────────────────────────────────────────
  const assignments = await JudgeAssignment.insertMany([
    { eventId: event._id, judgeId: judge1._id, projectId: proj1._id, trackId: trackAI._id, status: 'completed', assignedAt: new Date() },
    { eventId: event._id, judgeId: judge1._id, projectId: proj2._id, trackId: trackWeb3._id, status: 'completed', assignedAt: new Date() },
    { eventId: event._id, judgeId: judge2._id, projectId: proj1._id, trackId: trackAI._id, status: 'completed', assignedAt: new Date() },
    { eventId: event._id, judgeId: judge2._id, projectId: proj3._id, trackId: trackAI._id, status: 'pending', assignedAt: new Date() },
    { eventId: event._id, judgeId: judge3._id, projectId: proj2._id, trackId: trackWeb3._id, status: 'pending', assignedAt: new Date() },
    { eventId: event._id, judgeId: judge3._id, projectId: proj3._id, trackId: trackAI._id, status: 'pending', assignedAt: new Date() },
  ]);

  console.log('[Seed] Assignments created');

  // ── Scores ────────────────────────────────────────────────────
  const crit = rubric.criteria;
  const makeScores = (vals: number[]) =>
    crit.map((c: any, i: number) => ({ criterionId: c._id, rawScore: vals[i] }));

  // judge1 → proj1: scores [8, 9, 7, 8]
  const s1Criteria = makeScores([8, 9, 7, 8]);
  const maxPossible = 10*2.0 + 10*2.5 + 10*2.0 + 10*1.5;
  const weightedScore1 = 8*2.0 + 9*2.5 + 7*2.0 + 8*1.5;
  const norm1 = (weightedScore1 / maxPossible) * 100;

  await Score.create({
    judgeId: judge1._id, projectId: proj1._id, eventId: event._id,
    rubricId: rubric._id, assignmentId: assignments[0]._id,
    criteriaScores: s1Criteria,
    totalRawScore: 32, weightedScore: weightedScore1,
    normalizedScore: norm1, submittedAt: new Date(),
  });

  // judge1 → proj2: scores [6, 7, 8, 6]
  const weightedScore2 = 6*2.0 + 7*2.5 + 8*2.0 + 6*1.5;
  const norm2 = (weightedScore2 / maxPossible) * 100;
  await Score.create({
    judgeId: judge1._id, projectId: proj2._id, eventId: event._id,
    rubricId: rubric._id, assignmentId: assignments[1]._id,
    criteriaScores: makeScores([6, 7, 8, 6]),
    totalRawScore: 27, weightedScore: weightedScore2,
    normalizedScore: norm2, submittedAt: new Date(),
  });

  // judge2 → proj1: scores [9, 8, 9, 7]
  const weightedScore3 = 9*2.0 + 8*2.5 + 9*2.0 + 7*1.5;
  const norm3 = (weightedScore3 / maxPossible) * 100;
  await Score.create({
    judgeId: judge2._id, projectId: proj1._id, eventId: event._id,
    rubricId: rubric._id, assignmentId: assignments[2]._id,
    criteriaScores: makeScores([9, 8, 9, 7]),
    totalRawScore: 33, weightedScore: weightedScore3,
    normalizedScore: norm3, submittedAt: new Date(),
  });

  console.log('[Seed] Scores created');

  // ── Audit Logs ────────────────────────────────────────────────
  await AuditLog.insertMany([
    { actorId: organizer._id, actorEmail: organizer.email, action: 'event.created', resource: 'Event', resourceId: event._id.toString(), eventId: event._id },
    { actorId: organizer._id, actorEmail: organizer.email, action: 'rubric.created', resource: 'Rubric', resourceId: rubric._id.toString(), eventId: event._id },
    { actorId: judge1._id, actorEmail: judge1.email, action: 'score.submitted', resource: 'Score', eventId: event._id },
    { actorId: p1._id, actorEmail: p1.email, action: 'project.submitted', resource: 'Project', resourceId: proj1._id.toString(), eventId: event._id },
  ]);

  // ── Webhook ───────────────────────────────────────────────────
  await Webhook.create({
    eventId: event._id,
    url: 'http://localhost:9999/webhook-test',
    events: ['project.submitted', 'score.submitted', 'results.revealed'],
    secret: 'demo-webhook-secret-key',
    active: true,
    createdBy: organizer._id,
  });

  console.log('[Seed] Completed successfully!');
  console.log('');
  console.log('──────────────────────────────────────────────');
  console.log('  SEED CREDENTIALS');
  console.log('──────────────────────────────────────────────');
  console.log('  Admin:      admin@hackathon.local / Password123!');
  console.log('  Organizer:  organizer@hackathon.local / Password123!');
  console.log('  Judge 1:    judge1@hackathon.local / Password123!');
  console.log('  Judge 2:    judge2@hackathon.local / Password123!');
  console.log('  Participant:participant1@hackathon.local / Password123!');
  console.log('──────────────────────────────────────────────');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
