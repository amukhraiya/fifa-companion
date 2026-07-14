
# FIFA AI Companion — Monorepo

Welcome to the FIFA AI Companion project. This monorepo is built using Turborepo and `pnpm` workspaces, establishing a production-grade infrastructure that supports Next.js 15 for the web frontend, Express for the backend API, Prisma ORM for database mapping, and structured configurations.

---

## 📂 Folder Structure

```text
fifa-ai-companion/
├── apps/
│   ├── api/                     # Express backend API server
│   │   ├── src/
│   │   │   ├── lib/             # API helpers (logger, database clients)
│   │   │   ├── routes/          # Express route definitions (health, etc.)
│   │   │   └── index.ts         # Backend entrypoint (fails-fast on env verification)
│   │   └── tsconfig.json
│   └── web/                     # Next.js 15 Frontend
│       ├── src/
│       │   └── app/             # Next.js App Router (pages, layout, styles)
│       ├── next.config.js
│       ├── tailwind.config.ts
│       └── tsconfig.json
├── packages/
│   ├── config/                  # Shared system configurations
│   │   ├── env.ts               # Environment variable validation via Zod
│   │   ├── eslint.base.json     # Base linter configuration
│   │   ├── prettier.base.json   # Base formatter configuration
│   │   └── tsconfig.base.json   # Base compiler configuration
│   ├── shared-types/            # Shared types and validation schemas
│   │   └── src/index.ts         # Zod schemas (User, Memory, Response shapes)
│   ├── ai/                      # Scaffolding for AI Agents
│   │   └── src/                 # Directory structure for agents, memory, tools
│   └── ui/                      # Shared Tailwind & UI utility layer
│       ├── src/                 # Reusable helper functions
│       └── tailwind.config.ts   # Base tailwind theme configurations
├── prisma/
│   ├── schema.prisma            # PostgreSQL & pgvector schema configuration
│   └── seed.ts                  # Seeding script for venue/match/city data
├── data/
│   └── matchEvents.json         # 2022 World Cup Final replay events
├── turbo.json                   # Turborepo task pipeline configuration
└── pnpm-workspace.yaml          # Monorepo workspaces definition
```

---

## 🛠️ Development Commands

We utilize `npx pnpm` to run monorepo scripts without global installation dependencies.

*   **Install Dependencies:**
    ```bash
    npx pnpm install
    ```
*   **Run Development Server:**
    ```bash
    npx pnpm dev
    ```
*   **Compile / Build All Packages & Apps:**
    ```bash
    npx pnpm build
    ```
*   **Run Linter across all workspaces:**
    ```bash
    npx pnpm lint
    ```
*   **Run Typechecks across all workspaces:**
    ```bash
    npx pnpm typecheck
    ```
*   **Run Tests:**
    ```bash
    npx pnpm test
    ```
*   **Prisma Client Generation:**
    ```bash
    npx prisma generate
    ```
*   **Run Seed Database script:**
    ```bash
    npx prisma db seed
    ```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory. The application enforces validation of these variables at startup.

| Variable Name   | Default Value                                | Description                                               |
| :-------------- | :------------------------------------------- | :-------------------------------------------------------- |
| `DATABASE_URL`  | *(Required)*                                 | PostgreSQL database connection string (e.g. `postgresql://user:pass@localhost:5432/db`) |
| `PORT`          | `3001`                                       | Port number for the Express API server                   |
| `NODE_ENV`      | `development`                                | Deployment environment (`development` \| `production` \| `test`) |
| `JWT_SECRET`    | `default_jwt_secret_change_me_in_production` | Cryptographic secret for signing auth tokens              |

---

## 🏗️ Architecture Summary

Based on **Architecture v2**, the FIFA AI Companion adheres to these core architectural decisions:
1.  **Single Chat Interface:** The frontend communicates with a single Master Agent orchestration gateway. Downstream specialized agents (Booking, Travel, Match Companion) are internal implementation details.
2.  **Shared Memory Service:** Profile settings and session turns are stored in a single Postgres-based Memory Service schema (`FanMemory` + `ConversationTurn`), avoiding distributed caching complexity.
3.  **Explicit RAG Retrieval Layer:** Context documents are ingested, split into chunks, and matched using `pgvector` embeddings configured to **768 dimensions** (aligned with Gemini Pro).
4.  **Reusable Tool Registry:** All custom tools implement a standard `execute(input)` signature and schema validation to maintain agent independence.
5.  **Event Bus System:** Inter-agent events propagate via an in-process pub-sub system.
=======
# fifa-companion
This is an AI based application for users to easily enjoy the fifa worldcup this year

