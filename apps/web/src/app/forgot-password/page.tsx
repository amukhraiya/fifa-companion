'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to dispatch reset request');
      }

      setSuccess('If the email is registered, a recovery link has been sent.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-sm text-slate-400">Enter your email to receive a recovery link</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500/50 focus:outline-none transition-colors text-slate-100"
              placeholder="name@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending link...' : 'Send Recovery Link'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Back to{' '}
          <Link
            href="/login"
            className="text-amber-500 hover:underline font-semibold"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
