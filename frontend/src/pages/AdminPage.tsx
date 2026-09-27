import React, { useEffect, useState } from 'react';
import { eventsApi } from '../api/client';
import { Link } from 'react-router-dom';
import { ShieldCheck, Plus, ExternalLink } from 'lucide-react';

export default function AdminPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    eventsApi.list({ limit: 100 }).then(({ data }) => setEvents(data.events)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-in font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-[#F7931A]" /> Platform Governance
          </h1>
          <p className="text-[#94A3B8] text-base mt-1">Global platform oversight, event status management, and audit inspection</p>
        </div>
        <Link to="/events/new" className="btn-primary text-xs px-5 py-3 shrink-0 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Create Hackathon Event
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: 'Total Events', value: events.length, color: 'text-[#F7931A]' },
          { label: 'Active Pipeline', value: events.filter((e) => ['open', 'judging', 'voting'].includes(e.status)).length, color: 'text-[#FFD600]' },
          { label: 'Completed Events', value: events.filter((e) => e.status === 'ended').length, color: 'text-[#94A3B8]' },
          { label: 'Draft Mode', value: events.filter((e) => e.status === 'draft').length, color: 'text-amber-500' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className={`stat-value text-3xl ${s.color}`}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0F1115] overflow-hidden shadow-[0_0_50px_-10px_rgba(247,147,26,0.1)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body">
              <thead>
                <tr className="border-b border-white/10 bg-[#030304]/80 text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                  <th className="py-4 px-6">Event Title</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Organizer</th>
                  <th className="py-4 px-6">Submission Deadline</th>
                  <th className="py-4 px-6">Management</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-xs text-[#94A3B8]">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-6 font-heading font-medium text-white text-sm">{event.title}</td>
                    <td className="py-4 px-6">
                      <span className={statusBadgeCls(event.status)}>{event.status.replace('_', ' ')}</span>
                    </td>
                    <td className="py-4 px-6 text-[#94A3B8]">{event.organizerId?.name || 'Organizer'}</td>
                    <td className="py-4 px-6 text-[#94A3B8]/70">{new Date(event.submissionDeadline).toLocaleDateString()}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Link to={`/events/${event._id}`} className="text-[#F7931A] hover:underline">View</Link>
                        <Link to={`/events/${event._id}/manage`} className="text-white hover:underline">Manage</Link>
                        <Link to={`/audit/${event._id}`} className="text-[#94A3B8] hover:underline">Audit</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* API Integrations */}
      <div className="card space-y-4">
        <h2 className="font-heading text-xl font-semibold text-white">Developer API & OpenAPI Ecosystem</h2>
        <p className="text-sm text-[#94A3B8]">Self-hostable API specification endpoints for algorithmic programmatic management.</p>
        <div className="flex flex-wrap gap-4 pt-2 font-mono text-xs">
          <a href="/api/openapi.json" target="_blank" rel="noopener noreferrer" className="btn-outline text-xs px-4 py-2.5 flex items-center gap-1.5">
            OpenAPI Spec <ExternalLink className="w-3.5 h-3.5 text-[#F7931A]" />
          </a>
          <a href="/health" target="_blank" rel="noopener noreferrer" className="btn-outline text-xs px-4 py-2.5 flex items-center gap-1.5">
            System Health Ping <ExternalLink className="w-3.5 h-3.5 text-[#FFD600]" />
          </a>
        </div>
      </div>
    </div>
  );
}

function statusBadgeCls(status: string) {
  const map: Record<string, string> = {
    draft: 'badge-gray',
    open: 'badge-green',
    submissions_closed: 'badge-yellow',
    judging: 'badge-blue',
    voting: 'badge-purple',
    ended: 'badge-gray',
  };
  return map[status] || 'badge-gray';
}
