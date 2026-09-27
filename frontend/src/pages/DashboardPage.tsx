import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { teamsApi, eventsApi } from '../api/client';
import { Users, Flag, Shield, ArrowRight, Plus, Trophy, Settings, LayoutGrid } from 'lucide-react';

interface Team { _id: string; name: string; inviteCode: string; eventId: any; status: string; members: any[] }
interface Event { _id: string; title: string; status: string; submissionDeadline: string }

export default function DashboardPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      teamsApi.mine().then((r) => setTeams(r.data.teams)),
      eventsApi.list({ limit: 5 }).then((r) => setEvents(r.data.events)),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statsConfig = [
    { label: 'My Teams', value: teams.length, icon: Users, color: 'text-[#F7931A]' },
    { label: 'Active Events', value: events.filter(e => ['open', 'submissions_closed', 'judging', 'voting'].includes(e.status)).length, icon: Flag, color: 'text-[#FFD600]' },
    { label: 'Role Authority', value: user?.role || '', icon: Shield, color: 'text-amber-400' },
  ];

  return (
    <div className="space-y-8 animate-in font-body">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#EA580C] via-[#F7931A] to-[#FFD600] rounded-2xl flex items-center justify-center text-black text-2xl font-heading font-bold shadow-[0_0_30px_rgba(247,147,26,0.4)]">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="font-mono text-xs text-[#94A3B8] uppercase tracking-wider mt-1">
            {user?.role} <span className="text-[#F7931A]">·</span> {user?.email}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {statsConfig.map((s) => {
          const IconComp = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="flex justify-center mb-3">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#F7931A]">
                  <IconComp className="w-6 h-6" strokeWidth={1.5} />
                </div>
              </div>
              <div className={`stat-value capitalize ${s.color}`}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* My Teams */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-white">My Teams</h2>
            <Link to="/events" className="text-[#F7931A] hover:underline text-xs font-mono uppercase tracking-wider flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Join Event
            </Link>
          </div>
          {teams.length === 0 ? (
            <div className="text-center py-10 text-[#94A3B8] space-y-3">
              <Users className="w-10 h-10 mx-auto text-[#94A3B8]/40" />
              <p className="text-sm">You are not registered in any team active roster.</p>
              <Link to="/events" className="btn-primary text-xs px-6 py-2.5 inline-flex">Browse Events</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team._id} className="flex items-center justify-between p-4 bg-[#030304] rounded-xl border border-white/10 hover:border-[#F7931A]/40 transition-all">
                  <div>
                    <p className="font-heading font-medium text-white text-base">{team.name}</p>
                    <p className="font-mono text-xs text-[#94A3B8] mt-1">
                      {typeof team.eventId === 'object' ? team.eventId?.title : 'Event'} · {team.members?.length || 0} members
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={team.status === 'locked' ? 'badge-red' : 'badge-green'}>
                      {team.status}
                    </span>
                    <Link to={`/teams/${team._id}`} className="btn-ghost text-xs px-3 py-1 font-mono uppercase">View →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="font-heading text-xl font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            {user?.role === 'participant' && (
              <>
                <Link to="/events" className="flex items-center gap-4 p-4 rounded-xl bg-[#030304] hover:bg-white/5 border border-white/10 hover:border-[#F7931A]/50 transition-all group">
                  <div className="p-2.5 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#F7931A]">
                    <Flag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-heading font-medium text-white text-sm group-hover:text-[#F7931A] transition-colors">Join an Event</p>
                    <p className="text-xs text-[#94A3B8]">Browse open events and register a team</p>
                  </div>
                </Link>
                <Link to="/events" className="flex items-center gap-4 p-4 rounded-xl bg-[#030304] hover:bg-white/5 border border-white/10 hover:border-[#F7931A]/50 transition-all group">
                  <div className="p-2.5 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#F7931A]">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-heading font-medium text-white text-sm group-hover:text-[#F7931A] transition-colors">Submit a Project</p>
                    <p className="text-xs text-[#94A3B8]">Create or edit your submission</p>
                  </div>
                </Link>
              </>
            )}
            {(user?.role === 'organizer' || user?.role === 'admin') && (
              <Link to="/events/new" className="flex items-center gap-4 p-4 rounded-xl bg-[#030304] hover:bg-white/5 border border-white/10 hover:border-[#F7931A]/50 transition-all group">
                <div className="p-2.5 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#F7931A]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-heading font-medium text-white text-sm group-hover:text-[#F7931A] transition-colors">Create New Event</p>
                  <p className="text-xs text-[#94A3B8]">Configure tracks, timelines, and weighted rubrics</p>
                </div>
              </Link>
            )}
            {(user?.role === 'judge' || user?.role === 'admin') && (
              <Link to="/judge" className="flex items-center gap-4 p-4 rounded-xl bg-[#F7931A]/10 hover:bg-[#F7931A]/20 border border-[#F7931A]/40 transition-all group">
                <div className="p-2.5 rounded-lg bg-[#F7931A]/20 border border-[#F7931A]/50 text-[#FFD600]">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-heading font-medium text-[#FFD600] text-sm">Judge Portal</p>
                  <p className="text-xs text-[#F7931A]">Evaluate assigned projects & submit rubric scores</p>
                </div>
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-4 p-4 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 transition-all group">
                <div className="p-2.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-heading font-medium text-red-300 text-sm">Admin Control Panel</p>
                  <p className="text-xs text-red-400/80">Platform system oversight & audit logs</p>
                </div>
              </Link>
            )}
            <Link to="/events" className="flex items-center gap-4 p-4 rounded-xl bg-[#030304] hover:bg-white/5 border border-white/10 hover:border-[#F7931A]/50 transition-all group">
              <div className="p-2.5 rounded-lg bg-[#EA580C]/20 border border-[#EA580C]/40 text-[#F7931A]">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <p className="font-heading font-medium text-white text-sm group-hover:text-[#F7931A] transition-colors">Public Project Gallery</p>
                <p className="text-xs text-[#94A3B8]">Browse submitted hacks & cast community votes</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Events Table */}
      {events.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-xl font-semibold text-white">Recent Hackathon Events</h2>
            <Link to="/events" className="text-[#F7931A] hover:underline font-mono text-xs uppercase tracking-wider flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Status</th>
                  <th>Submission Deadline</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id}>
                    <td className="font-heading font-medium text-white">{event.title}</td>
                    <td><StatusBadge status={event.status} /></td>
                    <td className="font-mono text-xs text-[#94A3B8]">{new Date(event.submissionDeadline).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/events/${event._id}`} className="text-[#F7931A] hover:underline font-mono text-xs uppercase">
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
