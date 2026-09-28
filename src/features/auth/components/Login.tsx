'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function Login() {
  const [isConnecting, setIsConnecting] = useState(false);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-black">
      <div className="w-full max-w-md p-8 bg-[#0a0a0a] border border-[#27272a] rounded-2xl shadow-xl flex flex-col items-center">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold text-xl mb-6 shadow-lg shadow-green-500/20">
          T
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to TradeEdu</h1>
        <p className="text-[#a1a1aa] text-center mb-8 text-sm">
          Sign in to access your portfolio, discover market trends, and practice trading risk-free.
        </p>

        <a 
          href="/api/v1/auth/login"
          onClick={() => setIsConnecting(true)}
          className={`w-full relative flex items-center justify-center gap-3 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors ${isConnecting ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {isConnecting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          {isConnecting ? 'Connecting...' : 'Continue with Google'}
        </a>

        <div className="w-full mt-6 flex items-center justify-center gap-2 text-xs text-[#a1a1aa]">
          <span>Protected by</span>
          <svg className="w-12 h-auto opacity-70" viewBox="0 0 90 30" fill="currentColor">
            <path d="M12 11h2v8h-2v-8zm11 0h2v8h-2v-8zm11 0h2v8h-2v-8z" />
            <text x="0" y="24" fontSize="12" fontWeight="bold">Google Auth</text>
          </svg>
        </div>
      </div>
    </div>
  );
}
