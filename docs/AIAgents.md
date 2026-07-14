# AI Agents & Event Bus

The core feature of the FIFA AI Companion is its modular agent setup. Rather than running a monolithic LLM prompt, the system breaks tasks down among specialized agents coordinated by a central orchestrator.

---

## 1. Master Agent Core

The **Master Agent** serves as the central brain of the system. It handles the initial user request and processes it through a multi-step orchestration pipeline:

1.  **Context Loading:** Loads long-term preferences from the `FanMemory` table and rolling-window short-term history from `ConversationTurn`.
2.  **Grounding Retrieval:** Queries the RAG service via pgvector cosine similarity search to extract relevant chunks based on the user prompt.
3.  **Intent Planning:** Performs function-calling classification to identify which specialized agent(s) or tools are required to fulfill the request.
4.  **Delegation Execution:** Invokes selected specialized agent(s) with query context and grounding info.
5.  **Output Combination:** Merges specialized agent outputs into a unified natural-language response.
6.  **Persistence & Emitters:** Appends conversation turns to database logs, updates fan memory profile deltas, and publishes domain events to the Event Bus.

---

## 2. Specialized Agents

*   **Booking Agent:** Parses natural language ticketing requests (e.g. "cheapest seat near midfield"). Queries seats and processes reservations under `SERIALIZABLE` transactions. Generates signed digital ticket QR codes.
*   **Travel Agent:** Constructs customized hour-by-hour travel plans by combining Google Maps, Google Directions, Weather, and Restaurant API data, matching user preferences and game schedules.
*   **Match Companion Agent:** Tracks statistical feeds and timelines (such as the 2022 World Cup Final events) to construct post-match summaries and live commentaries.

---

## 3. Shared Tool Layer

Every tool in the system follows a uniform design contract:
```typescript
interface Tool<Input, Output> {
  name: string;
  schema: z.ZodType<Input>;
  execute(input: Input): Promise<Output>;
}
```
This enables the Master Agent and all specialized agents to access tools dynamically via function-calling.

### 3.1 Primary Tools List
*   `SearchSeatsTool` & `ReserveSeatTool`: Used by the Booking Agent.
*   `WeatherTool`, `MapsTool`, `RouteTool`, `RestaurantTool`: Used by the Travel Agent.
*   `StatisticsTool` & `NewsTool`: Used by the Match Companion Agent.
*   `TranslationTool` & `CrowdTool`: Available globally.

---

## 4. In-Process Event Bus

The **Event Bus** decouples operations. Actions in one agent can publish events that other modules subscribe to asynchronously.

### 4.1 Implementation
*   Powered by Node.js `EventEmitter`.
*   Includes independent error handlers so that a failure in one subscriber does not disrupt the main request-response cycle.
*   Logs all published events to an append-only database `Event` table to serve as an audit trail.

### 4.2 Core Event Streams
*   `BookingCompleted`: Triggers ticket signing, schedules a travel plan suggestion, sends confirmation alerts, and updates analytical logs.
*   `PaymentFailed`: Releases seat locks, sends warnings, and invalidates cache states.
```
 BookingCompleted
 ├── TicketService (Generate signed QR ticket)
 ├── TravelAgent (Schedules travel options suggestions)
 ├── NotificationTool (Sends instant alert confirmation)
 └── Analytics (Logs event for audit trail)
```
