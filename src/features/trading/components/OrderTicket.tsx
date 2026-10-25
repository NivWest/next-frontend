'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { getQuote } from '@/features/markets/api/market';
import type { Quote } from '@/features/markets/types';
import { ApiRequestError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { instrumentHref, loginHref } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';
import { newIdempotencyKey, placeOrder } from '../api/orders';
import { previewOrder } from '../preview';
import type { OrderErrorCode, OrderSide } from '../types';

interface OrderTicketProps {
  orderbookId: string;
}

/** How often the ticket refreshes its live quote. */
const QUOTE_REFRESH_MS = 5_000;

const MISSING = '—';

const SIDES: ReadonlyArray<{ value: OrderSide; label: string }> = [
  { value: 'BUY', label: 'Buy' },
  { value: 'SELL', label: 'Sell' },
];

const ORDER_ERROR_MESSAGES: ReadonlyMap<string, string> = new Map<OrderErrorCode, string>([
  ['INSUFFICIENT_FUNDS', 'Not enough cash for this order.'],
  ['INSUFFICIENT_SHARES', "You don't own enough shares to sell."],
  ['VALIDATION_ERROR', 'Enter a whole number of shares greater than 0.'],
  ['INSTRUMENT_NOT_FOUND', "This instrument can't be traded."],
  ['MARKET_DATA_UNAVAILABLE', 'Prices are unavailable right now. Please try again shortly.'],
  ['CONFLICT', 'This order was already submitted.'],
]);

const GENERIC_ORDER_ERROR = 'The order could not be placed. Please try again.';

/** Latest quote fetch, tagged with the id it belongs to so a new id reads as "not loaded" without a sync setState. */
interface QuoteState {
  id: string;
  quote: Quote | null;
  failed: boolean;
}

function orderErrorMessage(error: unknown): string {
  const code = error instanceof ApiRequestError ? error.code : null;
  return (code !== null && ORDER_ERROR_MESSAGES.get(code)) || GENERIC_ORDER_ERROR;
}

/** A whole share count > 0, or null for empty, fractional or non-positive input. */
function parseQuantity(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function sideButtonClass(side: OrderSide, active: boolean): string {
  const base = 'flex-1 py-2 text-sm font-medium rounded-md transition-colors';
  if (!active) return `${base} text-[#a1a1aa] hover:text-white`;
  return side === 'BUY' ? `${base} bg-green-500 text-black` : `${base} bg-red-500 text-white`;
}

/** Market order ticket for one instrument: side, whole-share quantity, live price preview and submit. */
export function OrderTicket({ orderbookId }: OrderTicketProps) {
  const headingId = useId();
  const quantityId = useId();
  const { user, isAuthenticated, addToast, checkAuth } = useUIStore();

  const [side, setSide] = useState<OrderSide>('BUY');
  const [quantityText, setQuantityText] = useState('');
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      getQuote(orderbookId)
        .then((quote) => {
          if (active) setQuoteState({ id: orderbookId, quote, failed: false });
        })
        .catch(() => {
          // Keep showing the last good quote of this instrument; the next tick retries.
          if (active) {
            setQuoteState((prev) => ({
              id: orderbookId,
              quote: prev?.id === orderbookId ? prev.quote : null,
              failed: true,
            }));
          }
        });
    };
    load();
    const timer = setInterval(load, QUOTE_REFRESH_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderbookId]);

  const current = quoteState?.id === orderbookId ? quoteState : null;
  const quote = current?.quote ?? null;
  const quantity = parseQuantity(quantityText);
  const preview =
    quote && quantity !== null ? previewOrder({ side, quantity, bid: quote.bid, ask: quote.ask }) : null;
  const symbol = quote?.symbol || orderbookId;
  const sideLabel = side === 'BUY' ? 'Buy' : 'Sell';

  const handleSide = (next: OrderSide) => {
    setSide(next);
    setError(null);
  };

  const handleQuantity = (event: ChangeEvent<HTMLInputElement>) => {
    setQuantityText(event.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    if (preview === null || quantity === null || isSubmitting) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const order = await placeOrder({ orderbook_id: orderbookId, side, quantity }, newIdempotencyKey());
      const verb = order.side === 'SELL' ? 'Sold' : 'Bought';
      addToast(`${verb} ${order.quantity} ${order.symbol} @ ${order.fill_price.toFixed(2)}`, 'success');
      await checkAuth();
    } catch (e: unknown) {
      const message = orderErrorMessage(e);
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const rows: ReadonlyArray<{ label: string; value: string; emphasis?: boolean }> = [
    { label: 'Price', value: preview ? formatMoney(preview.price) : MISSING },
    { label: 'Commission', value: preview ? formatMoney(preview.commission) : MISSING },
    { label: 'Total', value: preview ? formatMoney(preview.total) : MISSING, emphasis: true },
  ];

  const submitClass =
    side === 'BUY'
      ? 'bg-green-500 hover:bg-green-400 text-black'
      : 'bg-red-500 hover:bg-red-400 text-white';

  return (
    <section aria-labelledby={headingId} className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 md:p-6">
      <h2 id={headingId} className="text-lg font-semibold text-white mb-4">
        Order ticket
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div
            role="group"
            aria-label="Order side"
            className="flex gap-1 p-1 bg-[#111111] border border-[#27272a] rounded-lg"
          >
            {SIDES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={side === value}
                onClick={() => handleSide(value)}
                className={sideButtonClass(value, side === value)}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label htmlFor={quantityId} className="block text-sm text-[#a1a1aa] mb-1">
              Quantity
            </label>
            <input
              id={quantityId}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              placeholder="0"
              value={quantityText}
              onChange={handleQuantity}
              className="w-full bg-[#111111] border border-[#27272a] rounded-lg px-3 py-2 text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#a1a1aa]"
            />
          </div>

          {current?.failed && !quote && (
            <p role="status" className="text-xs text-[#71717a]">
              Live prices are unavailable right now.
            </p>
          )}
        </div>

        <dl className="space-y-2 text-sm">
          {rows.map(({ label, value, emphasis }) => (
            <div
              key={label}
              className={`flex justify-between gap-4 ${emphasis ? 'pt-2 border-t border-[#27272a]' : ''}`}
            >
              <dt className="text-[#a1a1aa]">{label}</dt>
              <dd className={emphasis ? 'font-semibold text-white' : 'text-white'}>{value}</dd>
            </div>
          ))}
          {isAuthenticated && user && (
            <div className="flex justify-between gap-4">
              <dt className="text-[#a1a1aa]">Cash available</dt>
              <dd className="text-white">{formatMoney(user.balance)}</dd>
            </div>
          )}
        </dl>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="mt-6">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={preview === null || isSubmitting}
            aria-busy={isSubmitting}
            className={`w-full font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${submitClass}`}
          >
            {sideLabel} {symbol}
          </button>
        ) : (
          <Link
            href={loginHref(instrumentHref(orderbookId))}
            className="block w-full text-center bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Sign in to trade
          </Link>
        )}
      </div>
    </section>
  );
}
