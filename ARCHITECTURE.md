# Architecture Guide

The FIFA AI Companion is built with a robust, scalable architecture prioritizing maintainability, testability, and clear separation of concerns.

## Core Patterns

### 1. SOLID Principles
The application strictly adheres to SOLID principles, ensuring that classes and modules have a single responsibility, are open for extension but closed for modification, and depend on abstractions rather than concrete implementations.

### 2. Dependency Injection (DI)
We use Dependency Injection to manage service lifetimes and dependencies. This allows for easily swapping out implementations (e.g., swapping a real API client for a mock one during testing) and keeps components loosely coupled.

### 3. Strategy Pattern
The Strategy Pattern is utilized extensively in the AI Kernel for handling different types of user intents and agent execution behaviors. This allows the system to dynamically select the appropriate reasoning path or tool execution strategy based on context.

### 4. Registry Pattern
Tools, Agents, and Services are managed via Registries. This dynamic discovery mechanism allows new capabilities to be added to the system simply by registering them, without modifying core kernel logic.

### 5. Event Bus (Pub/Sub)
An Event Bus acts as the central nervous system of the application. It facilitates decoupled communication between different parts of the system (e.g., the UI, the AI Kernel, and background services). Events like `SeatRecommendationGenerated` or `FanPreferenceUpdated` are published to the bus, and interested subscribers react accordingly.

## System Components

*   **UI Layer (Next.js App Router)**: Responsible for presentation, routing, and user interaction. It communicates with backend services via API routes or direct service invocation (in Server Components).
*   **Services Layer**: Contains core business logic (e.g., `TicketService`, `MemoryService`, `TelemetryService`).
*   **AI Kernel**: The orchestrator for AI operations, managing prompts, executing tools, and maintaining conversation state. (See [AI.md](./AI.md) for details).
*   **Data Access Layer**: Handles interactions with the database (Prisma) and external APIs.
