import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { judgingApi } from '../api/client';
import { Sliders, CheckCircle2, ExternalLink, ArrowLeft } from 'lucide-react';

interface Criterion { _id: string; name: string; description: string; maxScore: number; weight: number }

export default function ScoreProjectPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<any>(null);
  const [rubric, setRubric] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, { rawScore: number; comment: string }>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    judgingApi.getAssignments().then(({ data }) => {
      const a = data.assignments.find((x: any) => x._id === assignmentId);
      if (!a) return;
      setAssignment(a);
      const eventId = a.eventId?._id || a.eventId;
      import('../api/client').then(({ eventsApi }) => {
        eventsApi.get(eventId).then(({ data: ed }) => {
          if (ed.event.rubricId) {
            judgingApi.getRubric(
              typeof ed.event.rubricId === 'object' ? ed.event.rubricId._id : ed.event.rubricId
            ).then(({ data: rd }) => {
              setRubric(rd.rubric);
              const init: typeof scores = {};
              rd.rubric.criteria.forEach((c: Criterion) => {
                init[c._id] = { rawScore: 0, comment: '' };
              });
              setScores(init);
              return judgingApi.getMyScore(a.projectId?._id || a.projectId);
            }).then((r) => {
              if (r?.data?.score) {
                const existing = r.data.score;
                const loaded: typeof scores = {};
                existing.criteriaScores.forEach((cs: any) => {
                  loaded[cs.criterionId] = { rawScore: cs.rawScore, comment: cs.comment || '' };
                });
                setScores(loaded);
                setSaved(true);
              }
            }).catch(() => {}).finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        });
      });
    });
  }, [assignmentId]);

  const computePreview = () => {
    if (!rubric) return { weighted: 0, normalized: 0 };
    let weighted = 0, maxPossible = 0;
    rubric.criteria.forEach((c: Criterion) => {
      weighted += (scores[c._id]?.rawScore || 0) * c.weight;
      maxPossible += c.maxScore * c.weight;
    });
    return {
      weighted: Math.round(weighted * 100) / 100,
      normalized: maxPossible > 0 ? Math.round((weighted / maxPossible) * 10000) / 100 : 0,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const criteriaScores = Object.entries(scores).map(([criterionId, s]) => ({
        criterionId, rawScore: s.rawScore, comment: s.comment,
      }));
      await judgingApi.submitScore({ assignmentId, criteriaScores });
      setSaved(true);
      setTimeout(() => navigate('/judge'), 1200);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const project = assignment?.projectId;
  const preview = computePreview();

  return (
    <div className="space-y-8 animate-in max-w-4xl mx-auto font-body">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Evaluate Submission</h1>
          <p className="font-mono text-xs text-[#F7931A] uppercase tracking-wider mt-1">{project?.title}</p>
        </div>
        <button onClick={() => navigate('/judge')} className="btn-outline text-xs px-4 py-2 font-mono uppercase flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Roster
        </button>
      </div>

      {/* Project details card */}
      <div className="card space-y-4">
        <h2 className="font-heading text-xl font-semibold text-white">Project Specification</h2>
        <p className="text-[#94A3B8] text-sm leading-relaxed">{project?.description}</p>
        <div className="flex gap-4 pt-2 font-mono text-xs">
          {project?.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="btn-outline text-xs px-4 py-2 flex items-center gap-1">
              Repository <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {project?.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-4 py-2 flex items-center gap-1">
              Live Demo <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Score Preview Card */}
      <div className="rounded-2xl border border-[#F7931A]/40 bg-[#0F1115] p-6 shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#94A3B8]">Score Live Calculations</p>
            <p className="font-mono text-4xl font-bold bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent mt-1">{preview.normalized}%</p>
            <p className="font-mono text-xs text-[#94A3B8]/70 mt-1">Weighted total: {preview.weighted}</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-[#FFD600] font-mono text-xs uppercase">
              <CheckCircle2 className="w-5 h-5 text-[#FFD600]" /> Score Submitted
            </div>
          )}
        </div>
      </div>

      {!rubric ? (
        <div className="card text-center py-12 text-[#94A3B8] font-mono text-sm">
          No weighted rubric configured for this event.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {rubric.criteria.map((c: Criterion) => (
            <div key={c._id} className="card space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-white text-lg">{c.name}</h3>
                  <p className="text-xs text-[#94A3B8] mt-1">{c.description}</p>
                </div>
                <div className="text-right shrink-0 ml-4 font-mono text-xs">
                  <span className="badge-bitcoin">Weight ×{c.weight}</span>
                  <p className="text-[#94A3B8]/70 mt-1.5">Max score: {c.maxScore}</p>
                </div>
              </div>

              {/* Slider + numeric input */}
              <div className="flex items-center gap-4 py-2">
                <input
                  type="range"
                  min={0}
                  max={c.maxScore}
                  step={0.5}
                  value={scores[c._id]?.rawScore || 0}
                  onChange={(e) => setScores((prev) => ({
                    ...prev,
                    [c._id]: { ...prev[c._id], rawScore: parseFloat(e.target.value) },
                  }))}
                  className="flex-1 accent-[#F7931A] h-2 bg-black/60 rounded-lg cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={c.maxScore}
                  step={0.5}
                  value={scores[c._id]?.rawScore || 0}
                  onChange={(e) => setScores((prev) => ({
                    ...prev,
                    [c._id]: { ...prev[c._id], rawScore: Math.min(c.maxScore, Math.max(0, parseFloat(e.target.value) || 0)) },
                  }))}
                  className="input w-24 text-center font-mono text-sm"
                />
                <span className="font-mono text-xs text-[#94A3B8]">/ {c.maxScore}</span>
              </div>

              <textarea
                placeholder="Optional notes or evaluation comments..."
                rows={2}
                className="input text-xs resize-none"
                value={scores[c._id]?.comment || ''}
                onChange={(e) => setScores((prev) => ({
                  ...prev,
                  [c._id]: { ...prev[c._id], comment: e.target.value },
                }))}
              />
            </div>
          ))}

          {error && <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 font-mono text-xs">{error}</div>}
          {saved && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">✓ Score recorded successfully! Redirecting...</div>}

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => navigate('/judge')} className="btn-outline text-xs px-6 py-3 font-mono uppercase">Cancel</button>
            <button type="submit" disabled={submitting || saved} className="btn-primary text-xs flex-1 justify-center py-3">
              {submitting
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                : saved ? '✓ Submitted' : 'Submit Rubric Evaluation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
