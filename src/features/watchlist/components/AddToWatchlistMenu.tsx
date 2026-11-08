'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Star } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { instrumentHref, loginHref } from '@/lib/routes';
import { useWatchlistStore } from '../store/useWatchlistStore';
import type { Watchlist } from '../types';
import { isDuplicateItemError, watchlistErrorMessage } from '../watchlist';
import { handleMenuKeyDown, useDismiss } from './useDismiss';
import { WatchlistNameForm } from './WatchlistNameForm';

export interface AddToWatchlistMenuProps {
  orderbookId: string;
  /** Shown in the toast, e.g. "Added NVE to Energy". */
  symbol: string;
}

/** Visible label of the menu entry that creates a list; "…" is U+2026. */
export const NEW_LIST_LABEL = 'New list…';

type Mode = 'closed' | 'menu' | 'create';

/**
 * "Add to watchlist" on the instrument page (story NW-06): a menu of the user's lists plus "New list…", which
 * swaps the menu for a "List name" form that creates the list and adds the instrument in one go.
 *
 * Layering: the popover drops down from the page header and is z-[45], above the fixed CookieBanner (z-40) and
 * below the ToastContainer and the mobile drawer (z-50), so the banner never covers it.
 */
export function AddToWatchlistMenu({ orderbookId, symbol }: AddToWatchlistMenuProps) {
  const { isAuthenticated, addToast } = useUIStore();
  const { watchlists, status, fetchWatchlists, createWatchlist, addItem } = useWatchlistStore();
  const [mode, setMode] = useState<Mode>('closed');
  const [pendingId, setPendingId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback((): void => {
    setMode('closed');
    triggerRef.current?.focus();
  }, []);
  useDismiss(rootRef, mode !== 'closed', close);

  // Focus the first entry once the menu is shown (the create form focuses its own input).
  useEffect(() => {
    if (mode === 'menu') menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [mode, watchlists.length, status]);

  if (!isAuthenticated) {
    return (
      <Link
        href={loginHref(instrumentHref(orderbookId))}
        className="inline-flex items-center gap-2 rounded-lg border border-[#27272a] px-3 py-2 text-sm font-medium text-white hover:bg-[#111111]"
      >
        <Star size={16} aria-hidden="true" />
        Sign in to add to watchlist
      </Link>
    );
  }

  const open = (): void => {
    setMode('menu');
    void fetchWatchlists();
  };

  const addTo = async (watchlistId: number, listName: string): Promise<void> => {
    setPendingId(watchlistId);
    try {
      await addItem(watchlistId, orderbookId);
      addToast(`Added ${symbol} to ${listName}`, 'success');
      close();
    } catch (e) {
      if (isDuplicateItemError(e)) {
        addToast(`${symbol} is already in ${listName}`, 'info');
        close();
      } else {
        addToast(watchlistErrorMessage(e), 'error');
      }
    } finally {
      setPendingId(null);
    }
  };

  const createAndAdd = async (name: string): Promise<void> => {
    let list: Watchlist;
    try {
      list = await createWatchlist(name);
    } catch (e) {
      throw new Error(watchlistErrorMessage(e));
    }
    try {
      await addItem(list.id, orderbookId);
      addToast(`Added ${symbol} to ${list.name}`, 'success');
      close();
    } catch (e) {
      addToast(watchlistErrorMessage(e), 'error');
      close();
    }
  };

  const loadingLists = watchlists.length === 0 && (status === 'idle' || status === 'loading');

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (mode === 'closed' ? open() : close())}
        aria-haspopup="menu"
        aria-expanded={mode !== 'closed'}
        aria-controls={mode === 'closed' ? undefined : menuId}
        className="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        <Star size={16} aria-hidden="true" />
        Add to watchlist
        <ChevronDown size={14} aria-hidden="true" />
      </button>

      {mode !== 'closed' && (
        <div
          id={menuId}
          className="absolute right-0 z-[45] mt-2 max-h-[60vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-[#27272a] bg-[#111111] p-2 shadow-2xl"
        >
          {mode === 'menu' ? (
            <div ref={menuRef} role="menu" aria-label="Add to watchlist" onKeyDown={handleMenuKeyDown}>
              {loadingLists && (
                <p role="status" className="px-3 py-2 text-sm text-[#a1a1aa]">
                  Loading lists…
                </p>
              )}
              {watchlists.map((list) => {
                const added = list.items.some((item) => item.orderbook_id === orderbookId);
                return (
                  <button
                    key={list.id}
                    type="button"
                    role="menuitem"
                    disabled={pendingId !== null}
                    aria-busy={pendingId === list.id}
                    onClick={() => void addTo(list.id, list.name)}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-[#27272a] focus:bg-[#27272a] focus:outline-none disabled:opacity-60"
                  >
                    <span className="truncate">{list.name}</span>
                    {added && (
                      <span className="flex items-center gap-1 text-xs text-green-500">
                        <Check size={14} aria-hidden="true" />
                        <span className="sr-only">(added)</span>
                      </span>
                    )}
                  </button>
                );
              })}
              {watchlists.length > 0 && <div role="separator" className="my-1 border-t border-[#27272a]" />}
              <button
                type="button"
                role="menuitem"
                disabled={pendingId !== null}
                onClick={() => setMode('create')}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-[#27272a] focus:bg-[#27272a] focus:outline-none disabled:opacity-60"
              >
                <Plus size={14} aria-hidden="true" />
                {NEW_LIST_LABEL}
              </button>
            </div>
          ) : (
            <div role="group" aria-label="New watchlist" className="p-1">
              <WatchlistNameForm submitLabel="Create and add" onSubmit={createAndAdd} onCancel={() => setMode('menu')} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
