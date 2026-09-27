import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventsApi, judgingApi, exportApi, certsApi } from '../api/client';
import { ArrowLeft, Settings, Award, Download, Copy, RefreshCw, Key } from 'lucide-react';

export default function ManageEventPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<any>(null);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [inviteCreating, setInviteCreating] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<string>('');

  useEffect(() => {
    Promise.all([
      eventsApi.get(id!).then(({ data }) => setEvent(data.event)),
      judgingApi.getProgress(id!).then(({ data }) => setProgress(data.progress)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (status: string) => {
    try {
      const { data } = await eventsApi.update(id!, { status });
      setEvent(data.event);
      setMsg(`Status updated to ${status}`);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to update status'); }
  };

  const bulkAssign = async () => {
    try {
      const { data } = await judgingApi.bulkAssign(id!, { judgesPerProject: 2 });
      setMsg(`Assigned ${data.assigned} judge slots`);
      judgingApi.getProgress(id!).then(({ data: d }) => setProgress(d.progress));
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to assign judges'); }
  };

  const normalize = async () => {
    try {
      await judgingApi.normalize(id!);
      setMsg('Z-score normalization complete');
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to run normalization'); }
  };

  const reveal = async () => {
    try {
      const { data } = await eventsApi.update(id!, { resultsRevealed: true });
      setEvent(data.event);
      setMsg('Results revealed to participants!');
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to reveal results'); }
  };

  const exportCSV = async (type: 'scores' | 'projects') => {
    try {
      const { data } = type === 'scores' ? await exportApi.scores(id!) : await exportApi.projects(id!);
      const blob = new Blob([data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${type}-${id}.csv`; a.click();
    } catch (e: any) { setErr('Export failed'); }
  };

  const generateCerts = async () => {
    try {
      const { data } = await certsApi.generate(id!);
      setMsg(`Generated ${data.generated} certificate(s)`);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to generate certificates'); }
  };

  const createJudgeInvite = async () => {
    setInviteCreating(true);
    try {
      const { data } = await judgingApi.createInvite({ eventId: id, role: 'judge', maxUses: 10, expiresInHours: 72 });
      setCreatedInvite(data.invite.token);
    } catch (e: any) { setErr(e.response?.data?.message || 'Failed to create invite token'); }
    finally { setInviteCreating(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>;
  if (!event) return <div className="text-center py-24 text-[#94A3B8] font-mono text-sm">Event record not found</div>;

  const statuses = ['draft', 'open', 'submissions_closed', 'judging', 'voting', 'ended'];

  return (
    <div className="space-y-8 animate-in font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#F7931A]" /> Manage: {event.title}
          </h1>
          <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mt-1">Status: <span className="text-[#FFD600]">{event.status.replace('_', ' ')}</span></p>
        </div>
        <Link to={`/events/${id}`} className="btn-outline text-xs px-4 py-2.5 font-mono uppercase shrink-0 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> View Public Page
        </Link>
      </div>

      {msg && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">{msg}</div>}
      {err && <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs">{err}</div>}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Status Control */}
        <div className="card space-y-4">
          <h2 className="font-heading text-xl font-semibold text-white">Event State Machine</h2>
          <div className="flex flex-wrap gap-2">
            {statuses.map((s) => (
              <button key={s} onClick={() => updateStatus(s)}
                className={`px-3 py-2 rounded-xl text-xs font-mono uppercase tracking-wider border transition-all ${
                  event.status === s
                    ? 'bg-[#F7931A] border-[#F7931A] text-black font-bold shadow-[0_0_20px_rgba(247,147,26,0.3)]'
                    : 'bg-[#030304] border-white/10 text-[#94A3B8] hover:border-[#F7931A]'
                }`}>
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 pt-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={event.votingEnabled}
                onChange={async (e) => {
                  const { data } = await eventsApi.update(id!, { votingEnabled: e.target.checked });
                  setEvent(data.event);
                }} className="w-4 h-4 accent-[#F7931A] rounded bg-black/50 border-white/20" />
              <span className="text-white text-sm">Enable community voting algorithm</span>
            </label>
            {!event.resultsRevealed ? (
              <button onClick={reveal} className="btn-primary w-full justify-center text-xs py-3 font-mono uppercase">
                Reveal Final Rankings to Public
              </button>
            ) : (
              <Link to={`/results/${id}`} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase block text-center">
                View Public Results Table
              </Link>
            )}
          </div>
        </div>

        {/* Judging Controls */}
        <div className="card space-y-4">
          <h2 className="font-heading text-xl font-semibold text-white">Judge Roster & Normalization</h2>
          <div className="space-y-3">
            <button onClick={createJudgeInvite} disabled={inviteCreating} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase flex items-center gap-2">
              <Key className="w-4 h-4 text-[#F7931A]" />
              {inviteCreating ? 'Creating Token...' : 'Create Judge Invite Token'}
            </button>
            {createdInvite && (
              <div className="p-4 bg-[#030304] rounded-xl border border-white/10 space-y-2">
                <p className="text-xs text-[#94A3B8] font-mono">Share this token with judges:</p>
                <code className="text-[#FFD600] text-xs font-mono break-all select-all">{createdInvite}</code>
              </div>
            )}
            <button onClick={bulkAssign} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#F7931A]" /> Auto-Assign Judge Roster (2/project)
            </button>
            <button onClick={normalize} className="btn-primary w-full justify-center text-xs py-3 font-mono uppercase flex items-center gap-2">
              Compute Z-Score Normalization
            </button>
          </div>
        </div>

        {/* Judge Progress */}
        {progress.length > 0 && (
          <div className="card lg:col-span-2 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-white">Judge Completion Stream</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-white/10 bg-[#030304] text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-3 px-4">Judge</th>
                    <th className="py-3 px-4">Assigned</th>
                    <th className="py-3 px-4">Completed</th>
                    <th className="py-3 px-4">Progress Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs text-[#94A3B8]">
                  {progress.map((p: any) => (
                    <tr key={p.judgeId}>
                      <td className="py-3 px-4 font-medium text-white">{p.judgeName}</td>
                      <td className="py-3 px-4">{p.total}</td>
                      <td className="py-3 px-4 text-[#FFD600]">{p.completed}</td>
                      <td className="py-3 px-4 w-48">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${p.completionPct}%` }} />
                        </div>
                        <span className="text-[10px] text-[#94A3B8]/70 mt-1 block">{p.completionPct}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export & Certs */}
        <div className="card space-y-4">
          <h2 className="font-heading text-xl font-semibold text-white">Exports & Credentials</h2>
          <div className="space-y-3 font-mono text-xs">
            <button onClick={() => exportCSV('scores')} className="btn-outline w-full justify-center text-xs py-3 uppercase flex items-center gap-2">
              <Download className="w-4 h-4 text-[#F7931A]" /> Export Scores CSV
            </button>
            <button onClick={() => exportCSV('projects')} className="btn-outline w-full justify-center text-xs py-3 uppercase flex items-center gap-2">
              <Download className="w-4 h-4 text-[#FFD600]" /> Export Projects CSV
            </button>
            <button onClick={generateCerts} className="btn-outline w-full justify-center text-xs py-3 uppercase flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" /> Issue Ed25519 Certificates
            </button>
          </div>
        </div>

        {/* Links */}
        <div className="card space-y-4">
          <h2 className="font-heading text-xl font-semibold text-white">Event Navigation</h2>
          <div className="space-y-3 font-mono text-xs">
            <Link to={`/gallery/${id}`} className="btn-outline w-full justify-center text-xs py-3 uppercase block text-center">Project Gallery</Link>
            <Link to={`/audit/${id}`} className="btn-outline w-full justify-center text-xs py-3 uppercase block text-center">Security Audit Logs</Link>
            <Link to={`/results/${id}`} className="btn-outline w-full justify-center text-xs py-3 uppercase block text-center">Final Leaderboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
