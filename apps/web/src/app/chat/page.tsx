'use client';

import React, { useRef, useEffect } from 'react';
import { Bot, User, ChevronDown, ChevronUp, CheckCircle2, Terminal, Code2, ArrowRight, Activity, Search, Sparkles } from 'lucide-react';
import { useChat } from '../../context/ChatContext';

export default function ChatPage() {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    activeTraceId,
    activeTrace,
    expandedExplanations,
    currentThinkingStep,
    toggleExplanation,
    setActiveTraceId,
    loadDebugTrace,
    handleSend
  } = useChat();

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentThinkingStep]);

  return (
    <main className="min-h-screen bg-background relative overflow-hidden grid lg:grid-cols-3 gap-6 p-4 md:p-6 lg:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full mix-blend-screen"></div>
      </div>

      {/* 1. Chat Interface Container */}
      <section className="lg:col-span-2 flex flex-col glass-card rounded-3xl overflow-hidden relative z-10 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] h-[calc(100vh-4rem)]">
        <div className="flex justify-between items-center px-8 py-6 border-b border-white/10 bg-black/20 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-tight">
                FIFA Intelligent AI Companion
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Agent Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Message Box */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full max-w-lg mx-auto text-center space-y-8 animate-fade-in-up">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-amber-600/20 rounded-full flex items-center justify-center border border-primary/30 relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping-slow"></div>
                <Bot className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-3">How can I assist you today?</h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  I can check tournament statistics, locate stadiums, analyze ticket pricing categories, or match your budget preferences based on your Fan DNA.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                {[
                  { icon: Sparkles, title: 'Cheapest Tickets', desc: 'Find lowest ticket prices for Brazil match', query: 'I want the cheapest Brazil match tickets' },
                  { icon: Sparkles, title: 'VIP Tickets', desc: 'Book VIP midfield category seats', query: 'I want VIP seats for the final' },
                  { icon: Sparkles, title: 'Stadium Travel', desc: 'Check travel times to Lusail Stadium', query: 'How do I travel to the Lusail stadium?' },
                  { icon: Sparkles, title: 'Match Discovery', desc: 'Find matches featuring Argentina', query: 'Recommend a match that features Argentina' },
                ].map((s, i) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={(e) => handleSend(e, s.query)}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all text-left group animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <s.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                      <div className="font-bold text-white text-sm">{s.title}</div>
                    </div>
                    <div className="text-white/50 text-xs">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-fade-in-up`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-br from-primary to-emerald-500 text-black' 
                    : 'bg-white/10 border border-white/20 text-white'
                }`}>
                  {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>

                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md'
                      : 'bg-white/5 border border-white/10 text-white rounded-tl-sm backdrop-blur-sm'
                  }`}>
                    {msg.content}

                    {msg.explanation && (
                      <div className="mt-4 border-t border-white/10 pt-4">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(index)}
                          className="text-xs font-bold text-primary hover:text-amber-400 flex items-center gap-2 transition-colors"
                        >
                          Why this recommendation?
                          {expandedExplanations[index] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>

                        {expandedExplanations[index] && (
                          <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 animate-fade-in">
                            <span className="block text-[10px] font-bold text-white/50 uppercase tracking-widest">
                              Reasoning:
                            </span>
                            <ul className="space-y-2">
                              {msg.explanation.justifications.map((just, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-xs text-white/80">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                  <span>{just}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {msg.traceId && (
                    <button
                      onClick={() => {
                        setActiveTraceId(msg.traceId || null);
                        loadDebugTrace(msg.traceId || '');
                      }}
                      className="text-[10px] text-white/40 hover:text-primary transition-colors mt-2 flex items-center gap-1 font-mono uppercase tracking-wider"
                    >
                      <Terminal className="w-3 h-3" /> View Trace: {msg.traceId.substring(0, 8)}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {currentThinkingStep && (
            <div className="flex gap-4 animate-fade-in-up">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shrink-0 shadow-lg text-black">
                <div className="flex gap-1">
                  <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '0s' }}></span>
                  <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1 h-1 rounded-full bg-black animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 text-white rounded-2xl rounded-tl-sm backdrop-blur-sm max-w-[80%] flex flex-col gap-2">
                <span className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Activity className="w-3 h-3 animate-pulse" />
                  {currentThinkingStep}
                </span>
                <div className="space-y-2">
                  <div className="h-1.5 w-32 bg-white/10 rounded-full animate-pulse" />
                  <div className="h-1.5 w-48 bg-white/10 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form Bar */}
        <div className="p-6 bg-black/40 border-t border-white/10 backdrop-blur-md">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              ref={messageInputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder="Ask the AI Companion..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-32 py-4 text-sm text-white placeholder:text-white/40 focus:border-primary/50 focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="absolute right-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-amber-600 text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isStreaming ? 'Working...' : <><span className="hidden sm:inline">Send</span> <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        </div>
      </section>

      {/* 2. AI Debug Trace Panel */}
      <aside className="hidden lg:flex flex-col glass-panel rounded-3xl border-primary/20 p-6 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 relative z-10">
        <div className="flex flex-col mb-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest">Observability</span>
          </div>
          <h2 className="text-2xl font-black text-white">AI Debug Panel</h2>
          {activeTraceId && <span className="text-xs text-white/50 font-mono mt-1">Trace: {activeTraceId}</span>}
        </div>

        {activeTrace ? (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="block text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Intent</span>
                <span className="font-bold text-primary text-sm uppercase">{activeTrace.intent}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="block text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Confidence</span>
                <span className="font-bold text-emerald-400 text-sm">{(activeTrace.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="block text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Memory</span>
                <span className="font-bold text-white text-sm">{activeTrace.memoryInjected ? '✓ Injected' : 'None'}</span>
              </div>
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <span className="block text-[9px] text-white/40 uppercase tracking-widest font-bold mb-1">Latency</span>
                <span className="font-bold text-white text-sm">{activeTrace.executionTime} ms</span>
              </div>
            </div>

            <div>
              <span className="block text-sm font-black text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" /> Reasoning Execution
              </span>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                {activeTrace.reasoningPath.map((step, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white/20 bg-background group-[.is-active]:bg-primary group-[.is-active]:border-primary/50 text-white group-[.is-active]:text-black shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <span className="text-[10px] font-bold">{idx + 1}</span>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-white/5 border border-white/10 shadow text-xs text-white/80">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-sm font-black text-white mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-sky-400" /> Tool Invocations
              </span>
              <div className="space-y-2">
                {activeTrace.tools.length > 0 ? (
                  activeTrace.tools.map((tool) => (
                    <div key={tool} className="flex justify-between items-center p-3 rounded-xl bg-black/40 border border-white/10 text-xs">
                      <span className="font-mono text-white/80">{tool}()</span>
                      <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest">✓ Success</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-white/50 text-center italic">
                    No tool invocations executed in this trace.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <Search className="w-12 h-12 text-white/30" />
            <p className="text-sm text-white/60 max-w-[200px]">Submit a message turn to view execution traces.</p>
          </div>
        )}
      </aside>
    </main>
  );
}
