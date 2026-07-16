'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  traceId?: string;
  explanation?: {
    recommendedMatch: string;
    justifications: string[];
  };
}

interface TraceLog {
  executionId: string;
  timestamp: string;
  intent: string;
  agent: string;
  tools: string[];
  toolCalls: Array<{ toolName: string; duration: number; success: boolean }>;
  memoryReads: string[];
  memoryInjected: boolean;
  ragReads: string[];
  executionTime: number;
  success: boolean;
  confidence: number;
  reasoningPath: string[];
  promptVersion: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [activeTrace, setActiveTrace] = useState<TraceLog | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [currentThinkingStep, setCurrentThinkingStep] = useState<string>('');

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  // Auto-login session recovery to prevent session expired errors
  const ensureSession = async (): Promise<string | null> => {
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
        const accessToken = data.data.accessToken as string;
        localStorage.setItem('accessToken', accessToken);
        return accessToken;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to auto-login guest session:', err);
    }
    return null;
  };

  useEffect(() => {
    ensureSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentThinkingStep]);

  const loadDebugTrace = async (traceId: string) => {
    const token = await ensureSession();
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/chat/debug/traces/${traceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActiveTrace(data.data.trace);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to load debug trace:', err);
    }
  };

  const handleSend = async (e: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const queryText = customInput || input;
    if (!queryText.trim() || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setActiveTraceId(null);
    setActiveTrace(null);

    // Append User message
    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);

    const token = await ensureSession();
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Could not establish connection. Please reload.' },
      ]);
      setIsStreaming(false);
      return;
    }

    // Simulate animated thinking steps
    const thinkingTimeline = [
      'Decomposing query intent...',
      'Analyzing Fan DNA preferences...',
      'Discovering registered matching tools...',
      'Evaluating seat visibility & budget constraints...',
    ];

    let stepIndex = 0;
    setCurrentThinkingStep(thinkingTimeline[0]);
    const stepTimer = setInterval(() => {
      stepIndex = (stepIndex + 1) % thinkingTimeline.length;
      setCurrentThinkingStep(thinkingTimeline[stepIndex]);
    }, 1200);

    try {
      // Add empty assistant response to hold output
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const assistantIndex = messages.length + 1;

      const response = await fetch(`${getApiUrl()}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: queryText }),
      });

      // Clear the thinking timeline once stream starts delivering chunks
      clearInterval(stepTimer);
      setCurrentThinkingStep('');

      if (!response.body) {
        throw new Error('SSE Stream reading not supported.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataJSON = JSON.parse(line.substring(6));

            if (dataJSON.error) {
              streamText = `Execution error: ${dataJSON.error}`;
              setMessages((prev) => {
                const copy = [...prev];
                copy[assistantIndex].content = streamText;
                return copy;
              });
              break;
            }

            if (dataJSON.chunk) {
              streamText += dataJSON.chunk;
              setMessages((prev) => {
                const copy = [...prev];
                copy[assistantIndex].content = streamText;
                return copy;
              });
            }

            if (dataJSON.done) {
              setActiveTraceId(dataJSON.traceId);
              loadDebugTrace(dataJSON.traceId);

              setMessages((prev) => {
                const copy = [...prev];
                copy[assistantIndex].traceId = dataJSON.traceId;
                copy[assistantIndex].explanation = dataJSON.explanation;
                return copy;
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      clearInterval(stepTimer);
      setCurrentThinkingStep('');
      const msg = err instanceof Error ? err.message : 'Execution failed';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to fetch response: ${msg}` },
      ]);
    } finally {
      setIsStreaming(false);
      messageInputRef.current?.focus();
    }
  };

  const toggleExplanation = (index: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <main className="grid md:grid-cols-3 min-h-screen bg-slate-950 text-slate-100 p-6 gap-6">
      {/* 1. Chat Interface Container */}
      <section className="md:col-span-2 flex flex-col p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent">
            FIFA Intelligent AI Companion
          </h1>
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase">Online Agent</span>
          </div>
        </div>

        {/* Scrollable Message Box */}
        <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 max-h-[60vh] scrollbar-thin">
          {messages.length === 0 ? (
            /* AI Welcome Hero */
            <div className="py-10 text-center space-y-6 max-w-xl mx-auto">
              <div className="h-16 w-16 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto text-3xl animate-bounce">
                🤖
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-100">Welcome Back, Fan Supporter! 🌟</h2>
                <p className="text-xs text-slate-400">
                  I can check tournament statistics, locate stadiums, analyze ticket pricing categories, or match your budget preferences.
                </p>
              </div>

              {/* Quick Suggestion Prompts */}
              <div className="grid grid-cols-2 gap-3 pt-4 text-left">
                {[
                  { title: '🎫 Cheapest Tickets', desc: 'Find lowest ticket prices for Brazil match', query: 'I want the cheapest Brazil match' },
                  { title: '⚽ VIP Tickets', desc: 'Book VIP midfield category seats', query: 'I want VIP seats' },
                  { title: '🚇 Stadium Travel', desc: 'Check travel times to Lusail Stadium', query: 'How do I travel to the stadium?' },
                  { title: '🌟 Match Discovery', desc: 'Find matches features Argentina', query: 'Recommend a match features Argentina' },
                ].map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={(e) => handleSend(e, s.query)}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-850 hover:border-amber-500/30 transition-all text-xs space-y-1 focus:outline-none"
                  >
                    <div className="font-bold text-slate-200">{s.title}</div>
                    <div className="text-slate-500 text-[10px]">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {/* AI Avatar */}
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950">
                    AI
                  </div>
                )}

                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-600 text-slate-950 font-semibold rounded-tr-none'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.content}

                    {/* Explainer justifications Accordion */}
                    {msg.explanation && (
                      <div className="mt-4 border-t border-slate-850 pt-3">
                        <button
                          type="button"
                          onClick={() => toggleExplanation(index)}
                          className="text-xs font-bold text-amber-500 hover:text-amber-400 focus:outline-none flex items-center space-x-1"
                          aria-expanded={expandedExplanations[index] || false}
                        >
                          <span>Why this recommendation?</span>
                          <span>{expandedExplanations[index] ? '▲' : '▼'}</span>
                        </button>

                        {expandedExplanations[index] && (
                          <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-850 space-y-2 text-slate-300">
                            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Recommended because:
                            </span>
                            <ul className="space-y-1 text-xs">
                              {msg.explanation.justifications.map((just, idx) => (
                                <li key={idx} className="flex items-center space-x-2">
                                  <span className="text-emerald-500 font-bold">✓</span>
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
                      className="text-[10px] text-slate-500 hover:text-amber-500 transition-colors mt-1 underline focus:outline-none"
                    >
                      View Trace Log: {msg.traceId.substring(0, 8)}
                    </button>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center text-xs font-bold text-slate-950">
                    ME
                  </div>
                )}
              </div>
            ))
          )}

          {/* Animated Thinking Timeline Loading Indicators */}
          {currentThinkingStep && (
            <div className="flex items-start space-x-3 justify-start">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-xs text-slate-950 animate-pulse">
                ⏳
              </div>
              <div className="p-4 bg-slate-900/80 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-none max-w-xl space-y-3">
                <span className="flex space-x-1.5 items-center text-xs font-semibold text-amber-500">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping mr-1" />
                  <span>{currentThinkingStep}</span>
                </span>
                <div className="space-y-1.5">
                  <div className="h-2 w-48 bg-slate-800 rounded animate-pulse" />
                  <div className="h-2 w-64 bg-slate-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form Bar */}
        <form onSubmit={(e) => handleSend(e)} className="flex space-x-4">
          <input
            ref={messageInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Type a message (e.g. 'I want the cheapest Brazil match')"
            className="flex-1 px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-slate-100 text-sm placeholder:text-slate-650"
            aria-label="Input chat text"
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold transition-all disabled:opacity-50 text-sm"
            aria-label="Submit message query"
          >
            {isStreaming ? 'Thinking...' : 'Send'}
          </button>
        </form>
      </section>

      {/* 2. AI Debug Trace Panel */}
      <aside className="p-8 rounded-3xl bg-slate-900/10 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col border-b border-slate-900 pb-4">
          <span className="text-xs uppercase font-bold text-amber-500 tracking-widest">Observability</span>
          <h2 className="text-2xl font-bold text-white">AI Debug Panel</h2>
          {activeTraceId && <span className="text-[10px] text-slate-500 font-mono">Active: {activeTraceId}</span>}
        </div>

        {activeTrace ? (
          <div className="space-y-6 text-sm text-slate-300">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-4">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Trace ID</span>
                <span className="font-mono text-xs font-semibold text-slate-200">
                  {activeTrace.executionId.substring(0, 13)}...
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Prompt Version</span>
                <span className="font-semibold text-slate-200">{activeTrace.promptVersion}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Intent</span>
                <span className="font-bold text-amber-500 uppercase">{activeTrace.intent}</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Confidence</span>
                <span className="font-bold text-emerald-400">{(activeTrace.confidence * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Memory Snapshots</span>
                <span className="font-semibold text-slate-200">
                  {activeTrace.memoryInjected ? '✓ Injected' : 'None'}
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Latency</span>
                <span className="font-semibold text-slate-200">{activeTrace.executionTime} ms</span>
              </div>
            </div>

            {/* Reasoning Steps */}
            <div>
              <span className="block text-xs font-bold text-slate-100 mb-3">Reasoning Path Execution Steps</span>
              <div className="space-y-3 pl-2 border-l border-slate-800">
                {activeTrace.reasoningPath.map((step, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute left-[-13px] top-[6px] h-2.5 w-2.5 rounded-full bg-amber-500 border border-slate-950" />
                    <span className="text-xs leading-relaxed text-slate-400">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tools Executed */}
            <div>
              <span className="block text-xs font-bold text-slate-100 mb-3">Tool Invocations via Registry</span>
              <div className="space-y-2">
                {activeTrace.tools.length > 0 ? (
                  activeTrace.tools.map((tool) => (
                    <div key={tool} className="flex justify-between items-center p-3 rounded-xl bg-slate-950/80 border border-slate-900 text-xs">
                      <span className="font-mono text-slate-300">⚙ {tool}</span>
                      <span className="text-emerald-400 font-semibold">✓ Discovered</span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-xs">No tool invocations executed.</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <span className="text-4xl mb-4">🔎</span>
            <p className="text-sm">Submit a message turn to view the observability execution traces in real-time.</p>
          </div>
        )}
      </aside>
    </main>
  );
}
