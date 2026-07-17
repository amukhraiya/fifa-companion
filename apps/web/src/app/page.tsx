import Link from 'next/link';
import { Bot, Navigation, Ticket, Zap, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-background text-foreground">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-[128px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-secondary/30 blur-[128px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-emerald-500/10 blur-[128px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '3s' }}></div>
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>
      </div>

      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-foreground uppercase tracking-widest text-sm">FIFA AI</span>
        </div>
        <div className="flex space-x-4">
          <Link href="/login" className="px-6 py-2 rounded-full bg-white/5 hover:bg-white/10 text-sm font-semibold transition-all border border-white/10 backdrop-blur-md">
            Sign In
          </Link>
          <Link href="/register" className="px-6 py-2 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90 text-sm font-bold transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)]">
            Register
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center mt-32 md:mt-48 text-center space-y-8 max-w-4xl px-4 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-primary text-xs font-bold uppercase tracking-wider">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          Next-Gen Tournament Assistant
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight">
          Your Ultimate <br/>
          <span className="bg-gradient-to-r from-primary via-yellow-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-sm">
            Match Day
          </span> Companion
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-medium">
          Experience the World Cup like never before. AI-driven personalization, real-time ticket recommendations, and hyper-local travel intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Link href="/login" className="group px-8 py-4 rounded-full bg-foreground text-background hover:scale-105 transition-all font-bold text-lg flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Start AI Demo
          </Link>
          <Link href="/developer/command-center" className="px-8 py-4 rounded-full glass-panel hover:bg-white/10 transition-all font-bold text-lg flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-slate-400" />
            Developer Tools
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 grid text-left w-full max-w-7xl md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 pb-24 mt-32 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
        {[
          {
            title: "Smart Booking",
            desc: "Interactive 3D stadium maps with AI-recommended seating based on your Fan DNA and budget.",
            icon: Ticket,
            href: "/booking",
            color: "text-emerald-400",
            hoverBorder: "hover:border-emerald-500/50"
          },
          {
            title: "Travel Hub",
            desc: "Hyper-optimized routing avoiding crowds, finding local dining, and matching accessibility needs.",
            icon: Navigation,
            href: "/travel",
            color: "text-sky-400",
            hoverBorder: "hover:border-sky-500/50"
          },
          {
            title: "Live Match AI",
            desc: "Real-time tactical analysis, win probability charts, and immediate safety dispatch integration.",
            icon: Zap,
            href: "/match-day",
            color: "text-amber-400",
            hoverBorder: "hover:border-amber-500/50"
          },
          {
            title: "Command Center",
            desc: "Observe the AI Kernel in real-time. See planner execution, tool invocations, and Event Bus logs.",
            icon: Shield,
            href: "/developer/command-center",
            color: "text-indigo-400",
            hoverBorder: "hover:border-indigo-500/50"
          }
        ].map((feature, i) => (
          <Link key={i} href={feature.href} className={`group glass-card rounded-3xl p-8 flex flex-col justify-between min-h-[220px] ${feature.hoverBorder}`}>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h2 className="mb-3 text-xl font-bold text-foreground">
                {feature.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
      
      {/* Decorative floating elements */}
      <div className="absolute top-1/3 left-10 w-24 h-24 glass-panel rounded-2xl rotate-12 animate-float opacity-50 z-0 hidden lg:block"></div>
      <div className="absolute top-1/2 right-10 w-32 h-32 glass-panel rounded-full -rotate-12 animate-float opacity-30 z-0 hidden lg:block" style={{ animationDelay: '2s' }}></div>

    </main>
  );
}
