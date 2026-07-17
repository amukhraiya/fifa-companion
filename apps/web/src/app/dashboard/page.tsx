'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Navigation, Zap, Wallet, Camera, TrendingUp, Shield, Bot, MessageSquare } from 'lucide-react';

export default function DashboardPage() {
  const [profile, setProfile] = useState<{ email?: string; memory?: Record<string, unknown> } | null>(null);
  const [completion, setCompletion] = useState(0);

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const ensureSession = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) return token;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'fan@fifa.com', password: 'password123' }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.data.accessToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data.accessToken;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to auto-login guest session:', err);
    }
    return null;
  };

  useEffect(() => {
    const init = async () => {
      const token = await ensureSession();
      if (!token) return;

      try {
        const res = await fetch(`${getApiUrl()}/api/v1/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setProfile(data.data.user);
          setCompletion(data.data.completion);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to load profile', err);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  const memory = profile?.memory || {};

  const modules = [
    { title: "Smart Booking", desc: "Interactive seat mapping & AI recommendations.", icon: Ticket, href: "/booking", color: "text-emerald-400" },
    { title: "Travel Hub", desc: "Hyper-optimized routing & accessibility matching.", icon: Navigation, href: "/travel", color: "text-sky-400" },
    { title: "Match Day", desc: "Real-time tactical analysis & event tracking.", icon: Zap, href: "/match-day", color: "text-amber-400" },
    { title: "Digital Wallet", desc: "Manage your tournament passes.", icon: Wallet, href: "/wallet", color: "text-purple-400" },
    { title: "Memories", desc: "Your World Cup scrapbook & highlights.", icon: Camera, href: "/memories", color: "text-rose-400" },
    { title: "Statistics", desc: "Insights & achievements from your journey.", icon: TrendingUp, href: "/profile/statistics", color: "text-indigo-400" },
    { title: "Command Center", desc: "Observe the AI Kernel in real-time.", icon: Shield, href: "/developer/command-center", color: "text-slate-400" }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 pb-24">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <header className="flex justify-between items-center pb-6 border-b border-border/50">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-primary tracking-widest">FIFA AI Companion</span>
            <span className="text-2xl font-black text-white">Central Dashboard</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-semibold text-white/80"
          >
            Sign Out
          </button>
        </header>

        {/* Welcome Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-8 rounded-3xl glass-card flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                Fan DNA Core
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white">
                Welcome, {profile?.email ? profile.email.split('@')[0] : 'Fan'}!
              </h1>
              <p className="text-white/60 text-sm leading-relaxed max-w-xl">
                Your application hub is ready. The Commander AI is tracking your Fan DNA across all modules to personalize your World Cup journey.
              </p>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <Link
                href="/onboarding"
                className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all text-xs font-bold text-primary"
              >
                Update Fan DNA
              </Link>
            </div>
          </div>

          <div className="p-8 rounded-3xl glass-card space-y-6">
            <h2 className="text-xl font-bold text-white">Your Fan DNA</h2>
            
            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-1">
                Derived Segment
              </span>
              <span className="text-2xl font-black bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                {(memory?.fanProfile as string) || 'Stadium Explorer'}
              </span>
            </div>

            <div>
              <span className="block text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                Setup Completion
              </span>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                  <div className="h-full bg-gradient-to-r from-primary to-amber-500" style={{ width: `${completion || 100}%` }} />
                </div>
                <span className="text-sm font-black text-white">{completion || 100}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Commander AI Hero */}
        <section>
          <div className="w-full relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600/90 via-amber-500/80 to-emerald-600/90 border border-amber-400/30 p-8 md:p-12 shadow-[0_0_40px_rgba(217,119,6,0.2)] flex flex-col md:flex-row items-center justify-between group">
            {/* Background effects */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 mix-blend-overlay"></div>
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 blur-[60px] rounded-full mix-blend-screen transition-transform group-hover:scale-150 duration-700"></div>

            <div className="relative z-10 max-w-2xl text-left space-y-4 mb-8 md:mb-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                <Bot className="w-3 h-3" />
                Always Listening
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Ask Commander AI
              </h2>
              <p className="text-white/90 text-lg font-medium leading-relaxed">
                Need to change a booking? Want to know the fastest route to the stadium? Curious about Messi&apos;s stats? I am here to orchestrate your perfect World Cup.
              </p>
            </div>

            <div className="relative z-10 w-full md:w-auto">
              <Link
                href="/chat"
                className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white text-slate-950 hover:bg-slate-50 transition-all font-black text-lg shadow-xl hover:scale-105 active:scale-95"
              >
                <MessageSquare className="w-6 h-6 text-amber-600" />
                Open AI Workspace
              </Link>
            </div>
          </div>
        </section>

        {/* Modules Grid */}
        <section>
          <h2 className="text-xl font-black text-white mb-6">Application Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((mod, i) => (
              <Link key={i} href={mod.href} className={`group glass-card rounded-2xl p-6 flex flex-col hover:-translate-y-1 transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <mod.icon className={`w-5 h-5 ${mod.color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{mod.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{mod.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
