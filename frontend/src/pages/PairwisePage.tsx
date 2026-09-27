import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pairwiseApi } from '../api/client';
import { Trophy, ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';

export default function PairwisePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [pair, setPair] = useState<{ projectA: any; projectB: any } | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [count, setCount] = useState(0);

  const loadNext = async () => {
    setLoading(true);
    try {
      const { data } = await pairwiseApi.getNext(eventId!);
      if (data.pair) { setPair(data.pair); setDone(false); }
      else { setDone(true); setPair(null); }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadNext(); }, [eventId]);

  const choose = async (winnerId: string) => {
    if (!pair) return;
    setSubmitting(true);
    try {
      await pairwiseApi.submit({
        eventId, projectAId: pair.projectA._id, projectBId: pair.projectB._id, winnerId,
      });
      setCount((c) => c + 1);
      loadNext();
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 animate-in max-w-4xl mx-auto font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">Bradley-Terry Pairwise</h1>
          <p className="text-[#94A3B8] text-base mt-1">Select the superior hackathon submission · {count} head-to-head completed</p>
        </div>
        <Link to="/judge" className="btn-outline text-xs px-4 py-2.5 font-mono uppercase flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Judge Panel
        </Link>
      </div>

      {done ? (
        <div className="card text-center py-20 space-y-4">
          <Trophy className="w-14 h-14 mx-auto text-[#FFD600]" />
          <h2 className="font-heading text-2xl font-bold text-white">All Pairwise Matchups Completed!</h2>
          <p className="text-[#94A3B8] text-sm max-w-md mx-auto">You've completed {count} head-to-head comparisons for maximum likelihood estimation.</p>
          <Link to="/judge" className="btn-primary text-xs px-8 py-3 inline-flex">Back to Judge Dashboard</Link>
        </div>
      ) : pair && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            {[pair.projectA, pair.projectB].map((p, idx) => (
              <div key={p._id} className="rounded-2xl border border-white/10 bg-[#0F1115] p-6 transition-all duration-300 hover:border-[#F7931A]/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)] flex flex-col group relative overflow-hidden">
                <span className="font-mono text-xs text-[#F7931A] uppercase tracking-wider mb-2">Option {idx === 0 ? 'A' : 'B'}</span>
                <h3 className="font-heading font-bold text-white text-2xl mb-3 group-hover:text-[#F7931A] transition-colors">{p.title}</h3>
                <p className="text-[#94A3B8] text-sm leading-relaxed flex-1 mb-6">{p.description}</p>
                <div className="flex gap-4 mb-6 font-mono text-xs">
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
                <button
                  onClick={() => choose(p._id)}
                  disabled={submitting}
                  className="btn-primary w-full justify-center py-3.5 text-xs font-mono uppercase"
                >
                  {submitting ? 'Recording Preference...' : 'Select Option ' + (idx === 0 ? 'A' : 'B')}
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center">
            <button onClick={loadNext} className="btn-ghost text-xs font-mono uppercase flex items-center gap-1 text-[#94A3B8]">
              <RefreshCw className="w-3.5 h-3.5" /> Skip Current Matchup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
