'use client';

import { Loader2, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatMoney, formatPercent } from '@/lib/format';
import { instrumentHref } from '@/lib/routes';
import { searchInstruments } from '../api/market';
import type { InstrumentSummary } from '../types';

/** Queries shorter than this (after trimming) show a hint instead of hitting the backend. */
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 500;
const COLUMN_COUNT = 4;

interface MarketSearchProps {
  /** Initial search text, e.g. the `q` search param of /markets. Re-key the component to apply a new one. */
  initialQuery?: string;
}

/** Outcome of the latest finished search, tagged with the query it answers. */
interface SearchOutcome {
  query: string;
  items: InstrumentSummary[];
  failed: boolean;
}

function changeClassName(formatted: string, value: number): string {
  if (formatted === '0.00%') return 'text-[#a1a1aa]';
  return value > 0 ? 'text-green-500' : 'text-red-500';
}

export function MarketSearch({ initialQuery = '' }: MarketSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [outcome, setOutcome] = useState<SearchOutcome | null>(null);

  const trimmed = query.trim();
  const searchable = trimmed.length >= MIN_QUERY_LENGTH;

  useEffect(() => {
    if (!searchable) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      searchInstruments(trimmed).then(
        (data) => {
          if (!cancelled) setOutcome({ query: trimmed, items: data.items, failed: false });
        },
        () => {
          if (!cancelled) setOutcome({ query: trimmed, items: [], failed: true });
        },
      );
    }, DEBOUNCE_MS);

    return () => {
      // Ignore responses for a query the user has since changed.
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, searchable]);

  // Derived during render: only an outcome for the current query counts, anything else is still loading.
  const current = searchable && outcome?.query === trimmed ? outcome : null;
  const loading = searchable && current === null;
  const items = current?.items ?? [];

  return (
    // Bottom padding keeps the last rows clear of the fixed cookie banner and toasts.
    <div className="max-w-5xl mx-auto p-4 pb-40 md:p-6 md:pb-40">
      <div className="flex items-center gap-3 mb-6">
        <Search className="text-white" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white">Markets</h1>
      </div>

      <div className="bg-[#111111] border border-[#27272a] rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-[#a1a1aa]" size={18} aria-hidden="true" />
          <input
            type="text"
            aria-label="Search markets"
            placeholder="Search by ticker or company name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0a0a0a] border border-[#27272a] rounded-lg py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-zinc-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-[#a1a1aa] bg-[#111111] border-b border-[#27272a]">
            <tr>
              <th className="px-4 md:px-6 py-4 font-medium">Instrument</th>
              <th className="px-4 md:px-6 py-4 font-medium text-right">Last price</th>
              <th className="px-4 md:px-6 py-4 font-medium text-right">Change</th>
              <th className="px-4 md:px-6 py-4 font-medium text-right">Market</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {!searchable && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-8 text-center text-[#a1a1aa]">
                  Type at least 2 characters to search.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-8 text-center text-[#a1a1aa]" aria-busy="true">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" aria-hidden="true" />
                  Searching markets...
                </td>
              </tr>
            )}
            {current?.failed && (
              <tr>
                <td colSpan={COLUMN_COUNT} role="alert" className="px-6 py-8 text-center text-red-500">
                  Search is unavailable right now. Please try again.
                </td>
              </tr>
            )}
            {current && !current.failed && items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT} className="px-6 py-8 text-center text-[#a1a1aa]">
                  No instruments found for &quot;{trimmed}&quot;.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const href = instrumentHref(item.orderbook_id);
              const change = formatPercent(item.change_percent);

              return (
                <tr
                  key={item.orderbook_id}
                  className="hover:bg-[#111111] transition-colors cursor-pointer"
                  onClick={() => router.push(href)}
                >
                  <td className="px-4 md:px-6 py-4">
                    <Link
                      href={href}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-white hover:underline focus-visible:underline outline-none"
                    >
                      {item.name}
                    </Link>
                    <div className="text-xs text-[#a1a1aa]">
                      {item.symbol} · {item.orderbook_id}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right text-white whitespace-nowrap">
                    {formatMoney(item.last_price, item.currency)}
                  </td>
                  <td
                    className={`px-4 md:px-6 py-4 text-right font-medium whitespace-nowrap ${changeClassName(change, item.change_percent)}`}
                  >
                    {change}
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right text-white">{item.market}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
