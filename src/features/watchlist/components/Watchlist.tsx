'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { MoreHorizontal, Plus, Star, Trash2 } from 'lucide-react';
import { FlashValue } from '@/features/markets/components/FlashValue';
import { LiveIndicator } from '@/features/markets/components/LiveIndicator';
import { useLiveQuotes } from '@/features/markets/hooks/useLiveQuotes';
import type { LiveQuote } from '@/features/markets/store/useLiveQuoteStore';
import { formatMoney, formatPercent } from '@/lib/format';
import { ROUTES, instrumentHref } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';
import { useWatchlistStore } from '../store/useWatchlistStore';
import type { Watchlist as WatchlistModel, WatchlistItem } from '../types';
import { watchlistErrorMessage } from '../watchlist';
import { handleMenuKeyDown, useDismiss } from './useDismiss';
import { WatchlistNameForm } from './WatchlistNameForm';

const MISSING = '—';

function changeClass(value: number | null): string {
  if (value === null || value === 0) return 'text-[#a1a1aa]';
  return value > 0 ? 'text-green-500' : 'text-red-500';
}

/**
 * `/watchlist` (story NW-06): one tab per list, the selected list's instruments with live price and day change,
 * a "Remove <name>" button per row, rename/delete through the "List actions" menu, and "No watchlists yet"
 * when the user has none. The page sits behind AuthGuard, so the user is signed in.
 */
