import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleColors: Record<string, string> = {
  admin: 'badge-red',
  organizer: 'badge-gold',
  judge: 'badge-blue',
  participant: 'badge-purple',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/events', label: 'Events' },
    ...(user?.role === 'judge' || user?.role === 'admin' ? [{ to: '/judge', label: 'Judge Panel' }] : []),
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen flex flex-col bg-[#030304] text-white font-body">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#030304]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(247,147,26,0.4)] group-hover:scale-105 transition-transform duration-300">
                <span className="text-black text-base font-heading font-bold">₿</span>
              </div>
              <span className="font-heading font-bold text-white text-lg hidden sm:block tracking-tight">
                Hackathon <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">Raptors</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                    isActive(link.to)
                      ? 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/30 shadow-[0_0_15px_rgba(247,147,26,0.2)]'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#EA580C] to-[#F7931A] flex items-center justify-center text-white text-xs font-mono font-bold shadow-[0_0_10px_rgba(247,147,26,0.3)]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-medium text-white group-hover:text-[#F7931A] transition-colors">{user.name}</p>
                      <span className={`text-[10px] ${roleColors[user.role] || 'badge-gray'}`}>{user.role}</span>
                    </div>
                  </Link>
                  <button onClick={handleLogout} className="btn-ghost text-xs font-mono uppercase tracking-wider px-3 py-1.5">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-ghost text-xs font-mono uppercase tracking-wider">Login</Link>
                  <Link to="/register" className="btn-primary text-xs">Sign Up</Link>
                </>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden btn-ghost p-2"
                aria-label="Toggle Navigation Menu"
              >
                <svg className="w-5 h-5 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/10 py-3 pb-4 animate-in">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider mb-1 transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#F7931A]/10 text-[#F7931A] border border-[#F7931A]/30'
                      : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Page content */}
      <main className="flex-1 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16 bg-[#030304] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-md flex items-center justify-center">
              <span className="text-black text-xs font-bold font-heading">₿</span>
            </div>
            <span className="text-[#94A3B8] text-xs font-mono uppercase tracking-wider">
              Hackathon Raptors Platform <span className="text-[#F7931A]">· True Void</span>
            </span>
          </div>
          <p className="text-[#94A3B8]/60 text-xs font-mono">
            Self-hostable · Decentralized Standard · Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}
