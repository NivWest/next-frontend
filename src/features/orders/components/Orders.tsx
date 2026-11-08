'use client';

import { Activity, ListOrdered } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { MAX_ORDER_NOTE_LENGTH, type OrderSide, type OrderStatus } from '@/features/trading/types';
import { instrumentHref, ROUTES } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';
import { cancelOrder, listOrders, updateOrderNote } from '../api/orders';
import { formatOrderMoney, formatOrderTime, formatQuantity, sideLabel, statusLabel, typeLabel } from '../format';
import type { Order } from '../types';

const PAGE_SIZE = 20;
const OPEN_POLL_MS = 3_000;

const HISTORY_COLUMNS = ['Instrument', 'Side', 'Qty', 'Price', 'Commission', 'Total', 'Status', 'Time'] as const;
const OPEN_COLUMNS = ['Instrument', 'Side', 'Type', 'Qty', 'Price', 'Status', 'Time', ''] as const;

type PageState<T> =
  | { attempt: number; ok: true; items: T }
  | { attempt: number; ok: false };

const SIDE_CLASSES: Record<OrderSide, string> = {
  BUY: 'text-green-500',
  SELL: 'text-red-500',
};

const STATUS_CLASSES: Record<OrderStatus, string> = {
  FILLED: 'text-white',
  OPEN: 'text-yellow-500',
  CANCELLED: 'text-[#a1a1aa]',
  REJECTED: 'text-red-500',
};

// CookieBanner and ToastContainer are fixed to the bottom of the viewport: the bottom padding
// lets the table and "Load more" scroll clear of them.
const WRAPPER_CLASS = 'max-w-5xl mx-auto p-4 md:p-6 pb-48 md:pb-48';