export function Watchlist() {
  const { watchlists, status, fetchWatchlists, createWatchlist } = useWatchlistStore();
  const { addToast } = useUIStore();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const tabsId = useId();

  useEffect(() => {
    void fetchWatchlists();
  }, [fetchWatchlists]);

  // The selected list, falling back to the first one (e.g. after the selected list was deleted).
  const selected = watchlists.find((list) => list.id === selectedId) ?? watchlists[0] ?? null;
  // Live prices for the rows on screen (story NW-09).
  const { quotes: liveQuotes, status: streamStatus } = useLiveQuotes(
    selected ? selected.items.map((item) => item.orderbook_id) : [],
  );

  const handleCreate = async (name: string): Promise<void> => {
    try {
      const list = await createWatchlist(name);
      setSelectedId(list.id);
      setCreating(false);
      addToast(`Created ${list.name}`, 'success');
    } catch (e) {
      throw new Error(watchlistErrorMessage(e));
    }
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!selected || (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft')) return;
    event.preventDefault();
    const index = watchlists.findIndex((list) => list.id === selected.id);
    const step = event.key === 'ArrowRight' ? 1 : -1;
    const next = watchlists[(index + step + watchlists.length) % watchlists.length];
    setSelectedId(next.id);
    document.getElementById(`${tabsId}-tab-${next.id}`)?.focus();
  };

  const initialLoad = watchlists.length === 0 && (status === 'idle' || status === 'loading');

  return (
    // The cookie banner is fixed to the bottom: the padding lets the last rows scroll above it.
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-64 md:pb-64">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Star className="text-yellow-500" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        <LiveIndicator status={streamStatus} />
        {watchlists.length > 0 && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-[#27272a] px-3 py-2 text-sm text-white hover:bg-[#111111]"
          >
            <Plus size={16} aria-hidden="true" />
            New list
          </button>
        )}
      </div>

      {creating && (
        <div role="group" aria-label="New watchlist" className="mb-6 max-w-sm rounded-xl border border-[#27272a] bg-[#0a0a0a] p-4">
          <WatchlistNameForm submitLabel="Create list" onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {initialLoad ? (
        <p role="status" className="text-[#a1a1aa]">
          Loading watchlists…
        </p>
      ) : status === 'error' && watchlists.length === 0 ? (
        <div role="alert" className="rounded-xl border border-[#27272a] bg-[#0a0a0a] p-6 text-sm text-red-500">
          Could not load your watchlists.{' '}
          <button type="button" onClick={() => void fetchWatchlists()} className="underline">
            Try again
          </button>
        </div>
      ) : selected === null ? (
        <div className="rounded-xl border border-[#27272a] bg-[#0a0a0a] p-12 text-center">
          <h2 className="text-lg font-semibold text-white mb-2">No watchlists yet</h2>
          <p className="text-sm text-[#a1a1aa] mb-6">
            Create a list, then add instruments to it from their page in{' '}
            <Link href={ROUTES.markets} className="text-green-500 hover:underline">
              Markets
            </Link>
            .
          </p>
          {!creating && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-black hover:bg-green-400"
            >
              <Plus size={16} aria-hidden="true" />
              Create a list
            </button>
          )}
        </div>
      ) : (
        <>
          <div role="tablist" aria-label="Watchlists" onKeyDown={onTabKeyDown} className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
            {watchlists.map((list) => {
              const isSelected = list.id === selected.id;
              return (
                <button
                  key={list.id}
                  id={`${tabsId}-tab-${list.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setSelectedId(list.id)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isSelected ? 'bg-white text-black' : 'bg-[#111111] text-[#a1a1aa] hover:text-white'
                  }`}
                >
                  {list.name}
                </button>
              );
            })}
          </div>

          <div id={`${tabsId}-panel`} role="tabpanel" aria-labelledby={`${tabsId}-tab-${selected.id}`}>
            <WatchlistPanel key={selected.id} list={selected} liveQuotes={liveQuotes} />
          </div>
        </>
      )}
    </div>
  );
}

interface WatchlistPanelProps {
  list: WatchlistModel;
  /** Streamed quotes by orderbook_id; a row shows its live price and day change once one arrived. */
  liveQuotes: Readonly<Record<string, LiveQuote>>;
}

/** The row's price and day change: the streamed quote when there is one, else the list's own snapshot. */
function rowPrices(item: WatchlistItem, live: LiveQuote | undefined): { price: number | null; change: number | null } {
  if (live) return { price: live.quote.last, change: live.quote.change_percent };
  return { price: item.last_price, change: item.change_percent };
}

type PanelMode = 'view' | 'rename' | 'confirm-delete';

/** The selected list: its actions menu, rename form or delete confirmation, and the items table. */
function WatchlistPanel({ list, liveQuotes }: WatchlistPanelProps) {
  const { renameWatchlist, deleteWatchlist, removeItem } = useWatchlistStore();
  const { addToast } = useUIStore();
  const [mode, setMode] = useState<PanelMode>('view');
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const menuRootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const closeMenu = useCallback((): void => {
    setMenuOpen(false);
    triggerRef.current?.focus();
  }, []);
  useDismiss(menuRootRef, menuOpen, closeMenu);

  useEffect(() => {
    if (menuOpen) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [menuOpen]);

  const handleRename = async (name: string): Promise<void> => {
    try {
      await renameWatchlist(list.id, name);
      setMode('view');
    } catch (e) {
      throw new Error(watchlistErrorMessage(e));
    }
  };

  const handleDelete = async (): Promise<void> => {
    setDeleting(true);
    try {
      await deleteWatchlist(list.id);
      addToast(`Deleted ${list.name}`, 'success');
    } catch (e) {
      addToast(watchlistErrorMessage(e), 'error');
      setDeleting(false);
    }
  };

  const handleRemove = async (item: WatchlistItem): Promise<void> => {
    setRemoving(item.orderbook_id);
    try {
      await removeItem(list.id, item.orderbook_id);
      addToast(`Removed ${item.symbol || item.name} from ${list.name}`, 'success');
    } catch (e) {
      addToast(watchlistErrorMessage(e), 'error');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#27272a] px-4 py-3 md:px-6">
        <h2 className="truncate text-base font-semibold text-white">{list.name}</h2>
        <div ref={menuRootRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            aria-label="List actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? menuId : undefined}
            onClick={() => (menuOpen ? closeMenu() : setMenuOpen(true))}
            className="rounded-lg p-2 text-[#a1a1aa] hover:bg-[#111111] hover:text-white"
          >
            <MoreHorizontal size={18} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div
              id={menuId}
              ref={menuRef}
              role="menu"
              aria-label="List actions"
              onKeyDown={handleMenuKeyDown}
              className="absolute right-0 z-[45] mt-2 w-44 rounded-xl border border-[#27272a] bg-[#111111] p-1 shadow-2xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setMode('rename');
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-white hover:bg-[#27272a] focus:bg-[#27272a] focus:outline-none"
              >
                Rename list
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setMode('confirm-delete');
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-[#27272a] focus:bg-[#27272a] focus:outline-none"
              >
                Delete list
              </button>
            </div>
          )}
        </div>
      </div>

      {mode === 'rename' && (
        <div role="group" aria-label="Rename watchlist" className="border-b border-[#27272a] p-4 md:px-6 max-w-sm">
          <WatchlistNameForm submitLabel="Save name" initialName={list.name} onSubmit={handleRename} onCancel={() => setMode('view')} />
        </div>
      )}

      {mode === 'confirm-delete' && (
        <div role="alertdialog" aria-label={`Delete ${list.name}?`} className="border-b border-[#27272a] p-4 md:px-6">
          <p className="mb-3 text-sm text-white">
            Delete <strong>{list.name}</strong> and its {list.items.length === 1 ? '1 instrument' : `${list.items.length} instruments`}?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-busy={deleting}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-black hover:bg-red-400 disabled:opacity-60"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className="rounded-lg border border-[#27272a] px-3 py-2 text-sm text-white hover:bg-[#27272a]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {list.items.length === 0 ? (
        <div className="p-12 text-center text-sm text-[#a1a1aa]">
          <p>
            This list is empty. Open an instrument in{' '}
            <Link href={ROUTES.markets} className="text-green-500 hover:underline">
              Markets
            </Link>{' '}
            and use &quot;Add to watchlist&quot;.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
              <tr>
                <th scope="col" className="px-4 md:px-6 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 md:px-6 py-3 font-medium text-right">Price</th>
                <th scope="col" className="px-4 md:px-6 py-3 font-medium text-right">Day change</th>
                <th scope="col" className="px-4 md:px-6 py-3 font-medium text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {list.items.map((item) => {
                const live = liveQuotes[item.orderbook_id];
                const { price, change } = rowPrices(item, live);
                return (
                  <tr key={item.orderbook_id} className="hover:bg-[#111111] transition-colors">
                    <td className="px-4 md:px-6 py-3">
                      <Link href={instrumentHref(item.orderbook_id)} className="font-medium text-white hover:underline">
                        {item.name}
                      </Link>
                      <span className="block text-xs text-[#71717a]">{item.symbol || item.orderbook_id}</span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right text-white whitespace-nowrap tabular-nums">
                      <FlashValue live={live}>{price === null ? MISSING : formatMoney(price)}</FlashValue>
                    </td>
                    <td className={`px-4 md:px-6 py-3 text-right whitespace-nowrap tabular-nums ${changeClass(change)}`}>
                      {change === null ? MISSING : formatPercent(change)}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        disabled={removing === item.orderbook_id}
                        aria-busy={removing === item.orderbook_id}
                        onClick={() => void handleRemove(item)}
                        className="rounded-lg p-2 text-red-500 opacity-80 hover:bg-[#27272a] hover:opacity-100 disabled:opacity-40"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
