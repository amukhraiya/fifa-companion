'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '../context/ChatContext';
import { Bot, User, X, Maximize2, ArrowRight, MessageSquare, Activity } from 'lucide-react';
import Link from 'next/link';

export default function CommanderAIWidget() {
  const { messages, input, setInput, isStreaming, currentThinkingStep, handleSend } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [messages, currentThinkingStep, isOpen]);

  // Don't show floating widget if on the dedicated chat page
  if (pathname === '/chat') return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary to-amber-600 rounded-full flex items-center justify-center text-primary-foreground shadow-[0_0_20px_rgba(217,119,6,0.4)] hover:scale-110 transition-transform animate-fade-in-up"
        aria-label="Open Commander AI"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col glass-card border-primary/30 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-black/40 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Commander AI</h3>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
            </span>
          </div>
        </div>
        <div className="flex gap-2 text-white/50">
          <Link href="/chat" className="hover:text-primary transition-colors p-1" title="Expand to full view">
            <Maximize2 className="w-4 h-4" />
          </Link>
          <button onClick={() => setIsOpen(false)} className="hover:text-rose-400 transition-colors p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 bg-black/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
            <MessageSquare className="w-10 h-10 text-primary mb-3" />
            <p className="text-xs text-white">
              Hi! I&apos;m the FIFA Commander AI. <br /> I can help you book tickets, find travel routes, or check match stats.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'assistant' ? 'bg-primary text-black' : 'bg-white/10 text-white'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-white/5 border border-white/10 text-white rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}

        {currentThinkingStep && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-black">
              <Bot className="w-4 h-4 animate-bounce" />
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm max-w-[80%]">
              <span className="flex items-center gap-2 text-[10px] font-bold text-primary">
                <Activity className="w-3 h-3 animate-pulse" /> {currentThinkingStep}
              </span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-black/40 border-t border-white/10 backdrop-blur-md">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask the Commander AI..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-xs text-white placeholder:text-white/40 focus:border-primary/50 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="absolute right-1 px-3 py-1.5 rounded-lg bg-primary text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
