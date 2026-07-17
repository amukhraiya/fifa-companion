import Link from 'next/link';
import { Search, Home, Map } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-md w-full glass-card rounded-3xl p-8 border-primary/20 shadow-[0_20px_50px_rgba(217,119,6,0.1)] text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 relative">
          <span className="absolute -top-2 -right-2 text-primary font-black text-xs bg-primary/20 px-2 py-1 rounded-md border border-primary/30 rotate-12">404</span>
          <Map className="w-10 h-10 text-white/50" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">Lost in the Stadium?</h1>
        <p className="text-white/60 text-sm mb-8">
          The page or route you are looking for does not exist in our navigation registry.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold py-3.5 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" /> Return to Dashboard
          </Link>
          <Link
            href="/chat"
            className="w-full flex items-center justify-center gap-2 bg-white/5 text-white font-bold py-3.5 px-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4" /> Ask AI Companion
          </Link>
        </div>
      </div>
    </main>
  );
}
