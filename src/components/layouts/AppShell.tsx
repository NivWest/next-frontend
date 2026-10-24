'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: ReactNode;
}

const DRAWER_ID = 'app-navigation-drawer';

/**
 * Page chrome for every app route: the desktop sidebar (md and up), a top bar with a
 * navigation drawer below md, the scrolling `<main>` and the cookie banner.
 *
 * Layering: CookieBanner is z-40; the drawer is z-50 and full height so its bottom
 * items stay clickable above the banner. ToastContainer (z-50) is mounted elsewhere.
 */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? '';
  // The drawer remembers the pathname it was opened on and counts as closed once the
  // route changes, so navigation closes it without a setState inside an effect.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const isOpen = openedOn !== null && openedOn === pathname;

  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const open = () => setOpenedOn(pathname);
  const close = () => setOpenedOn(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedOn(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Move focus into the drawer when it opens and back to the trigger when it closes.
  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    } else if (wasOpen.current) {
      openButtonRef.current?.focus();
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-black overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <header className="md:hidden flex items-center justify-between gap-3 border-b border-[#27272a] px-4 py-3 bg-black">
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-black text-xs" aria-hidden="true">T</div>
          TradeEdu
        </div>
        <button
          ref={openButtonRef}
          type="button"
          onClick={open}
          aria-label="Open navigation"
          aria-expanded={isOpen}
          aria-controls={DRAWER_ID}
          className="text-white p-2 -mr-2 rounded-lg hover:bg-[#111111] transition-colors"
        >
          <Menu size={24} aria-hidden="true" />
        </button>
      </header>

      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            data-testid="navigation-backdrop"
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-black/70"
          />
          <div
            id={DRAWER_ID}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="absolute inset-y-0 left-0 flex max-w-[85vw] shadow-2xl"
          >
            <Sidebar onNavigate={close} />
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              aria-label="Close navigation"
              className="absolute top-4 right-3 p-2 rounded-lg text-zinc-400 hover:bg-[#111111] hover:text-white transition-colors"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide w-full relative">
        {children}
      </main>

      <CookieBanner />
    </div>
  );
}
