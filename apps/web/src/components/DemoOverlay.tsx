'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, Info, X } from 'lucide-react';

export default function DemoOverlay() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-50 bg-black/60 backdrop-blur-md border border-primary/30 p-2 rounded-full hover:bg-black/80 transition-all text-primary hover:scale-110 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
      >
        <Sparkles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-72 animate-fade-in-up">
      <div className="glass-card border-primary/30 rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
            <Terminal className="w-4 h-4" />
            Demo Mode Active
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="space-y-3">
          <p className="text-xs text-white/70 leading-relaxed">
            Welcome to the <strong className="text-white">FIFA AI Companion</strong>. This is a Release Candidate built for the Google AI Hackathon.
          </p>
          
          <div className="bg-black/40 border border-white/10 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <Info className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
              <span className="text-white/60"><strong className="text-emerald-400">Mock Data:</strong> Stats, tickets, and telemetry are simulated.</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
              <span className="text-white/60"><strong className="text-amber-400">AI Enabled:</strong> Check Match Day or Chat to see the AI agent patterns.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
