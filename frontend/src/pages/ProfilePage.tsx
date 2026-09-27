import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/client';
import { User, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.updateProfile(form);
      await refreshUser();
      setMsg('Profile updated!');
    } catch { setMsg('Failed to update'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in max-w-xl mx-auto font-body">
      <div>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tight">Account Identity</h1>
        <p className="text-[#94A3B8] text-sm mt-1">Manage user identity, handle display options, and cryptographic role claims</p>
      </div>

      <div className="card space-y-6">
        <div className="flex items-center gap-5 pb-6 border-b border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#EA580C] via-[#F7931A] to-[#FFD600] flex items-center justify-center text-black font-heading font-bold text-2xl shadow-[0_0_30px_rgba(247,147,26,0.3)]">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <h2 className="font-heading font-bold text-white text-xl">{user?.name}</h2>
            <p className="font-mono text-xs text-[#94A3B8]">{user?.email}</p>
            <span className="badge-bitcoin capitalize font-mono text-[10px] tracking-wider mt-1">{user?.role}</span>
          </div>
        </div>

        {msg && <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-mono text-xs">{msg}</div>}

        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="label">Display Name</label>
            <input type="text" className="input" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Bio Specs (Optional)</label>
            <textarea className="input text-xs resize-none" rows={3} placeholder="Builder bio, technical background, key repositories..."
              value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-xs py-3.5 flex items-center gap-2">
            <Save className="w-4 h-4" />
            {loading ? 'Saving Changes...' : 'Update Account Identity'}
          </button>
        </form>
      </div>
    </div>
  );
}
