import axios from 'axios';

const BASE = process.env.API_URL || 'http://localhost:5000/api';

export const http = axios.create({ baseURL: BASE, withCredentials: true });

let authToken: string | null = null;

export function setToken(token: string | null) { authToken = token; }

http.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

export async function loginAs(role: 'admin' | 'organizer' | 'judge' | 'participant', n = 1) {
  const emails: Record<string, string> = {
    admin: 'admin@hackathon.local',
    organizer: 'organizer@hackathon.local',
    judge: `judge${n}@hackathon.local`,
    participant: `participant${n}@hackathon.local`,
  };
  const { data } = await http.post('/auth/login', { email: emails[role], password: 'Password123!' });
  setToken(data.accessToken);
  return data;
}

export function clearAuth() { setToken(null); }
