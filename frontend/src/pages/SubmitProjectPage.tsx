import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/client';
import { ArrowLeft, Save, Send } from 'lucide-react';

export default function SubmitProjectPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ title: '', description: '', repoUrl: '', demoUrl: '', videoUrl: '', tags: '' });

  useEffect(() => {
    projectsApi.myProject(eventId!).then(({ data }) => {
      if (data.project) {
        const p = data.project;
        setProject(p);
        setForm({ title: p.title, description: p.description, repoUrl: p.repoUrl || '', demoUrl: p.demoUrl || '', videoUrl: p.videoUrl || '', tags: (p.tags || []).join(', ') });
      }
    }).finally(() => setLoading(false));
  }, [eventId]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const payload = { ...form, tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) };
      if (project) {
        const { data } = await projectsApi.update(project._id, payload);
        setProject(data.project);
      } else {
        const { data } = await projectsApi.create({ ...payload, eventId });
        setProject(data.project);
      }
      setMsg('Project draft saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project draft');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!project) return;
    if (!window.confirm('Submit project to judging panel? Major edits will be locked.')) return;
    setSubmitting(true);
    try {
      await projectsApi.submit(project._id);
      setMsg('Project submitted to judging panel!');
      setTimeout(() => navigate(`/events/${eventId}`), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit project');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in max-w-3xl mx-auto font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">
            {project ? 'Edit Project Specs' : 'Submit Hackathon Project'}
          </h1>
          <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mt-1">
            Status: {project?.status === 'submitted' ? <span className="text-[#FFD600]">Submitted</span> : <span className="text-[#F7931A]">Draft Mode</span>}
          </p>
        </div>
        <button onClick={() => navigate(`/events/${eventId}`)} className="btn-outline text-xs px-4 py-2 font-mono uppercase flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
        </button>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs">{error}</div>}
      {msg && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">{msg}</div>}

      <form onSubmit={save} className="card space-y-5">
        <div>
          <label className="label">Project Title *</label>
          <input type="text" className="input" placeholder="e.g. Lightning Paywall SDK" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div>
          <label className="label">Full Description *</label>
          <textarea className="input text-sm resize-none" rows={5} placeholder="Describe problem, solution, architecture, and tech stack..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Repository Link</label>
            <input type="url" className="input font-mono text-xs" placeholder="https://github.com/org/repo" value={form.repoUrl} onChange={(e) => setForm({ ...form, repoUrl: e.target.value })} />
          </div>
          <div>
            <label className="label">Live Demo Link</label>
            <input type="url" className="input font-mono text-xs" placeholder="https://demo.project.org" value={form.demoUrl} onChange={(e) => setForm({ ...form, demoUrl: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Demo Video Link (Optional)</label>
          <input type="url" className="input font-mono text-xs" placeholder="https://youtube.com/watch?v=..." value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
        </div>
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input type="text" className="input font-mono text-xs" placeholder="bitcoin, lightning, react, rust" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
        </div>
        <button type="submit" disabled={saving} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase flex items-center gap-2">
          <Save className="w-4 h-4 text-[#F7931A]" />
          {saving ? 'Saving Draft...' : 'Save Draft Specs'}
        </button>
      </form>

      {project && project.status !== 'submitted' && (
        <div className="rounded-2xl border border-[#F7931A]/40 bg-[#0F1115] p-6 shadow-[0_0_30px_-10px_rgba(247,147,26,0.15)] space-y-4">
          <h3 className="font-heading font-semibold text-white text-lg">Ready for Judging Panel Evaluation?</h3>
          <p className="text-sm text-[#94A3B8]">Once submitted, your project will be assigned to judging rosters and unlocked for public gallery voting.</p>
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full justify-center text-xs py-3.5 flex items-center gap-2">
            <Send className="w-4 h-4" />
            {submitting ? 'Submitting to Roster...' : 'Submit Final Project to Judges'}
          </button>
        </div>
      )}
    </div>
  );
}
