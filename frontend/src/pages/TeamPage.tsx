import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { teamsApi, projectsApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { Users, Lock, Unlock, Copy, Check, LogOut, Code } from 'lucide-react';

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [team, setTeam] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    teamsApi.get(id!).then(async ({ data }) => {
      setTeam(data.team);
      if (data.team.eventId) {
        const pid = typeof data.team.eventId === 'object' ? data.team.eventId._id : data.team.eventId;
        const pr = await projectsApi.myProject(pid).catch(() => ({ data: { project: null } }));
        setProject(pr.data.project);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  const handleLeave = async () => {
    if (!window.confirm('Leave this team?')) return;
    try {
      await teamsApi.leave(id!);
      setMsg('Left team');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Failed to leave');
    }
  };

  const handleLock = async () => {
    try {
      const { data } = await teamsApi.lock(id!);
      setTeam(data.team);
      setMsg('Team locked!');
    } catch (e: any) {
      setMsg(e.response?.data?.message || 'Failed to lock');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(team.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>;
  if (!team) return <div className="text-center py-24 text-[#94A3B8] font-mono text-sm">Team record not found</div>;

  const isLeader = team.leaderId?._id === user?.id || team.leaderId === user?.id;
  const isMember = team.members?.some((m: any) => (m._id || m) === user?.id);

  return (
    <div className="space-y-8 animate-in max-w-3xl mx-auto font-body">
      <div>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">{team.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className={team.status === 'locked' ? 'badge-red' : 'badge-green'}>
            {team.status === 'locked' ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
            {team.status === 'locked' ? 'Locked' : 'Open'}
          </span>
          <span className="font-mono text-xs text-[#94A3B8]">{team.members?.length} active members</span>
        </div>
      </div>

      {msg && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">{msg}</div>}

      {/* Invite Code */}
      {isMember && (
        <div className="card space-y-4">
          <h2 className="font-heading text-xl font-semibold text-white">Team Invite Code</h2>
          <div className="flex items-center gap-3">
            <code className="flex-1 px-4 py-3 bg-[#030304] rounded-xl text-[#FFD600] font-mono text-lg tracking-widest border border-white/10 select-all">
              {team.inviteCode}
            </code>
            <button onClick={copyCode} className="btn-outline text-xs px-4 py-3 font-mono uppercase flex items-center gap-1.5">
              {copied ? <Check className="w-4 h-4 text-[#FFD600]" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#F7931A]" />
          <h2 className="font-heading text-xl font-semibold text-white">Roster Members</h2>
        </div>
        <div className="space-y-3">
          {team.members?.map((m: any) => (
            <div key={m._id || m} className="flex items-center justify-between p-4 bg-[#030304] rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-white text-xs font-mono font-bold">
                  {(m.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-heading font-medium text-white text-sm">{m.name}</p>
                  <p className="font-mono text-xs text-[#94A3B8]">{m.email}</p>
                </div>
              </div>
              {(team.leaderId?._id === m._id || team.leaderId === m._id) && (
                <span className="badge-bitcoin">Leader</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Project */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#F7931A]" />
          <h2 className="font-heading text-xl font-semibold text-white">Linked Submission</h2>
        </div>
        {project ? (
          <div className="p-4 bg-[#030304] rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-heading font-bold text-white text-base">{project.title}</h3>
              <span className={project.status === 'submitted' ? 'badge-green' : 'badge-gray'}>{project.status}</span>
            </div>
            <p className="text-sm text-[#94A3B8]">{project.description}</p>
          </div>
        ) : (
          <div className="text-center py-6 text-[#94A3B8] space-y-3">
            <p className="text-sm">No hackathon project submitted for this team yet.</p>
            {isMember && team.eventId && (
              <Link to={`/submit/${typeof team.eventId === 'object' ? team.eventId._id : team.eventId}`} className="btn-primary text-xs px-6 py-2.5 inline-flex">
                Submit Project →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {isMember && (
        <div className="flex gap-4 pt-2">
          {isLeader && team.status !== 'locked' && (
            <button onClick={handleLock} className="btn-outline text-xs px-6 py-3 font-mono uppercase flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Lock Team
            </button>
          )}
          <button onClick={handleLeave} className="btn-danger text-xs px-6 py-3 font-mono uppercase ml-auto flex items-center gap-1.5">
            <LogOut className="w-4 h-4" /> Leave Team
          </button>
        </div>
      )}
    </div>
  );
}
