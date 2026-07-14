export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-radial-gradient from-slate-900 to-slate-950 text-slate-100">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-800 bg-gradient-to-b from-zinc-900/50 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-zinc-800/30 lg:p-4">
          FIFA AI Companion —&nbsp;
          <code className="font-bold text-amber-500">Milestone 0 Foundation</code>
        </p>
      </div>

      <div className="relative flex place-items-center my-12">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg text-center leading-tight">
          FIFA AI Companion
        </h1>
      </div>

      <div className="grid text-center lg:max-w-5xl lg:w-full lg:grid-cols-4 gap-6 text-left">
        <div className="group rounded-2xl border border-transparent px-5 py-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-md border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)]">
          <h2 className="mb-3 text-2xl font-semibold text-amber-500">
            Monorepo{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-slate-400">
            Turborepo workspace with pnpm managing next.js frontend and express backend.
          </p>
        </div>

        <div className="group rounded-2xl border border-transparent px-5 py-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-md border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(5,150,105,0.15)]">
          <h2 className="mb-3 text-2xl font-semibold text-emerald-500">
            Database Client{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-slate-400">
            Prisma ORM connected to PostgreSQL with pgvector (768 dimensions) capability.
          </p>
        </div>

        <div className="group rounded-2xl border border-transparent px-5 py-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-md border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
          <h2 className="mb-3 text-2xl font-semibold text-indigo-400">
            Type Safety{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-slate-400">
            Strict TypeScript typechecking and Zod schemas shared across packages.
          </p>
        </div>

        <div className="group rounded-2xl border border-transparent px-5 py-4 transition-all duration-300 bg-slate-900/40 backdrop-blur-md border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.15)]">
          <h2 className="mb-3 text-2xl font-semibold text-rose-400">
            Logger & Health{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className="m-0 max-w-[30ch] text-sm text-slate-400">
            Structured JSON logging via Pino and dynamic API health endpoint checks.
          </p>
        </div>
      </div>

      <div className="mt-16 text-center text-xs text-slate-500 max-w-md bg-slate-950/60 px-6 py-4 rounded-xl border border-slate-800/80">
        <p className="font-semibold text-slate-400 mb-1">Status: Infrastructure Ready</p>
        <p>No feature logic or AI agents are currently active in compliance with Milestone 0 requirements.</p>
      </div>
    </main>
  );
}
