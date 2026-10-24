'use client';

import { useUIStore } from '@/store/useUIStore';
import { useState } from 'react';

/**
 * Cookie consent banner.
 *
 * Below `md` (sidebar hidden) it spans the full width of the viewport bottom.
 * From `md` up it is a compact card anchored bottom-right, capped at `max-w-md`
 * (448px) so its left edge never reaches the 256px desktop sidebar:
 * at 768px the card starts at 768 - 24 - 448 = 296px.
 */
export function CookieBanner() {
  const { cookieConsentDismissed, dismissCookieConsent } = useUIStore();
  const [, setPreferences] = useState({ essential: true, nonEssential: false });

  if (cookieConsentDismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookie preferences"
      className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-4 border-t border-[#27272a] bg-[#111111] p-4 md:bottom-6 md:left-auto md:right-6 md:w-full md:max-w-md md:rounded-xl md:border md:p-5 md:shadow-2xl"
    >
      <div className="text-sm text-[#a1a1aa]">
        <strong className="text-white block mb-1">Cookie Preferences</strong>
        We use essential cookies to make our site work. We&apos;d also like to set optional analytics and marketing cookies to help us improve it.
        Optional cookies are currently <strong className="text-white">disabled</strong> by default.
      </div>
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={dismissCookieConsent}
          className="flex-1 px-4 py-2 border border-[#27272a] rounded-lg text-sm text-white hover:bg-[#27272a] transition-colors"
        >
          Save Preferences
        </button>
        <button
          type="button"
          onClick={() => {
            setPreferences({ essential: true, nonEssential: true });
            dismissCookieConsent();
          }}
          className="flex-1 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
