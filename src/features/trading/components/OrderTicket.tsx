'use client';

import Link from 'next/link';
import { useEffect, useId, useState, type ChangeEvent } from 'react';
import { getQuote } from '@/features/markets/api/market';
import { pickQuote, useLiveQuote } from '@/features/markets/hooks/useLiveQuotes';
import type { Quote } from '@/features/markets/types';
import { ApiRequestError } from '@/lib/api';
import { formatMoney, formatQuantity } from '@/lib/format';
import { instrumentHref, loginHref } from '@/lib/routes';
import { useUIStore } from '@/store/useUIStore';
import { newIdempotencyKey, placeOrder } from '../api/orders';
import { previewOrder, previewReservation } from '../preview';
import type { OrderErrorCode, OrderSide, OrderType } from '../types';

interface OrderTicketProps {
  orderbookId: string;
}

/** How often the ticket polls its quote while the live stream (story NW-09) is not delivering. */
const QUOTE_REFRESH_MS = 5_000;

const MISSING = '—';

const ORDER_TYPES: ReadonlyArray<{ value: OrderType; label: string }> = [
  { value: 'MARKET', label: 'Market' },
  { value: 'LIMIT', label: 'Limit' },
  { value: 'STOP', label: 'Stop' },
];

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
  ['ORDER_NOT_FOUND', 'Order not found.'],
  ['ORDER_NOT_OPEN', 'This order is no longer open.'],
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

/** A price > 0 with at most 2 decimals, or null. */
function parsePrice(text: string): number | null {
  if (text.trim() === '') return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) return null;
  const parts = text.trim().split('.');
  if (parts.length > 1 && parts[1].length > 2) return null;
  return value;
}

function sideButtonClass(side: OrderSide, active: boolean): string {
  const base = 'flex-1 py-2 text-sm font-medium rounded-md transition-colors';
  if (!active) return `${base} text-[#a1a1aa] hover:text-white`;
  return side === 'BUY' ? `${base} bg-green-500 text-black` : `${base} bg-red-500 text-white`;
}

