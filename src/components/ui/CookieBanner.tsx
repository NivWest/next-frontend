'use client';

import { useUIStore } from '@/store/useUIStore';
import { useState } from 'react';

export function CookieBanner() {
  const { cookieConsentDismissed, dismissCookieConsent } = useUIStore();
  const [preferences, setPreferences] = useState({ essential: true, nonEssential: false });

  if (cookieConsentDismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-[#27272a] p-4 md:p-6 z-40 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-sm text-[#a1a1aa] max-w-3xl">
        <strong className="text-white block mb-1">Cookie Preferences</strong>
        We use essential cookies to make our site work. We'd also like to set optional analytics and marketing cookies to help us improve it. 
        Optional cookies are currently <strong className="text-white">disabled</strong> by default.
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={dismissCookieConsent}
          className="flex-1 md:flex-none px-4 py-2 border border-[#27272a] rounded-lg text-sm text-white hover:bg-[#27272a] transition-colors"
        >
          Save Preferences
        </button>
        <button 
          onClick={() => {
            setPreferences({ essential: true, nonEssential: true });
            dismissCookieConsent();
          }}
          className="flex-1 md:flex-none px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
