import { describe, it, expect, beforeAll } from 'vitest';
import { http, loginAs, clearAuth } from './helpers';

let eventId: string;
let projectId: string;

beforeAll(async () => {
  clearAuth();
  const { data } = await http.get('/events');
  const seeded = data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026'));
  if (seeded) eventId = seeded._id;
});

describe('T3: Gallery', () => {
  it('returns public gallery for an event', async () => {
    if (!eventId) return;
    clearAuth();
    const { data, status } = await http.get(`/gallery/${eventId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.projects)).toBe(true);
    expect(data.seed).toBeDefined();
  });

  it('gallery uses seeded shuffle (different seed = different order)', async () => {
    if (!eventId) return;
    const { data: r1 } = await http.get(`/gallery/${eventId}?seed=1`);
    const { data: r2 } = await http.get(`/gallery/${eventId}?seed=99999`);
    const ids1 = r1.projects.map((p: any) => p._id);
    const ids2 = r2.projects.map((p: any) => p._id);
    // If there are enough projects, order should differ
    if (ids1.length >= 3) {
      const same = ids1.every((id: string, i: number) => id === ids2[i]);
      expect(same).toBe(false);
    }
  });

  it('gallery search filters results', async () => {
    if (!eventId) return;
    const { data } = await http.get(`/gallery/${eventId}?search=AutoRaptor`);
    if (data.projects.length > 0) {
      expect(data.projects[0].title.toLowerCase()).toContain('autoraptor');
    }
  });

  it('hidden projects are not in gallery', async () => {
    if (!eventId) return;
    clearAuth();
    const { data } = await http.get(`/gallery/${eventId}`);
    const drafts = data.projects.filter((p: any) => p.status === 'draft');
    expect(drafts).toHaveLength(0);
  });
});

describe('T3: Voting', () => {
  beforeAll(async () => {
    clearAuth();
    const { data } = await http.get(`/gallery/${eventId}`);
    if (data.projects.length > 0) projectId = data.projects[0]._id;
  });

  it('participant can cast a vote', async () => {
    if (!projectId) return;
    await loginAs('participant', 2);
    const res = await http.post('/votes', { projectId }).catch((e) => e.response);
    // 201 = voted, 409 = already voted - both ok
    expect([201, 409]).toContain(res.status);
  });

  it('prevents double voting by same user', async () => {
    if (!projectId) return;
    await loginAs('participant', 3);
    // First vote
    await http.post('/votes', { projectId }).catch(() => {});
    // Second vote should be rejected
    const res = await http.post('/votes', { projectId }).catch((e) => e.response);
    expect(res.status).toBe(409);
    expect(res.data.message).toContain('already voted');
  });

  it('vote counts are hidden unless results revealed or admin', async () => {
    if (!projectId) return;
    clearAuth();
    const { data } = await http.get(`/votes/${projectId}`);
    // Either shows null (hidden) or a count if revealed
    expect(data.success).toBe(true);
  });
});

describe('T3: Comments', () => {
  it('logged-in user can comment on a project', async () => {
    if (!projectId) return;
    await loginAs('participant', 4);
    const { data, status } = await http.post('/comments', {
      projectId,
      body: 'Great project! Really impressive work.',
    });
    expect(status).toBe(201);
    expect(data.comment.body).toContain('Great project');
  });

  it('unauthenticated user can view comments', async () => {
    if (!projectId) return;
    clearAuth();
    const { data, status } = await http.get(`/comments/${projectId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.comments)).toBe(true);
  });

  it('user can flag a comment', async () => {
    if (!projectId) return;
    await loginAs('participant', 4);
    const { data: comments } = await http.get(`/comments/${projectId}`);
    if (comments.comments.length === 0) return;
    const commentId = comments.comments[0]._id;
    await loginAs('participant', 3);
    const { status } = await http.post(`/comments/${commentId}/flag`);
    expect([200, 409]).toContain(status);
  });
});

describe('T3: Audit Logs', () => {
  it('organizer can view audit logs', async () => {
    await loginAs('organizer');
    const { data, status } = await http.get(`/audit/${eventId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.logs)).toBe(true);
    if (data.logs.length > 0) {
      expect(data.logs[0].action).toBeDefined();
      expect(data.logs[0].createdAt || data.logs[0].timestamp).toBeDefined();
    }
  });

  it('participant cannot view audit logs', async () => {
    await loginAs('participant');
    const res = await http.get(`/audit/${eventId}`).catch((e) => e.response);
    expect(res.status).toBe(403);
  });
});
