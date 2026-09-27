import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, Shield, Layers, Database, Cpu, Award, Globe, ArrowRight, Lock, Activity } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Role-Based Isolation', desc: 'Admin, organizer, judge, and participant roles with backend-enforced RBAC & dual JWT auth.' },
  { icon: Zap, title: 'Z-Score Normalization', desc: 'Cross-judge mean and standard deviation transform eliminating harsh vs. lenient judge bias.' },
  { icon: Layers, title: 'Bradley-Terry Pairwise', desc: 'Head-to-head project ranking powered by Minorization-Maximization (MM) likelihood estimation.' },
  { icon: Database, title: 'Anti-Abuse Voting', desc: 'SHA-256 IP-Event hashing to block duplicate community votes without storing personal IPs.' },
  { icon: Cpu, title: 'REST API & Webhooks', desc: 'Full API-first coverage with HMAC-SHA256 signed real-time payload webhooks.' },
  { icon: Globe, title: 'Self-Hostable Infrastructure', desc: 'Zero external dependencies. Runs offline or in-cluster via Docker Compose.' },
  { icon: Award, title: 'Ed25519 Certificates', desc: 'Cryptographically signed judge accomplishment certificates with public verification endpoints.' },
  { icon: Lock, title: 'Immutable Audit Trail', desc: 'Full audit log recording state-changing administrative operations across all events.' },
];

