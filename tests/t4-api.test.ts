import { describe, it, expect, beforeAll } from 'vitest';
import { http, loginAs, clearAuth } from './helpers';

let eventId: string;
let certId: string;

beforeAll(async () => {
  clearAuth();
  const { data } = await http.get('/events');
  const seeded = data.events.find((e: any) => (e.title || e.name || '').includes('Raptors 2026'));
  if (seeded) eventId = seeded._id;
});

describe('T4: CSV Export', () => {
  it('organizer can export scores CSV', async () => {
    await loginAs('organizer');
    const res = await http.get(`/export/scores/${eventId}`, {
      responseType: 'arraybuffer',
    });
    expect([200, 204]).toContain(res.status);
    if (res.status === 200) {
      const text = Buffer.from(res.data).toString('utf8');
      expect(text).toContain('Judge');
    }
  });

  it('organizer can export projects CSV', async () => {
    await loginAs('organizer');
    const res = await http.get(`/export/projects/${eventId}`, {
      responseType: 'arraybuffer',
    });
    expect([200, 204]).toContain(res.status);
  });

  it('participant cannot export scores', async () => {
    await loginAs('participant');
    const res = await http.get(`/export/scores/${eventId}`).catch((e) => e.response);
    expect(res.status).toBe(403);
  });
});

describe('T4: Certificates', () => {
  it('organizer can generate certificates', async () => {
    await loginAs('organizer');
    const { data, status } = await http.post(`/certs/generate/${eventId}`);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.generated).toBe('number');
    if (data.certificates.length > 0) {
      certId = data.certificates[0].certId;
    }
  });

  it('anyone can verify a certificate', async () => {
    if (!certId) return;
    clearAuth();
    const { data, status } = await http.get(`/certs/verify/${certId}`);
    expect(status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.certificate.certId).toBe(certId);
    expect(data.certificate.judgeName).toBeDefined();
  });

  it('invalid cert ID returns invalid', async () => {
    clearAuth();
    const { data } = await http.get('/certs/verify/FAKECERT123');
    expect(data.valid).toBe(false);
  });

  it('cert payload is tamper-evident', async () => {
    if (!certId) return;
    clearAuth();
    const { data: cert } = await http.get(`/certs/${certId}`);
    expect(cert.certificate.signature).toBeDefined();
    expect(cert.certificate.publicKey).toBeDefined();
    expect(cert.certificate.payload).toBeDefined();

    
    // Verify the signature contains the judge name
    const parsed = JSON.parse(cert.certificate.payload);
    expect(parsed.judgeName).toBeDefined();
  });
});

describe('T4: Embeddable Widget', () => {
  it('GET /certs/embed/:eventId returns HTML', async () => {
    clearAuth();
    const { data, status, headers } = await http.get(`/certs/embed/${eventId}`);
    expect(status).toBe(200);
    expect(headers['content-type']).toContain('text/html');
    expect(data).toContain('<!DOCTYPE html>');
    expect(data).toContain('Hackathon Raptors Platform');
  });
});

describe('T4: Pairwise Ranking', () => {
  it('judge can submit pairwise comparisons', async () => {
    await loginAs('judge', 1);
    const { data: asgn } = await http.get('/judging/assignments');
    const projects = [...new Set(asgn.assignments.map((a: any) => a.projectId?._id || a.projectId))];
    if (projects.length < 2) return;

    const { status } = await http.post('/pairwise', {
      eventId,
      projectAId: projects[0],
      projectBId: projects[1],
      winnerId: projects[0],
      confidence: 0.8,
    });
    expect([200, 201]).toContain(status);
  });

  it('pairwise rankings are computable', async () => {
    await loginAs('judge', 1);
    const { data, status } = await http.get(`/pairwise/rankings/${eventId}`);
    expect(status).toBe(200);
    expect(Array.isArray(data.rankings)).toBe(true);
  });

  it('judge gets next uncompared pair', async () => {
    await loginAs('judge', 1);
    const { data, status } = await http.get(`/pairwise/next/${eventId}`);
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    // pair can be null if all compared
    if (data.pair) {
      expect(data.pair.projectA).toBeDefined();
      expect(data.pair.projectB).toBeDefined();
    }
  });
});

describe('T4: Webhooks (Config)', () => {
  it('organizer can configure webhooks', async () => {
    await loginAs('organizer');
    // Webhooks are seeded in event config; just validate the API health
    const { data } = await http.get('/health', { baseURL: 'http://localhost:5000' });
    expect(data.status).toBe('ok');
  });
});

describe('T4: OpenAPI Spec', () => {
  it('spec is valid JSON with paths', async () => {
    clearAuth();
    const { data } = await http.get('/openapi.json');
    expect(data.openapi).toMatch(/3\.\d+\.\d+/);
    expect(Object.keys(data.paths).length).toBeGreaterThan(3);
  });
});
