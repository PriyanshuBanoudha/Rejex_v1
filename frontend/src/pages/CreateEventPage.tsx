import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsApi } from '../api/client';
import { ArrowLeft, Calendar, Flag, Users } from 'lucide-react';

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 16);

  const [form, setForm] = useState({
    title: '', description: '', tags: '',
    registrationStart: fmt(now),
    registrationEnd: fmt(new Date(now.getTime() + 14 * 86400000)),
    submissionStart: fmt(new Date(now.getTime() + 7 * 86400000)),
    submissionDeadline: fmt(new Date(now.getTime() + 21 * 86400000)),
    judgingStart: fmt(new Date(now.getTime() + 21 * 86400000)),
    judgingEnd: fmt(new Date(now.getTime() + 28 * 86400000)),
    maxTeamSize: 4, minTeamSize: 1,
    allowSoloParticipants: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await eventsApi.create({
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      });
      navigate(`/events/${data.event._id}/manage`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: string) => ({
    value: (form as any)[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value })),
  });

  return (
    <div className="space-y-8 animate-in max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Create Hackathon Event</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Configure event specifications, timelines, and team limits</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn-outline text-xs px-4 py-2 font-mono uppercase flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs">{error}</div>}

        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-5 h-5 text-[#F7931A]" />
            <h2 className="font-heading text-xl font-semibold text-white">General Information</h2>
          </div>
          <div>
            <label className="label">Event Title *</label>
            <input id="event-title" type="text" className="input" placeholder="e.g. Bitcoin DeFi Hackathon 2026" {...field('title')} required />
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input text-sm resize-none" rows={4} placeholder="Describe the mission, scope, and objectives of the event..." {...field('description')} required />
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input type="text" className="input font-mono text-xs" placeholder="bitcoin, defi, zksnarks, ordinals" {...field('tags')} />
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-[#F7931A]" />
            <h2 className="font-heading text-xl font-semibold text-white">Event Timeline Configuration</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              ['registrationStart', 'Registration Start'], ['registrationEnd', 'Registration End'],
              ['submissionStart', 'Submission Start'], ['submissionDeadline', 'Submission Deadline'],
              ['judgingStart', 'Judging Start'], ['judgingEnd', 'Judging End'],
            ].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label} *</label>
                <input type="datetime-local" className="input font-mono text-xs" {...field(key)} required={!key.startsWith('judging') || undefined} />
              </div>
            ))}
          </div>
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-[#F7931A]" />
            <h2 className="font-heading text-xl font-semibold text-white">Team Parameters</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Max Team Size</label>
              <input type="number" min={1} max={10} className="input font-mono text-xs" {...field('maxTeamSize')} />
            </div>
            <div>
              <label className="label">Min Team Size</label>
              <input type="number" min={1} max={10} className="input font-mono text-xs" {...field('minTeamSize')} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer pt-2">
            <input type="checkbox" checked={form.allowSoloParticipants}
              onChange={(e) => setForm((p) => ({ ...p, allowSoloParticipants: e.target.checked }))}
              className="w-4 h-4 accent-[#F7931A] rounded bg-black/50 border-white/20" />
            <span className="text-[#94A3B8] text-sm">Allow solo builder submissions</span>
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline text-xs px-6 py-3 font-mono uppercase">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary text-xs flex-1 justify-center py-3">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
              : 'Create Hackathon Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
