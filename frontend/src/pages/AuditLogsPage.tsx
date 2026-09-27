import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shield, FileText } from 'lucide-react';

export default function AuditLogsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    import('../api/client').then(({ auditApi }) => {
      auditApi.getLogs(eventId!, { page, limit: 50 })
        .then(({ data }) => { setLogs(data.logs); setTotal(data.total); })
        .finally(() => setLoading(false));
    });
  }, [eventId, page]);

  return (
    <div className="space-y-8 animate-in font-body">
      <div>
        <h1 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#F7931A]" /> System Audit Stream
        </h1>
        <p className="text-[#94A3B8] text-base mt-1">Immutable security ledger & permission audit logs · {total} recorded events</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#F7931A] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-[#0F1115] overflow-hidden shadow-[0_0_50px_-10px_rgba(247,147,26,0.1)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body">
                <thead>
                  <tr className="border-b border-white/10 bg-[#030304]/80 text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Action Event</th>
                    <th className="py-4 px-6">Actor Identity</th>
                    <th className="py-4 px-6">Target Resource</th>
                    <th className="py-4 px-6">Client IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-xs text-[#94A3B8]">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6 text-[#94A3B8]/70 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <code className="text-[#FFD600] bg-black/60 border border-[#FFD600]/30 px-2.5 py-1 rounded text-[11px]">
                          {log.action}
                        </code>
                      </td>
                      <td className="py-4 px-6 text-white font-medium">{log.actorEmail || log.actorId}</td>
                      <td className="py-4 px-6 text-[#94A3B8]">{log.resource}</td>
                      <td className="py-4 px-6 text-[#94A3B8]/70">{log.ip || '—'}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-[#94A3B8] font-mono text-xs">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        No audit events recorded for this event scope.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {total > 50 && (
            <div className="flex justify-center items-center gap-3 pt-2 font-mono text-xs">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-outline text-xs px-4 py-2 disabled:opacity-40">← Prev</button>
              <span className="text-[#94A3B8] px-3">Page {page} of {Math.ceil(total / 50)}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 50 >= total} className="btn-outline text-xs px-4 py-2 disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
