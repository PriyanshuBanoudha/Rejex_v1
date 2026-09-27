import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { certsApi } from '../api/client';
import { ShieldCheck, ShieldAlert, Key, CheckCircle2 } from 'lucide-react';

export default function CertVerifyPage() {
  const { certId } = useParams<{ certId: string }>();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState(certId || '');

  const verify = async (id = certId || manualId) => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await certsApi.verify(id);
      setResult(data);
    } catch (err: any) {
      setResult({ valid: false, message: err.response?.data?.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { if (certId) verify(certId); }, [certId]);

  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center justify-center px-4 py-12 relative overflow-hidden font-body">
      {/* Ambient Grid & Glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#F7931A]/10 rounded-full blur-[140px]" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(247,147,26,0.4)]">
            <Key className="w-6 h-6 text-black" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Certificate Verification</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Cryptographic Ed25519 public signature check</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-8 shadow-[0_0_50px_-10px_rgba(247,147,26,0.15)] mb-6">
          <div className="space-y-4">
            <div>
              <label className="label">Certificate Identifier</label>
              <input
                type="text"
                className="input font-mono text-xs"
                placeholder="CERT-XXXX-XXXX-XXXX"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
              />
            </div>
            <button onClick={() => verify(manualId)} disabled={loading || !manualId} className="btn-primary w-full justify-center text-xs py-3 font-mono uppercase">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying Signature...</>
                : 'Verify Ed25519 Signature'}
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-2xl border bg-[#0F1115] p-8 shadow-xl ${result.valid ? 'border-[#FFD600]/60 shadow-[0_0_30px_rgba(255,214,0,0.15)]' : 'border-red-500/60'}`}>
            <div className="text-center mb-6">
              {result.valid ? (
                <ShieldCheck className="w-12 h-12 mx-auto text-[#FFD600] mb-2" />
              ) : (
                <ShieldAlert className="w-12 h-12 mx-auto text-red-400 mb-2" />
              )}
              <h2 className={`font-heading text-xl font-bold ${result.valid ? 'text-[#FFD600]' : 'text-red-400'}`}>
                {result.valid ? 'Cryptographically Valid Certificate' : 'Invalid or Unknown Record'}
              </h2>
              <p className="text-[#94A3B8] text-xs font-mono mt-1">{result.message}</p>
            </div>

            {result.valid && result.certificate && (
              <div className="space-y-3 border-t border-white/10 pt-4 font-mono text-xs">
                {[
                  ['Issued To', result.certificate.judgeName],
                  ['Event Title', result.certificate.eventTitle],
                  ['Projects Judged', result.certificate.projectsJudged],
                  ['Issued By Authority', result.certificate.issuer],
                  ['Issue Date', new Date(result.certificate.issuedAt).toLocaleDateString()],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between py-1 border-b border-white/5 last:border-0">
                    <span className="text-[#94A3B8]">{label}</span>
                    <span className="text-white font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
