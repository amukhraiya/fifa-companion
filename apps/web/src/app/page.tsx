import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center border-b border-slate-900 bg-slate-950/60 backdrop-blur-md z-20">
        <span className="font-extrabold text-amber-500 uppercase tracking-widest text-xs">FIFA AI Companion</span>
        <div className="flex space-x-4">
          <Link href="/login" className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-bold transition-all border border-slate-800">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-550 to-emerald-550 text-slate-950 hover:opacity-90 text-xs font-bold transition-all">
            Register
          </Link>
        </div>
      </header>

      <div className="relative flex flex-col items-center my-12 text-center space-y-4 max-w-2xl">
        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-wider">
          🏆 Tournament Assistant Portal
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent drop-shadow-lg leading-tight">
          FIFA AI Companion
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed">
          Your smart World Cup companion—assisting you with Fan DNA profiling, real-time ticket recommendation, transactional booking, travel planning, and live match intelligence.
        </p>
      </div>

      <div className="grid text-left lg:max-w-5xl lg:w-full md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Link href="/onboarding" className="group rounded-2xl border border-slate-900 px-4 py-4 transition-all duration-300 bg-slate-900/30 backdrop-blur-md hover:border-amber-500/30 hover:bg-slate-905 hover:shadow-[0_0_15px_rgba(217,119,6,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h2 className="mb-2 text-sm font-bold text-amber-500">
              1. Onboarding
            </h2>
            <p className="m-0 text-[10px] text-slate-400 leading-relaxed">
              Define your favorite teams, budget, accessibility needs, and group size to tailor the companion.
            </p>
          </div>
          <span className="text-[9px] text-amber-450 font-bold mt-4 uppercase">Profile Setup ➔</span>
        </Link>

        <Link href="/dashboard" className="group rounded-2xl border border-slate-900 px-4 py-4 transition-all duration-300 bg-slate-900/30 backdrop-blur-md hover:border-emerald-500/30 hover:bg-slate-905 hover:shadow-[0_0_15px_rgba(5,150,105,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h2 className="mb-2 text-sm font-bold text-emerald-500">
              2. Ticket Booking
            </h2>
            <p className="m-0 text-[10px] text-slate-400 leading-relaxed">
              Visualize recommendations, lock seats on interactive SVG stadium maps, and generate digital tickets.
            </p>
          </div>
          <span className="text-[9px] text-emerald-450 font-bold mt-4 uppercase">Reserve Seats ➔</span>
        </Link>

        <Link href="/travel" className="group rounded-2xl border border-slate-900 px-4 py-4 transition-all duration-300 bg-slate-900/30 backdrop-blur-md hover:border-sky-500/30 hover:bg-slate-905 hover:shadow-[0_0_15px_rgba(14,165,233,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h2 className="mb-2 text-sm font-bold text-sky-400">
              3. Travel Hub
            </h2>
            <p className="m-0 text-[10px] text-slate-400 leading-relaxed">
              Plan routes (Best, Cheap, Fast, Accessible), view crowd density, local dining, and hotel listings.
            </p>
          </div>
          <span className="text-[9px] text-sky-450 font-bold mt-4 uppercase">Commute Plan ➔</span>
        </Link>

        <Link href="/match-day" className="group rounded-2xl border border-slate-900 px-4 py-4 transition-all duration-300 bg-slate-900/30 backdrop-blur-md hover:border-amber-500/30 hover:bg-slate-905 hover:shadow-[0_0_15px_rgba(245,158,11,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h2 className="mb-2 text-sm font-bold text-amber-500">
              4. Match Companion
            </h2>
            <p className="m-0 text-[10px] text-slate-400 leading-relaxed">
              Experience play-by-play commentary, live win predictor charts, and safety dispatch.
            </p>
          </div>
          <span className="text-[9px] text-amber-450 font-bold mt-4 uppercase">Live Companion ➔</span>
        </Link>

        <Link href="/developer/command-center" className="group rounded-2xl border border-slate-900 px-4 py-4 transition-all duration-300 bg-slate-900/30 backdrop-blur-md hover:border-indigo-500/30 hover:bg-slate-905 hover:shadow-[0_0_15px_rgba(99,102,241,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <h2 className="mb-2 text-sm font-bold text-indigo-400">
              5. Debug Panel
            </h2>
            <p className="m-0 text-[10px] text-slate-400 leading-relaxed">
              Observe AI Kernel execution planner states, active registry tools, and Event Bus live timelines.
            </p>
          </div>
          <span className="text-[9px] text-indigo-450 font-bold mt-4 uppercase">Kernel Trace ➔</span>
        </Link>
      </div>

      <div className="mt-16 text-center text-[10px] text-slate-500">
        <p>FIFA AI Companion Monorepo V2 • Infrastructure Ready</p>
      </div>
    </main>
  );
}
