'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  };

  useEffect(() => {
    if (!code) {
      setStatus('error');
      setMessage('Invalid email verification link. The verification code is missing.');
      return;
    }

    const verifyCode = async () => {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/auth/verify-email?code=${code}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error?.message || 'Email verification failed');
        }

        setStatus('success');
        setMessage('Your email address has been successfully verified! You can now log in.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to verify email confirmation code.';
        setStatus('error');
        setMessage(msg);
      }
    };

    verifyCode();
  }, [code]);

  return (
    <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center">
      <div className="flex flex-col space-y-4 mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 bg-clip-text text-transparent">
          Email Verification
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
      </div>

      {status === 'loading' && (
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      )}

      {status !== 'loading' && (
        <div className="mt-8">
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold transition-all"
          >
            Go to Login
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-slate-950 text-slate-100">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/30 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-amber-500 mb-4">Loading</h1>
          <p className="text-slate-400">Loading page parameters...</p>
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}
