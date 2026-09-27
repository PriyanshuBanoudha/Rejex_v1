import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name);
      navigate('/login', { state: { message: 'Account created! Please login.' } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030304] text-white flex items-center justify-center py-12 px-4 relative overflow-hidden font-body">
      {/* Ambient Grid & Glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EA580C]/10 rounded-full blur-[140px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4 group">
            <div className="w-10 h-10 bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-xl flex items-center justify-center shadow-[0_0_25px_rgba(247,147,26,0.5)] group-hover:scale-105 transition-transform duration-300">
              <span className="text-black text-lg font-heading font-bold">₿</span>
            </div>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Create Account</h1>
          <p className="text-[#94A3B8] text-sm mt-1">Join Hackathon Raptors and start building</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#0F1115] p-8 shadow-[0_0_50px_-10px_rgba(247,147,26,0.15)] relative overflow-hidden">
          <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-[#F7931A]/60" />
          <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-[#F7931A]/60" />

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input id="name" type="text" className="input" placeholder="Satoshi Nakamoto" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input id="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input id="password" type="password" className="input" placeholder="Min. 8 characters" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input id="confirm-password" type="password" className="input" placeholder="Repeat password" value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-4">
              {loading
                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</>
                : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#94A3B8] text-sm mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#F7931A] hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
