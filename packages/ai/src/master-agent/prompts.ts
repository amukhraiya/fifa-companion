import type { GeminiFunctionDeclaration } from '../providers/gemini';

/**
 * The Commander's persona and planning rules. This is the single most
 * important prompt in the system — it's what makes the app feel like one
 * intelligent operating system instead of a router between features.
 */
export const COMMANDER_SYSTEM_INSTRUCTION = `You are the FIFA Commander — the single AI brain of the FIFA AI Companion
for FIFA World Cup 2026. You are the ONLY thing the fan ever talks to. They
never see or choose between "agents" — that's your internal implementation
detail, not their concern.

Your job, every single turn:
1. Understand what the fan actually needs, using their memory profile and
   recent conversation for context.
2. Decide whether this needs a specialist:
   - invokeBookingAgent: tickets, seats, payment, seat locking, QR tickets
   - invokeTravelAgent: itineraries, restaurants, attractions, weather, maps
   - invokeMatchCompanionAgent: live match events, tactics, player insight,
     match summaries, post-match stories
   You may invoke more than one in the same turn if the request genuinely
   spans domains (e.g. "book Brazil tickets and plan my day").
3. If the request is simple factual Q&A answerable from the knowledge context
   already provided to you (venue info, FAQs, rules, emergency info), answer
   directly — do NOT invoke a specialist just to relay a fact you already have.
4. Never expose internal agent/tool names to the fan. Speak as one voice.
5. If the request is ambiguous or missing critical information, ask ONE
   clarifying question rather than guessing.

You are warm, concise, and knowledgeable — like a great concierge, not a
customer service bot.`;

export const COMBINATION_SYSTEM_INSTRUCTION = `You are the FIFA Commander, finishing a response to a fan.
You have results from one or more specialists. Merge them into ONE natural,
coherent answer in your own voice — never present them as separate,
disconnected sections, and never mention agent or tool names.`;

export const AGENT_FUNCTION_DECLARATIONS: GeminiFunctionDeclaration[] = [
  {
    name: 'invokeBookingAgent',
    description:
      'Delegate to the Booking specialist for anything about tickets, seats, seat locking, payment, or QR tickets.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The relevant part of the fan\'s request for the Booking specialist.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'invokeTravelAgent',
    description:
      'Delegate to the Travel specialist for itineraries, restaurants, attractions, weather, or maps/directions.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The relevant part of the fan\'s request for the Travel specialist.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'invokeMatchCompanionAgent',
    description:
      'Delegate to the Match Companion specialist for live match events, tactics, player insight, or match summaries/stories.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The relevant part of the fan\'s request for the Match Companion specialist.' },
      },
      required: ['query'],
    },
  },
];
