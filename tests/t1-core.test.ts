import { describe, it, expect, beforeAll } from 'vitest';
import { http, loginAs, clearAuth } from './helpers';

let adminToken: string;
let eventId: string;

beforeAll(async () => {
  const data = await loginAs('admin');
  adminToken = data.accessToken;
});

describe('T1: Health Check', () => {
  it('GET /health returns ok', async () => {
    const { data } = await http.get('/health', { baseURL: 'http://localhost:5000' });
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
  });
});

describe('T1: Authentication', () => {
  it('registers a new user', async () => {
    clearAuth();
    const ts = Date.now();
    const { data, status } = await http.post('/auth/register', {
      name: 'Test User',
      email: `test+${ts}@example.com`,
      password: 'TestPass123!',
    });
    expect(status).toBe(201);
    expect(data.user.email).toContain('@example.com');
    expect(data.user.role).toBe('participant');
  });

  it('rejects registration with short password', async () => {
    clearAuth();
    const ts = Date.now();
    const res = await http.post('/auth/register', {
      name: 'Bad User',
      email: `bad+${ts}@example.com`,
      password: 'short',
    }).catch((e) => e.response);
    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const data = await loginAs('admin');
    expect(data.accessToken).toBeDefined();
    expect(data.refreshToken).toBeDefined();
    expect(data.user.role).toBe('admin');
  });

  it('rejects wrong password', async () => {
    clearAuth();
    const res = await http.post('/auth/login', {
      email: 'admin@hackathon.local',
      password: 'wrongpassword',
    }).catch((e) => e.response);
    expect(res.status).toBe(401);
  });

  it('GET /auth/me returns current user', async () => {
    await loginAs('admin');
    const { data } = await http.get('/auth/me');
    expect(data.user.email).toBe('admin@hackathon.local');
    expect(data.user.role).toBe('admin');
    expect(data.user.passwordHash).toBeUndefined();
  });

  it('protects authenticated endpoints', async () => {
    clearAuth();
    const res = await http.get('/auth/me').catch((e) => e.response);
    expect(res.status).toBe(401);
  });
});

describe('T1: Events', () => {
  it('creates an event as admin', async () => {
    await loginAs('admin');
    const now = new Date();
    const { data, status } = await http.post('/events', {
      title: 'Test Hackathon T1',
      description: 'A test event for acceptance tests',
      registrationStart: now,
      registrationEnd: new Date(now.getTime() + 7 * 86400000),
      submissionStart: now,
      submissionDeadline: new Date(now.getTime() + 14 * 86400000),
    });
    expect(status).toBe(201);
    expect(data.event.title).toBe('Test Hackathon T1');
    eventId = data.event._id;
  });

  it('lists events publicly', async () => {
    clearAuth();
    const { data } = await http.get('/events');
    expect(Array.isArray(data.events)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
  });

  it('gets event by ID', async () => {
    const { data } = await http.get(`/events/${eventId}`);
    expect(data.event._id).toBe(eventId);
    expect(data.event.title).toBe('Test Hackathon T1');
  });

  it('blocks non-organizer from creating events', async () => {
    await loginAs('participant');
    const res = await http.post('/events', {
      title: 'Unauthorized',
      description: 'Should fail',
      registrationStart: new Date(),
      registrationEnd: new Date(),
      submissionStart: new Date(),
      submissionDeadline: new Date(),
    }).catch((e) => e.response);
    expect(res.status).toBe(403);
  });
});

describe('T1: Teams', () => {
  let teamId: string;
  let inviteCode: string;

  it('participant creates a team', async () => {
    await loginAs('participant');
    const { data, status } = await http.post('/teams', {
      eventId,
      name: `Team Alpha ${Date.now()}`,
    });
    expect(status).toBe(201);
    expect(data.team.name).toContain('Team Alpha');
    teamId = data.team._id;
    inviteCode = data.team.inviteCode;
  });

  it('gets team details with members', async () => {
    const { data } = await http.get(`/teams/${teamId}`);
    expect(data.team.members.length).toBeGreaterThan(0);
    expect(data.team.inviteCode).toBeDefined();
  });

  it('blocks joining same event twice', async () => {
    await loginAs('participant');
    // Already in a team for this event — joining another should fail
    const res = await http.post('/teams', { eventId, name: 'Second Team' }).catch((e) => e.response);
    expect([409, 400]).toContain(res.status);
  });
});

describe('T1: OpenAPI', () => {
  it('GET /api/openapi.json returns spec', async () => {
    clearAuth();
    const { data } = await http.get('/openapi.json');
    expect(data.openapi).toContain('3.0');
    expect(data.info.title).toContain('Hackathon');
  });
});
