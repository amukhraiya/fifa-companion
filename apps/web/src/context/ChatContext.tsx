'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  traceId?: string;
  explanation?: {
    recommendedMatch: string;
    justifications: string[];
  };
}

export interface TraceLog {
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

interface ChatContextType {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  isStreaming: boolean;
  activeTraceId: string | null;
  activeTrace: TraceLog | null;
  currentThinkingStep: string;
  expandedExplanations: Record<number, boolean>;
  toggleExplanation: (index: number) => void;
  setActiveTraceId: (id: string | null) => void;
  loadDebugTrace: (traceId: string) => Promise<void>;
  handleSend: (e?: React.FormEvent, customInput?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);
  const [activeTrace, setActiveTrace] = useState<TraceLog | null>(null);
  const [currentThinkingStep, setCurrentThinkingStep] = useState<string>('');
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
        localStorage.setItem('accessToken', data.data.accessToken);
        return data.data.accessToken;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to auto-login guest session:', err);
    }
    return null;
  };

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

  const handleSend = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const queryText = customInput || input;
    if (!queryText.trim() || isStreaming) return;

    setInput('');
    setIsStreaming(true);
    setActiveTraceId(null);
    setActiveTrace(null);

    setMessages((prev) => [...prev, { role: 'user', content: queryText }]);

    const token = await ensureSession();
    if (!token) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not establish connection. Please reload.' }]);
      setIsStreaming(false);
      return;
    }

    const thinkingTimeline = [
      'Decomposing query intent...',
      'Analyzing Fan DNA preferences...',
      'Discovering registered matching tools...',
      'Evaluating constraints...',
    ];

    let stepIndex = 0;
    setCurrentThinkingStep(thinkingTimeline[0]);
    const stepTimer = setInterval(() => {
      stepIndex = (stepIndex + 1) % thinkingTimeline.length;
      setCurrentThinkingStep(thinkingTimeline[stepIndex]);
    }, 1200);

    try {
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      const assistantIndex = messages.length + 1;

      const response = await fetch(`${getApiUrl()}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: queryText }),
      });

      clearInterval(stepTimer);
      setCurrentThinkingStep('');

      if (!response.body) throw new Error('SSE Stream reading not supported.');

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
      setMessages((prev) => [...prev, { role: 'assistant', content: `Failed to fetch response: ${msg}` }]);
    } finally {
      setIsStreaming(false);
    }
  };

  const toggleExplanation = (index: number) => {
    setExpandedExplanations((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        isStreaming,
        activeTraceId,
        activeTrace,
        currentThinkingStep,
        expandedExplanations,
        toggleExplanation,
        setActiveTraceId,
        loadDebugTrace,
        handleSend,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
