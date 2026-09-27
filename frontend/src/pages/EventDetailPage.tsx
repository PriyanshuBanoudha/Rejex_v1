import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { eventsApi, teamsApi, judgingApi } from '../api/client';
import { Trophy, Calendar, Flag, Award, Tag, Key, UserCheck, Image, BarChart3, Clock } from 'lucide-react';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    eventsApi.get(id!).then(({ data }) => {
      setEvent(data.event);
      setTracks(data.tracks || []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    try {
      const { data } = await teamsApi.join(joinCode.trim());
      setMessage(`Joined team: ${data.team.name}!`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join team');
    }
  };

  const handleUseInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMessage('');
    setInviteLoading(true);
    try {
      const { data } = await judgingApi.useInvite(inviteToken.trim());
      setMessage(`Role updated to: ${data.role}! Please re-login.`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid invite token');
    } finally {
      setInviteLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!event) return <div className="text-center py-24 text-[#94A3B8] font-mono">Event record not found</div>;

  const now = new Date();
  const deadline = new Date(event.submissionDeadline);
  const deadlinePassed = now > deadline;

  return (
    <div className="space-y-8 animate-in font-body">
      {/* Hero Header */}
      <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-8 shadow-[0_0_50px_-10px_rgba(247,147,26,0.15)] relative overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-[#EA580C] via-[#F7931A] to-[#FFD600] -mx-8 -mt-8 mb-8" />
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              {event.votingEnabled && <span className="badge-purple">Voting Active</span>}
            </div>
            <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">{event.title}</h1>
            <p className="text-[#94A3B8] text-base leading-relaxed max-w-3xl">{event.description}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {event.tags?.map((tag: string) => (
                <span key={tag} className="font-mono text-xs uppercase px-3 py-1 bg-white/5 text-[#94A3B8] rounded-md border border-white/10 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#F7931A]" /> #{tag}
                </span>
              ))}
            </div>
          </div>
          {(user?.role === 'admin' || user?.role === 'organizer') && (
            <Link to={`/events/${id}/manage`} className="btn-outline text-xs px-6 py-3 shrink-0 font-mono uppercase">
              Manage Event
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Event Specs */}
        <div className="lg:col-span-2 space-y-8">
          {/* Timeline */}
          <div className="card">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-[#F7931A]" />
              <h2 className="font-heading text-xl font-semibold text-white">Event Timeline</h2>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Registration Window', start: event.registrationStart, end: event.registrationEnd },
                { label: 'Submission Window', start: event.submissionStart, end: event.submissionDeadline },
                ...(event.judgingStart ? [{ label: 'Judging Evaluation', start: event.judgingStart, end: event.judgingEnd }] : []),
                ...(event.votingStart ? [{ label: 'Community Voting', start: event.votingStart, end: event.votingEnd }] : []),
              ].map((phase) => (
                <div key={phase.label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <span className="text-white font-medium text-sm">{phase.label}</span>
                  <span className="font-mono text-xs text-[#94A3B8]">
                    {new Date(phase.start).toLocaleDateString()} → {new Date(phase.end).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tracks */}
          {tracks.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Flag className="w-5 h-5 text-[#F7931A]" />
                <h2 className="font-heading text-xl font-semibold text-white">Bounty Tracks</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {tracks.map((track: any) => (
                  <div key={track._id} className="p-4 bg-[#030304] rounded-xl border border-white/10">
                    <p className="font-heading font-medium text-white text-base">{track.name}</p>
                    {track.description && <p className="text-xs text-[#94A3B8] mt-1.5 leading-relaxed">{track.description}</p>}
                    {track.prizes?.length > 0 && (
                      <p className="font-mono text-xs text-[#FFD600] mt-3 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5" /> {track.prizes[0].title}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prizes */}
          {event.prizes?.length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-[#F7931A]" />
                <h2 className="font-heading text-xl font-semibold text-white">Prize Pool</h2>
              </div>
              <div className="space-y-3">
                {event.prizes.map((prize: any) => (
                  <div key={prize.place} className="flex items-center gap-4 p-4 bg-[#030304] rounded-xl border border-white/10">
                    <span className="font-mono text-xl text-[#FFD600] font-bold">#{prize.place}</span>
                    <div>
                      <p className="font-heading font-medium text-white text-sm">{prize.title}</p>
                      <p className="text-xs text-[#94A3B8]">{prize.description} {prize.value && `· ${prize.value}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          {/* Gallery / Results */}
          <div className="card space-y-3">
            <Link to={`/gallery/${id}`} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase">
              <Image className="w-4 h-4 mr-2 text-[#F7931A]" /> View Gallery
            </Link>
            {event.resultsRevealed && (
              <Link to={`/results/${id}`} className="btn-primary w-full justify-center text-xs py-3 font-mono uppercase">
                <BarChart3 className="w-4 h-4 mr-2" /> View Final Results
              </Link>
            )}
          </div>

          {/* Join Team */}
          {user && user.role === 'participant' && event.status === 'open' && (
            <div className="card space-y-4">
              <h3 className="font-heading font-semibold text-white text-base">Join Team by Code</h3>
              <form onSubmit={handleJoinTeam} className="space-y-3">
                <input type="text" className="input font-mono text-xs" placeholder="ENTER-INVITE-CODE" value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)} />
                <button type="submit" className="btn-primary w-full justify-center text-xs py-3">Join Roster</button>
              </form>
            </div>
          )}

          {/* Use Invite Token */}
          {user && (
            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#F7931A]" />
                <h3 className="font-heading font-semibold text-white text-base">Claim Role Token</h3>
              </div>
              <form onSubmit={handleUseInvite} className="space-y-3">
                <input type="text" className="input font-mono text-xs" placeholder="Judge or Organizer Token"
                  value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} />
                <button type="submit" disabled={inviteLoading} className="btn-outline w-full justify-center text-xs py-3 font-mono uppercase">
                  {inviteLoading ? 'Applying...' : 'Apply Token'}
                </button>
              </form>
            </div>
          )}

          {/* Submit project */}
          {user?.role === 'participant' && !deadlinePassed && (
            <Link to={`/submit/${id}`} className="btn-primary w-full justify-center block text-center text-xs py-3.5">
              Submit Hack Project
            </Link>
          )}

          {deadlinePassed && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 font-mono text-xs text-center flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-red-400" /> Submission deadline passed
            </div>
          )}

          {/* Feedback messages */}
          {message && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">{message}</div>}
          {error && <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs">{error}</div>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'badge-gray', open: 'badge-green', submissions_closed: 'badge-yellow',
    judging: 'badge-blue', voting: 'badge-purple', ended: 'badge-gray',
  };
  return <span className={map[status] || 'badge-gray'}>{status.replace('_', ' ')}</span>;
}
