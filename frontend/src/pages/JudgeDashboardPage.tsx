import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { judgingApi } from '../api/client';
import { CheckCircle2, Clock, Trophy, ExternalLink, ArrowRight } from 'lucide-react';

export default function JudgeDashboardPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    judgingApi.getAssignments().then(({ data }) => {
      setAssignments(data.assignments || []);
    }).finally(() => setLoading(false));
  }, []);

  const completed = assignments.filter((a) => a.status === 'completed');
  const pending = assignments.filter((a) => a.status !== 'completed');
  const pct = assignments.length > 0 ? Math.round((completed.length / assignments.length) * 100) : 0;

  if (loading) return (
    <div className="flex justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in font-body">
      <div>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">Judge Terminal</h1>
        <p className="text-[#94A3B8] text-base mt-1">Review assigned hackathon submissions & execute rubric scoring</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="stat-value text-[#F7931A]">{assignments.length}</div>
          <div className="stat-label">Total Assigned</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-[#FFD600]">{completed.length}</div>
          <div className="stat-label">Completed Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-amber-500">{pending.length}</div>
          <div className="stat-label">Pending Reviews</div>
        </div>
      </div>

      {/* Progress */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider">
          <span className="text-white font-medium">Evaluation Completion</span>
          <span className="text-[#F7931A] font-bold">{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Pending */}
      {pending.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h2 className="font-heading text-xl font-semibold text-white">Pending Reviews ({pending.length})</h2>
          </div>
          <div className="space-y-4">
            {pending.map((a) => (
              <AssignmentCard key={a._id} assignment={a} />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#FFD600]" />
            <h2 className="font-heading text-xl font-semibold text-white">Completed ({completed.length})</h2>
          </div>
          <div className="space-y-4">
            {completed.map((a) => (
              <AssignmentCard key={a._id} assignment={a} completed />
            ))}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="text-center py-24 space-y-4">
          <Trophy className="w-12 h-12 mx-auto text-[#94A3B8]/40" />
          <h3 className="font-heading text-xl font-semibold text-white">No Judge Assignments Roster</h3>
          <p className="text-[#94A3B8] text-sm max-w-sm mx-auto">Organizers have not assigned active projects to your account yet.</p>
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ assignment, completed = false }: { assignment: any; completed?: boolean }) {
  const project = assignment.projectId;
  const event = assignment.eventId;

  return (
    <div className={`card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 ${completed ? 'opacity-70' : 'border-[#F7931A]/40 shadow-[0_0_30px_-10px_rgba(247,147,26,0.15)]'}`}>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-3">
          <span className={completed ? 'badge-gold' : 'badge-bitcoin'}>
            {completed ? 'Completed' : 'Pending'}
          </span>
          {event && <span className="font-mono text-xs text-[#94A3B8]">{event.title}</span>}
        </div>
        <h3 className="font-heading font-bold text-white text-xl">{project?.title || 'Project'}</h3>
        {project?.description && (
          <p className="text-sm text-[#94A3B8] line-clamp-2 leading-relaxed">{project.description}</p>
        )}
        <div className="flex gap-4 pt-1 font-mono text-xs">
          {project?.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-[#F7931A] hover:underline flex items-center gap-1">
              Repository <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {project?.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-[#FFD600] hover:underline flex items-center gap-1">
              Live Demo <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
      {!completed ? (
        <Link to={`/judge/score/${assignment._id}`} className="btn-primary text-xs shrink-0 py-3">
          Score Project <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      ) : (
        <Link to={`/judge/score/${assignment._id}`} className="btn-outline text-xs shrink-0 py-2.5 font-mono uppercase">
          Edit Scores
        </Link>
      )}
    </div>
  );
}
