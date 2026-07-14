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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I am your FIFA AI Companion. Ask me about booking tickets, match commentary, or travel planning suggestions!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [activeTrace, setActiveTrace] = useState<TraceLog | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  // Focus reference for screen readers
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  useEffect(() => {
    // Scroll to bottom on message updates
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load Debug Trace details
  const loadDebugTrace = async (traceId: string) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/chat/debug/traces/${traceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userQuery = input.trim();
    setInput('');
    setIsStreaming(true);
    setActiveTraceId(null);
    setActiveTrace(null);

    // Append User turn locally
    setMessages((prev) => [...prev, { role: 'user', content: userQuery }]);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Session expired. Please sign in again.' },
      ]);
      setIsStreaming(false);
      return;
    }

    try {
      // Add initial assistant turn
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const assistantMessageIndex = messages.length + 1;

      // Call streaming SSE endpoint
      const response = await fetch(`${getApiUrl()}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userQuery }),
      });

      if (!response.body) {
        throw new Error('SSE stream reading is not supported by your browser.');
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
              streamText = `Error: ${dataJSON.error}`;
              setMessages((prev) => {
                const copy = [...prev];
                if (copy[assistantMessageIndex]) {
                  copy[assistantMessageIndex].content = streamText;
                }
                return copy;
              });
              break;
            }

            if (dataJSON.chunk) {
              streamText += dataJSON.chunk;
              setMessages((prev) => {
                const copy = [...prev];
                if (copy[assistantMessageIndex]) {
                  copy[assistantMessageIndex].content = streamText;
                }
                return copy;
              });
            }

            if (dataJSON.done) {
              setActiveTraceId(dataJSON.traceId);
              loadDebugTrace(dataJSON.traceId);

              setMessages((prev) => {
                const copy = [...prev];
                if (copy[assistantMessageIndex]) {
                  copy[assistantMessageIndex].traceId = dataJSON.traceId;
                  copy[assistantMessageIndex].explanation = dataJSON.explanation;
                }
                return copy;
              });
            }
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Failed to stream chat: ${msg}` },
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
      {/* 1. Interactive Chat Container */}
      <section className="md:col-span-2 flex flex-col p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent mb-6">
          FIFA AI Companion Chat
        </h1>

        {/* Scrollable Message Box */}
        <div
          className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 max-h-[60vh] scrollbar-thin"
          role="log"
          aria-live="polite"
          aria-label="Conversation turn logs"
        >
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-600 text-slate-950 font-semibold rounded-tr-none'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-100 rounded-tl-none'
                }`}
              >
                {msg.content || (
                  <span className="flex space-x-1 items-center">
                    <span className="h-2 w-2 bg-amber-500 rounded-full animate-bounce" />
                    <span className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="h-2 w-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </span>
                )}

                {/* Explainer Accordion Trigger */}
                {msg.explanation && (
                  <div className="mt-4 border-t border-slate-850 pt-3">
                    <button
                      type="button"
                      onClick={() => toggleExplanation(index)}
                      className="text-xs font-bold text-amber-500 hover:text-amber-400 focus:outline-none flex items-center space-x-1"
                      aria-expanded={expandedExplanations[index] || false}
                      aria-label="Toggle recommendation explanation justifications"
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
                              <span className="text-emerald-500 font-bold" aria-hidden="true">✓</span>
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
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex space-x-4">
          <input
            ref={messageInputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Type a message (e.g. 'Recommend tickets')"
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none text-slate-100 text-sm"
            aria-label="Input chat text"
          />
          <button
            type="submit"
            disabled={isStreaming}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-slate-950 font-bold transition-all disabled:opacity-50 text-sm"
            aria-label="Submit message query"
          >
            {isStreaming ? 'Streaming...' : 'Send'}
          </button>
        </form>
      </section>

      {/* 2. AI Debug Trace Panel */}
      <aside className="p-8 rounded-3xl bg-slate-900/10 border border-slate-800/80 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex flex-col">
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
