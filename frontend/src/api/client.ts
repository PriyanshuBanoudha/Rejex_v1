import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 / token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        }
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; bio?: string }) => api.patch('/auth/me', data),
};

// ── Events ──────────────────────────────────────────
export const eventsApi = {
  list: (params?: Record<string, any>) => api.get('/events', { params }),
  get: (id: string) => api.get(`/events/${id}`),
  create: (data: Record<string, any>) => api.post('/events', data),
  update: (id: string, data: Record<string, any>) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  createTrack: (id: string, data: Record<string, any>) => api.post(`/events/${id}/tracks`, data),
  listTracks: (id: string) => api.get(`/events/${id}/tracks`),
};

// ── Teams ───────────────────────────────────────────
export const teamsApi = {
  create: (data: { eventId: string; name: string; description?: string }) =>
    api.post('/teams', data),
  join: (inviteCode: string) => api.post(`/teams/join/${inviteCode}`),
  get: (id: string) => api.get(`/teams/${id}`),
  mine: () => api.get('/teams/mine'),
  lock: (id: string) => api.patch(`/teams/${id}/lock`),
  leave: (id: string) => api.post(`/teams/${id}/leave`),
};

// ── Projects ─────────────────────────────────────────
export const projectsApi = {
  create: (data: Record<string, any>) => api.post('/projects', data),
  get: (id: string) => api.get(`/projects/${id}`),
  update: (id: string, data: Record<string, any>) => api.patch(`/projects/${id}`, data),
  submit: (id: string) => api.post(`/projects/${id}/submit`),
  myProject: (eventId: string) => api.get(`/projects/my/${eventId}`),
};

// ── Judging ──────────────────────────────────────────
export const judgingApi = {
  createRubric: (data: Record<string, any>) => api.post('/judging/rubrics', data),
  getRubric: (id: string) => api.get(`/judging/rubrics/${id}`),
  createInvite: (data: Record<string, any>) => api.post('/judging/invites', data),
  useInvite: (token: string) => api.post(`/judging/invites/use/${token}`),
  bulkAssign: (eventId: string, data?: Record<string, any>) =>
    api.post(`/judging/assign/${eventId}`, data || {}),
  manualAssign: (data: Record<string, any>) => api.post('/judging/assign-manual', data),
  getAssignments: () => api.get('/judging/assignments'),
  getProgress: (eventId: string) => api.get(`/judging/progress/${eventId}`),
  submitScore: (data: Record<string, any>) => api.post('/judging/scores', data),
  getMyScore: (projectId: string) => api.get(`/judging/scores/project/${projectId}`),
  normalize: (eventId: string) => api.post(`/judging/normalize/${eventId}`),
  getResults: (eventId: string, trackId?: string) =>
    api.get(`/judging/results/${eventId}`, { params: trackId ? { trackId } : {} }),
};

// ── Gallery & Voting ──────────────────────────────────
export const galleryApi = {
  get: (eventId: string, params?: Record<string, any>) =>
    api.get(`/gallery/${eventId}`, { params }),
  castVote: (projectId: string) => api.post('/votes', { projectId }),
  getVoteCount: (projectId: string) => api.get(`/votes/${projectId}`),
  addComment: (projectId: string, body: string) =>
    api.post('/comments', { projectId, body }),
  getComments: (projectId: string) => api.get(`/comments/${projectId}`),
  flagComment: (id: string) => api.post(`/comments/${id}/flag`),
};

// ── Export ───────────────────────────────────────────
export const exportApi = {
  scores: (eventId: string) =>
    api.get(`/export/scores/${eventId}`, { responseType: 'blob' }),
  projects: (eventId: string) =>
    api.get(`/export/projects/${eventId}`, { responseType: 'blob' }),
  importProjects: (eventId: string, projects: any[]) =>
    api.post('/export/import/projects', { eventId, projects }),
};

// ── Certificates ──────────────────────────────────────
export const certsApi = {
  generate: (eventId: string) => api.post(`/certs/generate/${eventId}`),
  get: (certId: string) => api.get(`/certs/${certId}`),
  verify: (certId: string) => api.get(`/certs/verify/${certId}`),
};

// ── Pairwise ──────────────────────────────────────────
export const pairwiseApi = {
  submit: (data: Record<string, any>) => api.post('/pairwise', data),
  getNext: (eventId: string) => api.get(`/pairwise/next/${eventId}`),
  getRankings: (eventId: string, trackId?: string) =>
    api.get(`/pairwise/rankings/${eventId}`, { params: trackId ? { trackId } : {} }),
};

// ── Audit ─────────────────────────────────────────────
export const auditApi = {
  getLogs: (eventId: string, params?: Record<string, any>) =>
    api.get(`/audit/${eventId}`, { params }),
};

export default api;
