import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { judgingApi } from '../api/client';
import { Trophy, Award, ArrowLeft } from 'lucide-react';

export default function ResultsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [rankings, setRankings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    judgingApi.getResults(eventId!).then(({ data }) => {
      setRankings(data.rankings);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load results');
    }).finally(() => setLoading(false));
  }, [eventId]);

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>;
  if (error) return <div className="card text-center py-12 text-red-300 font-mono text-sm">{error}</div>;

  return (
    <div className="space-y-8 animate-in max-w-4xl mx-auto font-body">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#FFD600]" /> Final Rankings
          </h1>
          <p className="text-[#94A3B8] text-base mt-1">Cross-judge standardized scores computed via Z-score algorithm</p>
        </div>
        <Link to={`/events/${eventId}`} className="btn-outline text-xs px-4 py-2.5 font-mono uppercase shrink-0 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Event
        </Link>
      </div>

      <div className="space-y-4">
        {rankings.map((r, idx) => (
          <div
            key={r.projectId}
            className={`rounded-2xl border bg-[#0F1115] p-6 transition-all duration-300 flex items-center gap-6 ${
              idx === 0
                ? 'border-[#FFD600]/60 shadow-[0_0_40px_rgba(255,214,0,0.2)]'
                : idx < 3
                ? 'border-[#F7931A]/40 shadow-[0_0_30px_-10px_rgba(247,147,26,0.15)]'
                : 'border-white/10'
            }`}
          >
            <div className="w-14 text-center shrink-0">
              {idx === 0 ? (
                <div className="w-10 h-10 mx-auto bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-xl flex items-center justify-center font-heading font-bold text-black text-xl shadow-[0_0_20px_rgba(255,214,0,0.5)]">
                  #1
                </div>
              ) : idx === 1 ? (
                <div className="w-10 h-10 mx-auto bg-slate-300 rounded-xl flex items-center justify-center font-heading font-bold text-black text-lg">
                  #2
                </div>
              ) : idx === 2 ? (
                <div className="w-10 h-10 mx-auto bg-amber-700 rounded-xl flex items-center justify-center font-heading font-bold text-white text-lg">
                  #3
                </div>
              ) : (
                <span className="font-mono text-lg font-bold text-[#94A3B8]">#{r.rank}</span>
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-heading font-bold text-white text-xl">{r.project?.title || 'Unknown Project'}</h3>
              <p className="text-[#94A3B8] text-sm line-clamp-1 mt-1">{r.project?.description}</p>
            </div>

            <div className="text-right shrink-0 font-mono">
              <p className="text-3xl font-bold bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">{r.score.toFixed(2)}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Z-Score</p>
              {r.voteCount > 0 && <p className="text-xs text-[#FFD600] mt-1">❤️ {r.voteCount} votes</p>}
            </div>
          </div>
        ))}
      </div>

      {rankings.length === 0 && (
        <div className="text-center py-24 space-y-3">
          <Award className="w-12 h-12 mx-auto text-[#94A3B8]/40" />
          <h3 className="font-heading text-xl font-semibold text-white">No evaluation results released yet</h3>
          <p className="text-[#94A3B8] text-sm">Results will appear here once judging evaluation closes and organizers publish normalized scores.</p>
        </div>
      )}
    </div>
  );
}
