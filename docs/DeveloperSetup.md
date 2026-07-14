# Developer Setup Guide

This guide outlines instructions for setting up your local environment and running verification checks in the FIFA AI Companion monorepo.

---

## 1. Prerequisites

Before starting, ensure you have the following installed:
*   **Node.js:** Version `24.13.0` or higher.
*   **pnpm:** Version `11.13.0` or higher (we run commands via `npx pnpm` to use the workspace manager without global setup).
*   **PostgreSQL:** Version 15 or higher, configured with the `pgvector` extension.

---

## 2. Initial Setup

### 2.1 Clone and Install
Install the monorepo dependencies:
```bash
npx pnpm install
```
*Note: Dependencies requiring compilation scripts (e.g., Prisma, esbuild) are authorized under the `allowBuilds` config in `pnpm-workspace.yaml`.*

### 2.2 Configure Environment
Create a `.env` file in the root directory:
```properties
DATABASE_URL="postgresql://postgres:password@localhost:5432/fifa_companion?schema=public"
PORT=3001
NODE_ENV=development
JWT_SECRET=dev_jwt_secret_token_change_in_prod
```

### 2.3 Setup Database
Generate the Prisma Client and seed the local database:
```bash
# Generate type-safe Prisma client
npx prisma generate

# Create tables and apply seed data (stadiums, matches, teams, seats)
npx prisma db push
npx prisma db seed
```

---

## 3. Development Commands

Run monorepo development commands from the project root:

### 3.1 Run Development Servers
Starts Next.js frontend (`apps/web` on port 3000) and Express API (`apps/api` on port 3001) concurrently:
```bash
npx pnpm dev
```

### 3.2 Run Code Verification
Verify project formatting, type safety, test suites, and production compiles:
```bash
# Check ESLint v9 Flat configurations
npx pnpm -r lint

# Validate TypeScript typechecks
npx pnpm -r typecheck

# Execute Vitest test suites
npx pnpm -r test

# Compile production builds
$env:SKIP_ENV_VALIDATION="true"; npx pnpm -r build
```

---

## 4. Troubleshooting

### 4.1 Missing Dependencies during `prisma generate`
If `prisma generate` attempts to run `pnpm add` and fails due to workspace restrictions, declare the `@prisma/client` package directly in your root `package.json` dependencies and run `npx pnpm install`.

### 4.2 Build Fails due to Missing Env Vars
If you are compiling builds in a CI/CD environment without active PostgreSQL access, compile using `SKIP_ENV_VALIDATION=true` to skip active Zod schema checks.
```bash
# Windows PowerShell
$env:SKIP_ENV_VALIDATION="true"; npx pnpm -r build

# Linux / macOS Bash
SKIP_ENV_VALIDATION=true npx pnpm -r build
```

### 4.3 pgvector Extension Errors
If you see pgvector errors, ensure that your Postgres database has the extension installed. You can enable it manually by running:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
