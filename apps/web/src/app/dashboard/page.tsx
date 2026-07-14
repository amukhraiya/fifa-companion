'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  memory?: {
    id: string;
    favoriteTeam?: string | null;
    favoritePlayers?: string | null; // JSON String or array
    language: string;
    budget?: number | null;
    travelStyle?: string | null;
    foodPreference?: string | null;
    accessibilityNeeds?: string | null;
    seatPreference?: string | null;
    atmospherePreference?: string | null;
    matchInterests?: string | null; // JSON String or array
    fanProfile?: string | null;
  } | null;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [completion, setCompletion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || 'Failed to load profile');
        }

        const user = data.data.user as UserProfile;
        setProfile(user);

        // Fetch percentage info by invoking memory details endpoint
        const memRes = await fetch(`${getApiUrl()}/api/v1/users/me/fan-memory`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        });
        const memData = await memRes.json();
        if (memRes.ok) {
          setCompletion(memData.data.completionPercentage);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to retrieve profile';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
          <p className="text-sm text-slate-400">Loading your companion dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center">
          <h1 className="text-2xl font-bold text-rose-500 mb-4">Error</h1>
          <p className="text-slate-300 text-sm mb-6">{error}</p>
          <button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-all"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const memory = profile?.memory;
  const favoritePlayersList = memory?.favoritePlayers
    ? typeof memory.favoritePlayers === 'string'
      ? JSON.parse(memory.favoritePlayers)
      : memory.favoritePlayers
    : [];

  const matchInterestsList = memory?.matchInterests
    ? typeof memory.matchInterests === 'string'
      ? JSON.parse(memory.matchInterests)
      : memory.matchInterests
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <header className="flex justify-between items-center pb-6 border-b border-slate-900">
          <div className="flex flex-col">
            <span className="text-xs uppercase font-bold text-amber-500 tracking-widest">FIFA AI Companion</span>
            <span className="text-2xl font-bold text-white">Fan Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all text-xs font-semibold text-slate-300"
          >
            Sign Out
          </button>
        </header>

        {/* Welcome Section */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-r from-slate-900/40 to-slate-900/10 border border-slate-800/80 backdrop-blur-xl shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold">
                Fan DNA Core
              </span>
              <h1 className="text-3xl font-extrabold text-white">
                Welcome, {profile?.email.split('@')[0]}!
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                Your onboarding setup is complete. Your preferences have been synchronized. Future AI actions will use this profile.
              </p>
            </div>
            
            <div className="flex space-x-4 mt-8">
              <Link
                href="/onboarding"
                className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 transition-all text-xs font-semibold text-amber-400"
              >
                Update Onboarding Flow
              </Link>
            </div>
          </div>

          {/* Derived FanDNA DNA summary card */}
          <div className="p-8 rounded-3xl bg-gradient-to-br from-amber-600/10 to-emerald-600/10 border border-slate-800/80 backdrop-blur-xl shadow-xl space-y-6">
            <h2 className="text-xl font-bold text-slate-100">Your Fan DNA</h2>
            
            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Derived Profile Segment
              </span>
              <span className="text-2xl font-black bg-gradient-to-r from-amber-500 to-emerald-500 bg-clip-text text-transparent">
                {memory?.fanProfile || 'Stadium Explorer'}
              </span>
            </div>

            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                Completion Rate
              </span>
              <div className="flex items-center space-x-3">
                <div className="w-full bg-slate-850 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${completion}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-200">{completion}%</span>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed DNA profile attributes */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-800/80 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3">Identity & Selection</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400 mb-1">Preferred Language</span>
                <span className="font-semibold text-slate-200">{memory?.language === 'es' ? 'Español' : 'English'}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">Favorite Team</span>
                <span className="font-semibold text-slate-200">{memory?.favoriteTeam || 'Not Selected'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-400 mb-1">Favorite Players</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {favoritePlayersList.length > 0 ? (
                    favoritePlayersList.map((player: string) => (
                      <span key={player} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-850 text-xs text-slate-300">
                        {player}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/20 border border-slate-800/80 backdrop-blur-xl space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-slate-900 pb-3">Trip & Stadium Setup</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs text-slate-400 mb-1">Ticket Seating Category</span>
                <span className="font-semibold text-slate-200">{memory?.seatPreference || 'Not Selected'}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">Catering Preferences</span>
                <span className="font-semibold text-slate-200">{memory?.foodPreference || 'Not Selected'}</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">Budget Allocation</span>
                <span className="font-semibold text-slate-200">${memory?.budget || 0} USD</span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 mb-1">Travel Style Mode</span>
                <span className="font-semibold text-slate-200">{memory?.travelStyle || 'Not Selected'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-400 mb-1">Accessibility Services</span>
                <span className="font-semibold text-slate-200">{memory?.accessibilityNeeds || 'None'}</span>
              </div>
              <div className="col-span-2">
                <span className="block text-xs text-slate-400 mb-1">Match Interests</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {matchInterestsList.length > 0 ? (
                    matchInterestsList.map((interest: string) => (
                      <span key={interest} className="px-3 py-1 rounded-full bg-slate-900 border border-slate-850 text-xs text-slate-300">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
