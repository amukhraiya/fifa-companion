'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('App Error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] mix-blend-screen opacity-50"></div>
      </div>

      <div className="relative z-10 max-w-md w-full glass-card rounded-3xl p-8 border-rose-500/20 shadow-[0_20px_50px_rgba(244,63,94,0.1)] text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-black text-white mb-2">System Error</h1>
        <p className="text-white/60 text-sm mb-8">
          The AI Kernel encountered an unexpected fault. Our telemetry systems have logged the incident.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <Link
            href="/dashboard"
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 text-white font-bold py-3 px-6 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            <Home className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