/** Order ticket for one instrument: order type tabs (Market, Limit, Stop), side, inputs, preview and submit. */
export function OrderTicket({ orderbookId }: OrderTicketProps) {
  const headingId = useId();
  const quantityId = useId();
  const limitPriceId = useId();
  const stopPriceId = useId();
  const { user, isAuthenticated, addToast, checkAuth } = useUIStore();

  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [side, setSide] = useState<OrderSide>('BUY');
  const [quantityText, setQuantityText] = useState('');
  const [limitPriceText, setLimitPriceText] = useState('');
  const [stopPriceText, setStopPriceText] = useState('');
  const [quoteState, setQuoteState] = useState<QuoteState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { live, status: streamStatus } = useLiveQuote(orderbookId);
  const streaming = streamStatus === 'live';

  // One quote on mount, then polling only while the stream is down; once it is live, it pushes every change.
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
    const timer = streaming ? null : setInterval(load, QUOTE_REFRESH_MS);
    return () => {
      active = false;
      if (timer !== null) clearInterval(timer);
    };
  }, [orderbookId, streaming]);

  const current = quoteState?.id === orderbookId ? quoteState : null;
  const quote = pickQuote(live, streamStatus, current?.quote ?? null);
  const quantity = parseQuantity(quantityText);
  const limitPrice = parsePrice(limitPriceText);
  const stopPrice = parsePrice(stopPriceText);

  const preview =
    quote && quantity !== null ? previewOrder({ side, quantity, bid: quote.bid, ask: quote.ask }) : null;

  const reservation =
    quantity !== null
      ? previewReservation({ side, type: orderType, quantity, limitPrice, stopPrice })
      : null;

  const symbol = quote?.symbol || orderbookId;
  const sideLabel = side === 'BUY' ? 'Buy' : 'Sell';

  const handleType = (next: OrderType) => {
    setOrderType(next);
    setError(null);
  };

  const handleSide = (next: OrderSide) => {
    setSide(next);
    setError(null);
  };

  const handleQuantity = (event: ChangeEvent<HTMLInputElement>) => {
    setQuantityText(event.target.value);
    setError(null);
  };

  const handleLimitPrice = (event: ChangeEvent<HTMLInputElement>) => {
    setLimitPriceText(event.target.value);
    setError(null);
  };

  const handleStopPrice = (event: ChangeEvent<HTMLInputElement>) => {
    setStopPriceText(event.target.value);
    setError(null);
  };

  const canSubmit =
    !isSubmitting &&
    quantity !== null &&
    (orderType === 'MARKET'
      ? preview !== null
      : orderType === 'LIMIT'
        ? reservation !== null && limitPrice !== null
        : reservation !== null && stopPrice !== null);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      if (orderType === 'LIMIT') {
        await placeOrder(
          { orderbook_id: orderbookId, side, type: 'LIMIT', quantity, limit_price: limitPrice! },
          newIdempotencyKey(),
        );
        addToast('Limit order placed', 'success');
      } else if (orderType === 'STOP') {
        await placeOrder(
          { orderbook_id: orderbookId, side, type: 'STOP', quantity, stop_price: stopPrice! },
          newIdempotencyKey(),
        );
        addToast('Stop order placed', 'success');
      } else {
        const order = await placeOrder({ orderbook_id: orderbookId, side, quantity }, newIdempotencyKey());
        const verb = order.side === 'SELL' ? 'Sold' : 'Bought';
        addToast(`${verb} ${order.quantity} ${order.symbol} @ ${(order.fill_price ?? 0).toFixed(2)}`, 'success');
      }
      await checkAuth();
    } catch (e: unknown) {
      const message = orderErrorMessage(e);
      setError(message);
      addToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const reservationText = reservation
    ? side === 'BUY'
      ? formatMoney(reservation.cash)
      : `${formatQuantity(reservation.shares)} shares`
    : MISSING;

  const bidAskRows: ReadonlyArray<{ label: string; value: string; emphasis?: boolean }> = [
    { label: 'Bid', value: quote ? formatMoney(quote.bid) : MISSING },
    { label: 'Ask', value: quote ? formatMoney(quote.ask) : MISSING },
  ];

  const rows: ReadonlyArray<{ label: string; value: string; emphasis?: boolean }> =
    orderType === 'MARKET'
      ? [
          ...bidAskRows,
          { label: 'Price', value: preview ? formatMoney(preview.price) : MISSING },
          { label: 'Commission', value: preview ? formatMoney(preview.commission) : MISSING },
          { label: 'Total', value: preview ? formatMoney(preview.total) : MISSING, emphasis: true },
        ]
      : orderType === 'LIMIT'
        ? [
            ...bidAskRows,
            { label: 'Limit price', value: limitPrice !== null ? formatMoney(limitPrice) : MISSING },
            { label: 'Reserved amount', value: reservationText, emphasis: true },
          ]
        : [
            ...bidAskRows,
            { label: 'Stop price', value: stopPrice !== null ? formatMoney(stopPrice) : MISSING },
            { label: 'Reserved amount', value: reservationText, emphasis: true },
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

      <div
        role="tablist"
        aria-label="Order type"
        className="flex gap-1 p-1 bg-[#111111] border border-[#27272a] rounded-lg mb-4"
      >
        {ORDER_TYPES.map(({ value, label }) => {
          const isSelected = orderType === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleType(value)}
              className={`flex-1 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors ${
                isSelected ? 'bg-white text-black' : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

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

          {orderType === 'LIMIT' && (
            <div>
              <label htmlFor={limitPriceId} className="block text-sm text-[#a1a1aa] mb-1">
                Limit price
              </label>
              <input
                id={limitPriceId}
                type="number"
                min={0.01}
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={limitPriceText}
                onChange={handleLimitPrice}
                className="w-full bg-[#111111] border border-[#27272a] rounded-lg px-3 py-2 text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#a1a1aa]"
              />
            </div>
          )}

          {orderType === 'STOP' && (
            <div>
              <label htmlFor={stopPriceId} className="block text-sm text-[#a1a1aa] mb-1">
                Stop price
              </label>
              <input
                id={stopPriceId}
                type="number"
                min={0.01}
                step="any"
                inputMode="decimal"
                placeholder="0.00"
                value={stopPriceText}
                onChange={handleStopPrice}
                className="w-full bg-[#111111] border border-[#27272a] rounded-lg px-3 py-2 text-white placeholder:text-[#71717a] focus:outline-none focus:border-[#a1a1aa]"
              />
            </div>
          )}

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

          {current?.failed && !quote && !streaming && (
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
            disabled={!canSubmit}
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
