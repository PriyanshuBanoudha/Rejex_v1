import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventsApi } from '../api/client';
import { Plus, Search, Flag } from 'lucide-react';

interface Event {
  _id: string; title: string; description: string; status: string;
  submissionDeadline: string; maxTeamSize: number; tags: string[];
  organizerId: { name: string; email: string };
}

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: 'badge-gray' },
  open: { label: 'Open', cls: 'badge-green' },
  submissions_closed: { label: 'Closed', cls: 'badge-yellow' },
  judging: { label: 'Judging', cls: 'badge-blue' },
  voting: { label: 'Voting', cls: 'badge-purple' },
  ended: { label: 'Ended', cls: 'badge-gray' },
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await eventsApi.list(params);
      setEvents(data.events);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); fetchEvents(); };

  return (
    <div className="space-y-8 animate-in font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">Hackathon Events</h1>
          <p className="text-[#94A3B8] text-base mt-1">Discover, create, and submit hacks to active decentralized events</p>
        </div>
        <Link to="/events/new" className="btn-primary shrink-0 text-xs">
          <Plus className="w-4 h-4 mr-1" /> Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-6 shadow-[0_0_30px_-10px_rgba(247,147,26,0.1)]">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search events by title or description..."
              className="input pr-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-4 pointer-events-none" />
          </div>
          <select
            className="input sm:w-44 font-mono text-xs uppercase"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="" className="bg-[#0F1115] text-white">All Statuses</option>
            {Object.entries(statusMap).map(([k, v]) => (
              <option key={k} value={k} className="bg-[#0F1115] text-white">{v.label}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 space-y-4">
          <Flag className="w-12 h-12 mx-auto text-[#94A3B8]/40" />
          <h3 className="font-heading text-xl font-semibold text-white">No active hackathon events found</h3>
          <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">Try adjusting your search query or status filter to see open events.</p>
          <Link to="/events/new" className="btn-primary text-xs px-6 py-2.5 inline-flex">Create New Event</Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-4 font-mono text-xs">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-outline text-xs px-4 py-2 disabled:opacity-40"
            >← Prev</button>
            <span className="text-[#94A3B8] px-3">
              Showing {((page - 1) * 12) + 1}-{Math.min(page * 12, total)} of {total}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 12 >= total}
              className="btn-outline text-xs px-4 py-2 disabled:opacity-40"
            >Next →</button>
          </div>
        </>
      )}
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const status = statusMap[event.status] || { label: event.status, cls: 'badge-gray' };
  const deadline = new Date(event.submissionDeadline);
  const isOpen = event.status === 'open';

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F7931A]/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)] flex flex-col group relative overflow-hidden">
      {/* Top Gradient Accent */}
      <div className="h-1.5 bg-gradient-to-r from-[#EA580C] via-[#F7931A] to-[#FFD600] -mx-6 -mt-6 mb-6" />

      <div className="flex items-center justify-between mb-4">
        <span className={status.cls}>{status.label}</span>
        {isOpen && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F7931A] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F7931A]" />
            </span>
            <span className="font-mono text-xs uppercase text-[#F7931A]">Live Open</span>
          </div>
        )}
      </div>

      <h3 className="font-heading font-bold text-white text-xl mb-2 group-hover:text-[#F7931A] transition-colors line-clamp-2">
        {event.title}
      </h3>
      <p className="text-[#94A3B8] text-sm leading-relaxed mb-6 line-clamp-2 flex-1">
        {event.description}
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {event.tags?.slice(0, 3).map((tag) => (
          <span key={tag} className="font-mono text-[10px] uppercase tracking-wider px-2.5 py-1 bg-white/5 text-[#94A3B8] rounded-md border border-white/10">
            #{tag}
          </span>
        ))}
      </div>

      <div className="font-mono text-xs text-[#94A3B8]/70 mb-6 flex items-center justify-between">
        <span>by {event.organizerId?.name || 'Organizer'}</span>
        <span>Deadline: {deadline.toLocaleDateString()}</span>
      </div>

      <div className="flex gap-3 mt-auto">
        <Link to={`/events/${event._id}`} className="btn-outline text-xs flex-1 justify-center py-2.5">
          View Details
        </Link>
        <Link to={`/gallery/${event._id}`} className="btn-ghost text-xs px-4 py-2.5 font-mono uppercase">Gallery</Link>
      </div>
    </div>
  );
}