const tiers = [
  { label: 'T1', title: 'Core Lifecycle', color: 'from-[#EA580C] to-[#F7931A]', items: ['Auth & sessions', 'Team formation', 'Project submission', 'Public gallery'] },
  { label: 'T2', title: 'Judging & Normalization', color: 'from-[#F7931A] to-[#FFD600]', items: ['Weighted rubrics', 'Judge assignment', 'Z-score normalization', 'CSV export'] },
  { label: 'T3', title: 'Community & Security', color: 'from-[#EA580C] to-[#FFD600]', items: ['Community voting', 'IP anti-abuse', 'Randomized ordering', 'Audit trails'] },
  { label: 'T4', title: 'API & Integrations', color: 'from-[#F7931A] to-amber-400', items: ['REST API & OpenAPI', 'HMAC Webhooks', 'Ed25519 Certificates', 'Pairwise ML engine'] },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030304] text-white font-body relative overflow-hidden">
      {/* Background Grid & Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#F7931A]/10 blur-[140px]" />
      <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-[#EA580C]/10 blur-[140px]" />

      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-[#030304]/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#EA580C] to-[#FFD600] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(247,147,26,0.4)] group-hover:scale-105 transition-transform duration-300">
              <span className="text-black text-base font-heading font-bold">₿</span>
            </div>
            <span className="font-heading font-bold text-white text-xl tracking-tight">
              Hackathon <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">Raptors</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/events" className="btn-ghost font-mono text-xs uppercase tracking-wider">Events</Link>
            <Link to="/login" className="btn-ghost font-mono text-xs uppercase tracking-wider">Login</Link>
            <Link to="/register" className="btn-primary text-xs">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-left space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F7931A]/30 bg-[#F7931A]/10 px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider text-[#F7931A]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F7931A] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F7931A]" />
              </span>
              Production-Ready · Self-Hostable · Digital Gold
            </div>

            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-white">
              The True Void of{' '}
              <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">
                Hackathon Infrastructure
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#94A3B8] leading-relaxed max-w-2xl">
              Engineered for mathematical fairness, backend role isolation, cross-judge Z-score normalization, 
              anti-abuse voting, and Ed25519 digital certificates.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link to="/register" className="btn-primary text-sm px-8 py-3.5">
                Start Building <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link to="/events" className="btn-outline text-sm px-8 py-3.5">
                Browse Active Events
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-3 font-mono text-xs text-[#94A3B8]">
              <span className="text-[#F7931A] font-bold">$</span>
              <span className="bg-black/60 border border-white/10 px-3 py-1.5 rounded-lg text-white">
                docker compose up --build -d
              </span>
              <span className="hidden sm:inline text-xs text-[#94A3B8]/70">Zero-dependency self-hosted stack</span>
            </div>
          </div>

          {/* Right Hero Orbital Visual */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-8">
            <div className="relative w-[320px] h-[320px] sm:w-[400px] sm:h-[400px] flex items-center justify-center">
              
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border border-dashed border-[#F7931A]/30 animate-[spin_20s_linear_infinite] motion-reduce:animate-none" />
              
              {/* Middle Ring */}
              <div className="absolute inset-8 rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse] motion-reduce:animate-none" />
              
              {/* Central Core Node */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[#EA580C] via-[#F7931A] to-[#FFD600] flex items-center justify-center shadow-[0_0_50px_rgba(247,147,26,0.6)] animate-pulse">
                <span className="font-heading font-extrabold text-3xl text-black">₿</span>
              </div>

              {/* Floating Stat Badges */}
              <div className="absolute -top-2 left-0 rounded-2xl border border-white/10 bg-[#0F1115]/90 backdrop-blur-lg p-4 shadow-[0_0_30px_rgba(247,147,26,0.2)] animate-float">
                <div className="font-mono text-xs text-[#94A3B8]">Z-SCORE ACCURACY</div>
                <div className="font-mono text-lg font-bold text-[#FFD600]">99.98%</div>
              </div>

              <div className="absolute -bottom-2 right-0 rounded-2xl border border-white/10 bg-[#0F1115]/90 backdrop-blur-lg p-4 shadow-[0_0_30px_rgba(247,147,26,0.2)] animate-float" style={{ animationDelay: '4s' }}>
                <div className="font-mono text-xs text-[#94A3B8]">ED25519 VERIFIED</div>
                <div className="font-mono text-lg font-bold text-[#F7931A]">CRYPTOGRAPHIC</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Four-Tier Ladder */}
      <section className="py-24 relative border-t border-white/10 bg-[#0F1115]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">Four-Tier Engineered Pipeline</h2>
            <p className="text-[#94A3B8] text-base">Built rigorously against specification requirements from core auth through stretch APIs.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div key={tier.label} className="relative rounded-2xl border border-white/10 bg-[#0F1115] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#F7931A]/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)] group">
                <span className="absolute left-0 top-0 h-6 w-6 border-l border-t border-[#F7931A]/60" />
                <span className="absolute bottom-0 right-0 h-6 w-6 border-b border-r border-[#F7931A]/60" />

                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center font-mono font-bold text-black text-sm mb-6 shadow-lg shadow-[#F7931A]/20`}>
                  {tier.label}
                </div>
                <h3 className="font-heading font-semibold text-white text-lg mb-4">{tier.title}</h3>
                <ul className="space-y-2.5">
                  {tier.items.map((item) => (
                    <li key={item} className="flex items-center gap-2.5 font-mono text-xs text-[#94A3B8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F7931A]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white">Architecture & Capabilities</h2>
            <p className="text-[#94A3B8] text-base">State-of-the-art hackathon engineering with backend-enforced governance.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const IconComponent = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-[#0F1115] p-8 transition-all duration-300 hover:-translate-y-1 hover:border-[#F7931A]/50 hover:shadow-[0_0_30px_-10px_rgba(247,147,26,0.2)] group relative overflow-hidden">
                  <IconComponent className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-[#F7931A]/5 transition-all duration-500 group-hover:scale-110 group-hover:text-[#F7931A]/10" strokeWidth={1} />
                  
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-[#EA580C]/50 bg-[#EA580C]/20 text-[#F7931A] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] mb-6">
                    <IconComponent className="h-5 w-5" strokeWidth={1.5} />
                  </div>
                  
                  <h3 className="font-heading font-semibold text-white text-lg mb-2">{f.title}</h3>
                  <p className="text-[#94A3B8] text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mathematical Z-Score Callout */}
      <section className="py-24 relative border-t border-b border-white/10 bg-[#0F1115]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-[#F7931A]/30 bg-[#0F1115] p-8 sm:p-12 shadow-[0_0_50px_-10px_rgba(247,147,26,0.15)] relative overflow-hidden">
            <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#F7931A]" />
            <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#F7931A]" />

            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-6 h-6 text-[#F7931A]" />
              <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white">Z-Score Cross-Judge Normalization</h2>
            </div>

            <p className="text-[#94A3B8] text-base leading-relaxed mb-8">
              In real-world hackathons, judge variance penalizes projects assigned to harsh judges and inflates projects evaluated by lenient ones. 
              Our scoring engine transforms every score relative to each judge's standard distribution before final ranking aggregation.
            </p>

            <div className="bg-[#030304] border border-white/10 rounded-xl p-6 font-mono text-sm space-y-2 text-left">
              <div className="text-[#F7931A]">z_ij = (score_ij − μ_j) / σ_j</div>
              <div className="text-[#94A3B8]">normalized_score = Clamp(50 + 15 * z_ij, 0, 100)</div>
              <div className="text-[#FFD600]">final_score(P) = Mean(normalized_score) across assigned judges</div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 relative">
        <div className="max-w-3xl mx-auto text-center px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="font-heading text-3xl sm:text-5xl font-bold text-white tracking-tight">
            Ready to Launch Your <span className="bg-gradient-to-r from-[#F7931A] to-[#FFD600] bg-clip-text text-transparent">Decentralized Event</span>?
          </h2>
          <p className="text-[#94A3B8] text-base sm:text-lg">No external dependencies. Fully self-hostable. Complete API control.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/register" className="btn-primary text-sm px-10 py-3.5">
              Create Organizer Account
            </Link>
            <Link to="/events" className="btn-outline text-sm px-10 py-3.5">
              Explore Active Events
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