function HistoryRow({ order }: { order: Order }) {
  const noteInputId = useId();
  const [note, setNote] = useState(order.note ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(order.note ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSaveNote() {
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateOrderNote(order.id, draft.trim());
      setNote(updated.note ?? draft.trim());
      setIsEditing(false);
    } catch {
      setSaveError('Could not save note.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <tr id={`order-${order.id}`} className="hover:bg-[#111111] transition-colors">
      <td className="px-4 py-3">
        <Link href={instrumentHref(order.orderbook_id)} className="font-medium text-white hover:underline">
          {order.name}
        </Link>
        <span className="block text-xs text-[#71717a]">{order.symbol}</span>
        {!isEditing ? (
          <div className="mt-1">
            {note && <p className="text-xs text-[#a1a1aa] break-words">{note}</p>}
            <button
              type="button"
              onClick={() => {
                setDraft(note);
                setSaveError(null);
                setIsEditing(true);
              }}
              aria-label={note ? `Edit note for order ${order.id}` : `Add note for order ${order.id}`}
              className="mt-0.5 text-xs text-[#71717a] hover:text-white underline transition-colors"
            >
              {note ? 'Edit note' : 'Add note'}
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-1.5">
            <label htmlFor={noteInputId} className="sr-only">
              Note for order {order.id}
            </label>
            <input
              id={noteInputId}
              type="text"
              maxLength={MAX_ORDER_NOTE_LENGTH}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full bg-[#111111] border border-[#27272a] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#a1a1aa]"
            />
            {saveError && (
              <p role="alert" className="text-xs text-red-500">
                {saveError}
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveNote}
                disabled={saving}
                aria-busy={saving}
                className="px-2 py-0.5 rounded bg-green-500 text-black text-xs font-medium hover:bg-green-400 disabled:opacity-50"
              >
                Save note
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                }}
                disabled={saving}
                className="px-2 py-0.5 rounded border border-[#27272a] text-xs text-[#a1a1aa] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </td>
      <td className={`px-4 py-3 font-medium ${SIDE_CLASSES[order.side]}`}>{sideLabel(order.side)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums">{formatQuantity(order.quantity)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">{formatOrderMoney(order.fill_price)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">{formatOrderMoney(order.commission)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">{formatOrderMoney(order.total)}</td>
      <td className={`px-4 py-3 ${STATUS_CLASSES[order.status]}`}>{statusLabel(order.status)}</td>
      <td className="px-4 py-3 text-[#a1a1aa] whitespace-nowrap">
        <time dateTime={order.created_at}>{formatOrderTime(order.created_at)}</time>
      </td>
    </tr>
  );
}

function OpenRow({
  order,
  onCancel,
  isCancelling,
}: {
  order: Order;
  onCancel: (id: number) => void;
  isCancelling: boolean;
}) {
  const triggerPrice = order.limit_price ?? order.stop_price;
  return (
    <tr className="hover:bg-[#111111] transition-colors">
      <td className="px-4 py-3">
        <Link href={instrumentHref(order.orderbook_id)} className="font-medium text-white hover:underline">
          {order.name}
        </Link>
        <span className="block text-xs text-[#71717a]">{order.symbol}</span>
      </td>
      <td className={`px-4 py-3 font-medium ${SIDE_CLASSES[order.side]}`}>{sideLabel(order.side)}</td>
      <td className="px-4 py-3 text-white">{typeLabel(order.type)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums">{formatQuantity(order.quantity)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">
        {formatOrderMoney(triggerPrice)}
      </td>
      <td className={`px-4 py-3 ${STATUS_CLASSES[order.status]}`}>{statusLabel(order.status)}</td>
      <td className="px-4 py-3 text-[#a1a1aa] whitespace-nowrap">
        <time dateTime={order.created_at}>{formatOrderTime(order.created_at)}</time>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onCancel(order.id)}
          disabled={isCancelling}
          className="px-3 py-1 text-xs font-medium rounded border border-[#27272a] text-red-400 hover:text-red-300 hover:bg-[#1f1f23] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </td>
    </tr>
  );
}

/** Orders page at `/orders`: Open and History tabs, 3 s polling for Open, cancel action. */
export function Orders() {
  const { addToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('history');

  // History state
  const [attempt, setAttempt] = useState(0);
  const [historyPage, setHistoryPage] = useState<PageState<Order[]> | null>(null);
  const [moreItems, setMoreItems] = useState<Order[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);

  // Open state
  const [openAttempt, setOpenAttempt] = useState(0);
  const [openState, setOpenState] = useState<PageState<Order[]> | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load History
  useEffect(() => {
    let active = true;
    listOrders({ limit: PAGE_SIZE })
      .then((page) => {
        if (!active) return;
        setHistoryPage({ attempt, ok: true, items: page.items });
        setMoreItems([]);
        setNextCursor(page.next_cursor);
      })
      .catch((e: unknown) => {
        console.error(e);
        if (active) setHistoryPage({ attempt, ok: false });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  // Load & Poll Open orders (every 3 s while Open tab is visible)
  useEffect(() => {
    if (activeTab !== 'open') return;
    let active = true;

    const loadOpen = () => {
      listOrders({ limit: PAGE_SIZE, status: ['OPEN'] })
        .then((page) => {
          if (!active) return;
          setOpenState({ attempt: openAttempt, ok: true, items: page.items });
        })
        .catch((e: unknown) => {
          console.error(e);
          if (active) setOpenState({ attempt: openAttempt, ok: false });
        });
    };

    loadOpen();
    const timer = setInterval(loadOpen, OPEN_POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activeTab, openAttempt]);

  function retryHistory() {
    setAttempt((a) => a + 1);
  }

  function retryOpen() {
    setOpenAttempt((a) => a + 1);
  }

  function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreFailed(false);
    listOrders({ limit: PAGE_SIZE, cursor: nextCursor })
      .then((page) => {
        if (!isMounted.current) return;
        setMoreItems((items) => [...items, ...page.items]);
        setNextCursor(page.next_cursor);
      })
      .catch((e: unknown) => {
        console.error(e);
        if (isMounted.current) setLoadMoreFailed(true);
      })
      .finally(() => {
        if (isMounted.current) setLoadingMore(false);
      });
  }

  const handleCancel = async (id: number) => {
    setCancellingId(id);
    try {
      await cancelOrder(id);
      addToast('Order cancelled', 'success');
      // Remove from open list immediately
      setOpenState((prev) =>
        prev && prev.ok ? { ...prev, items: prev.items.filter((o) => o.id !== id) } : prev,
      );
      // Trigger history reload and switch to history
      setAttempt((a) => a + 1);
      setActiveTab('history');
    } catch (e: unknown) {
      console.error(e);
      addToast('Could not cancel order', 'error');
    } finally {
      if (isMounted.current) setCancellingId(null);
    }
  };

  const header = (
    <div className="flex items-center gap-3 mb-6">
      <ListOrdered className="text-white" aria-hidden="true" />
      <h1 className="text-2xl font-bold text-white">Orders</h1>
    </div>
  );

  const tabs = (
    <div role="tablist" aria-label="Orders view" className="flex gap-2 mb-6">
      <button
        type="button"
        role="tab"
        id="orders-tab-open"
        aria-selected={activeTab === 'open'}
        aria-controls="orders-panel-open"
        onClick={() => setActiveTab('open')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'open' ? 'bg-white text-black' : 'bg-[#111111] text-[#a1a1aa] hover:text-white'
        }`}
      >
        Open
      </button>
      <button
        type="button"
        role="tab"
        id="orders-tab-history"
        aria-selected={activeTab === 'history'}
        aria-controls="orders-panel-history"
        onClick={() => setActiveTab('history')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          activeTab === 'history' ? 'bg-white text-black' : 'bg-[#111111] text-[#a1a1aa] hover:text-white'
        }`}
      >
        History
      </button>
    </div>
  );

  // Render Open Tab Content
  if (activeTab === 'open') {
    const currentOpen = openState?.attempt === openAttempt ? openState : null;

    if (!currentOpen) {
      return (
        <div className={WRAPPER_CLASS}>
          {header}
          {tabs}
          <div className="text-[#a1a1aa] flex flex-col items-center py-16" role="status">
            <Activity className="w-8 h-8 animate-spin mb-4" aria-hidden="true" />
            <p>Loading open orders…</p>
          </div>
        </div>
      );
    }

    if (!currentOpen.ok) {
      return (
        <div className={WRAPPER_CLASS}>
          {header}
          {tabs}
          <div
            role="alert"
            className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 flex flex-col items-start gap-4"
          >
            <p className="text-white">Could not load open orders.</p>
            <button
              type="button"
              onClick={retryOpen}
              className="px-4 py-2 rounded-lg border border-[#27272a] text-white hover:bg-[#111111] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    const openOrders = currentOpen.items;

    if (openOrders.length === 0) {
      return (
        <div className={WRAPPER_CLASS}>
          {header}
          {tabs}
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-10 flex flex-col items-center text-center gap-4">
            <p className="text-white text-lg font-medium">No open orders</p>
            <Link
              href={ROUTES.markets}
              className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
            >
              Browse markets
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className={WRAPPER_CLASS}>
        {header}
        {tabs}

        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-x-auto">
          <table aria-label="Open orders" className="w-full text-sm text-left">
            <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
              <tr>
                {OPEN_COLUMNS.map((column, idx) => (
                  <th
                    key={column || idx}
                    scope="col"
                    className={`px-4 py-3 font-medium ${
                      column === 'Qty' || column === 'Price' ? 'text-right' : ''
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272a]">
              {openOrders.map((order) => (
                <OpenRow
                  key={order.id}
                  order={order}
                  onCancel={handleCancel}
                  isCancelling={cancellingId === order.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render History Tab Content
  const currentHistory = historyPage?.attempt === attempt ? historyPage : null;

  if (!currentHistory) {
    return (
      <div className={WRAPPER_CLASS}>
        {header}
        {tabs}
        <div className="text-[#a1a1aa] flex flex-col items-center py-16" role="status">
          <Activity className="w-8 h-8 animate-spin mb-4" aria-hidden="true" />
          <p>Loading orders…</p>
        </div>
      </div>
    );
  }

  if (!currentHistory.ok) {
    return (
      <div className={WRAPPER_CLASS}>
        {header}
        {tabs}
        <div
          role="alert"
          className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 flex flex-col items-start gap-4"
        >
          <p className="text-white">Could not load your orders.</p>
          <button
            type="button"
            onClick={retryHistory}
            className="px-4 py-2 rounded-lg border border-[#27272a] text-white hover:bg-[#111111] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const orders = [...currentHistory.items, ...moreItems];

  if (orders.length === 0) {
    return (
      <div className={WRAPPER_CLASS}>
        {header}
        {tabs}
        <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-10 flex flex-col items-center text-center gap-4">
          <p className="text-white text-lg font-medium">No orders yet</p>
          <Link
            href={ROUTES.markets}
            className="px-4 py-2 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 transition-colors"
          >
            Browse markets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={WRAPPER_CLASS}>
      {header}
      {tabs}

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-x-auto">
        <table aria-label="Order history" className="w-full text-sm text-left">
          <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
            <tr>
              {HISTORY_COLUMNS.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-4 py-3 font-medium ${
                    column === 'Qty' || column === 'Price' || column === 'Commission' || column === 'Total'
                      ? 'text-right'
                      : ''
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {orders.map((order) => (
              <HistoryRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>

      {(nextCursor || loadMoreFailed) && (
        <div className="mt-4 flex flex-col items-start gap-2">
          {loadMoreFailed && (
            <p role="alert" className="text-sm text-red-500">
              Could not load more orders. Try again.
            </p>
          )}
          {nextCursor && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              aria-busy={loadingMore}
              className="px-4 py-2 rounded-lg border border-[#27272a] text-white hover:bg-[#111111] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Load more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
