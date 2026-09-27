import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { galleryApi } from '../api/client';
import { Search, Heart, MessageSquare, ExternalLink, ArrowLeft } from 'lucide-react';

export default function GalleryPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [seed] = useState(() => Math.floor(Math.random() * 100000));

  const load = async (s = '') => {
    setLoading(true);
    try {
      const { data } = await galleryApi.get(eventId!, { search: s, seed });
      setProjects(data.projects);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [eventId]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(search); };

  const handleVote = async (projectId: string) => {
    try {
      await galleryApi.castVote(projectId);
      setVoted((prev) => ({ ...prev, [projectId]: true }));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to vote');
    }
  };

  return (
    <div className="space-y-8 animate-in font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">Project Gallery</h1>
          <p className="text-[#94A3B8] text-base mt-1">Discover all submitted hacks · {projects.length} submissions</p>
        </div>
        <Link to={`/events/${eventId}`} className="btn-outline text-xs px-4 py-2.5 font-mono uppercase shrink-0 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
        </Link>
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-6 shadow-[0_0_30px_-10px_rgba(247,147,26,0.1)]">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <input type="text" placeholder="Search projects by title, description, or tags..."
              className="input pr-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3.5 top-4 pointer-events-none" />
          </div>
          <button type="submit" className="btn-primary text-xs">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-24 space-y-3">
          <Search className="w-12 h-12 mx-auto text-[#94A3B8]/40" />
          <h3 className="font-heading text-xl font-semibold text-white">No gallery submissions found</h3>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <ProjectCard
              key={p._id}
              project={p}
              canVote={!!user && user.role === 'participant'}
              hasVoted={!!voted[p._id]}
              onVote={() => handleVote(p._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p, canVote, hasVoted, onVote }: {
  project: any; canVote: boolean; hasVoted: boolean; onVote: () => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const { user } = useAuth();

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const { data } = await galleryApi.getComments(p._id);
      setComments(data.comments);
    } finally {
      setLoadingComments(false);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await galleryApi.addComment(p._id, newComment.trim());
      setComments((prev) => [data.comment, ...prev]);
      setNewComment('');
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#F7931A]/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)] flex flex-col group relative overflow-hidden">
      {/* Top Accent Gradient */}
      <div className="h-1.5 bg-gradient-to-r from-[#EA580C] via-[#F7931A] to-[#FFD600] -mx-6 -mt-6 mb-4" />

      {/* Track & Team */}
      <div className="flex items-center justify-between mb-3">
        {p.trackId?.name ? <span className="badge-purple">{p.trackId.name}</span> : <span className="badge-gray">General Track</span>}
        <span className="font-mono text-xs text-[#94A3B8]">{p.teamId?.name || 'Team'}</span>
      </div>

      <h3 className="font-heading font-bold text-white text-xl mb-2 group-hover:text-[#F7931A] transition-colors line-clamp-1">{p.title}</h3>
      <p className="text-[#94A3B8] text-sm leading-relaxed line-clamp-3 mb-6 flex-1">{p.description}</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {p.tags?.slice(0, 4).map((tag: string) => (
          <span key={tag} className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 bg-white/5 text-[#94A3B8] rounded border border-white/10">#{tag}</span>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6 font-mono text-xs">
        {p.repoUrl && (
          <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1">
            Repo <ExternalLink className="w-3 h-3" />
          </a>
        )}
        {p.demoUrl && (
          <a href={p.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
            Demo <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
        {/* Vote */}
        <button
          onClick={onVote}
          disabled={!canVote || hasVoted}
          className={`flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
            hasVoted ? 'text-[#FFD600]' : canVote ? 'text-[#94A3B8] hover:text-[#F7931A]' : 'text-[#94A3B8]/50 cursor-default'
          }`}
        >
          <Heart className={`w-4 h-4 ${hasVoted ? 'fill-[#FFD600] text-[#FFD600]' : ''}`} />
          {hasVoted ? 'Voted' : 'Vote'}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => { setCommentsOpen(!commentsOpen); if (!commentsOpen) loadComments(); }}
          className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[#94A3B8] hover:text-white transition-colors"
        >
          <MessageSquare className="w-4 h-4" /> Comments
        </button>
      </div>

      {/* Comments Drawer */}
      {commentsOpen && (
        <div className="border-t border-white/10 pt-4 mt-4 space-y-3">
          {user && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input value={newComment} onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..." className="input text-xs flex-1 h-9 py-1" />
              <button type="submit" className="btn-primary text-xs px-4 py-1">Post</button>
            </form>
          )}
          {loadingComments ? (
            <div className="flex justify-center py-2">
              <div className="w-4 h-4 border border-[#F7931A] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c._id} className="text-xs text-[#94A3B8] bg-[#030304] p-3 rounded-lg border border-white/5">
                  <span className="text-white font-medium">{c.authorId?.name}: </span>{c.body}
                </div>
              ))}
              {comments.length === 0 && <p className="text-xs text-[#94A3B8]/60 text-center font-mono py-1">No comments recorded yet</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
