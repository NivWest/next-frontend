'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { formatSignedMoney, pnlTone, type PnlTone } from '@/features/portfolio/selectors';
import type { PortfolioPosition } from '@/features/portfolio/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { instrumentHref, ROUTES } from '@/lib/routes';
import { usePortfolioStore } from '@/store/usePortfolioStore';

const TONE_CLASS: Record<PnlTone, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-[#a1a1aa]',
};

const quantityFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Share of holdings_value: `100.00%`. */
function formatWeight(weight: number): string {
  return `${weight.toFixed(2)}%`;
}

function positionCount(count: number): string {
  return `${count} ${count === 1 ? 'position' : 'positions'}`;
}

function HoldingRow({ position }: { position: PortfolioPosition }) {
  const pnlClass = TONE_CLASS[pnlTone(position.unrealized_pnl)];
  const dayClass = TONE_CLASS[pnlTone(position.day_change_percent)];
  return (
    <tr className="hover:bg-[#111111] transition-colors">
      <td className="px-4 py-3">
        <Link href={instrumentHref(position.orderbook_id)} className="font-medium text-white hover:underline">
          {position.name}
        </Link>
        <div className="text-xs text-[#a1a1aa]">{position.symbol}</div>
      </td>
      <td className="px-4 py-3 text-right text-white tabular-nums">{quantityFormat.format(position.quantity)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">{formatMoney(position.avg_cost)}</td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">
        {formatMoney(position.last_price)}
      </td>
      <td className="px-4 py-3 text-right text-white tabular-nums whitespace-nowrap">
        {formatMoney(position.market_value)}
      </td>
      <td className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${pnlClass}`}>
        <div>{formatSignedMoney(position.unrealized_pnl)}</div>
        <div className="text-xs">{formatPercent(position.unrealized_pnl_percent)}</div>
      </td>
      <td className={`px-4 py-3 text-right tabular-nums whitespace-nowrap ${dayClass}`}>
        {formatPercent(position.day_change_percent)}
      </td>
      <td className="px-4 py-3 text-right text-white tabular-nums">{formatWeight(position.weight)}</td>
    </tr>
  );
}

const COLUMNS: { label: string; align: 'left' | 'right' }[] = [
  { label: 'Instrument', align: 'left' },
  { label: 'Qty', align: 'right' },
  { label: 'Avg cost', align: 'right' },
  { label: 'Last price', align: 'right' },
  { label: 'Market value', align: 'right' },
  { label: 'Unrealized P&L', align: 'right' },
  { label: 'Day change', align: 'right' },
  { label: 'Weight', align: 'right' },
];

export function HoldingsTable() {
  const portfolio = usePortfolioStore((state) => state.portfolio);
  const status = usePortfolioStore((state) => state.portfolioStatus);

  let body: ReactNode;
  if (!portfolio) {
    body =
      status === 'error' ? (
        <p role="alert" className="p-12 text-center text-[#a1a1aa]">
          Could not load your holdings. Try again later.
        </p>
      ) : (
        <p role="status" className="p-12 text-center text-[#a1a1aa]">
          Loading holdings…
        </p>
      );
  } else if (portfolio.positions.length === 0) {
    body = (
      <div className="p-12 text-center text-[#a1a1aa]">
        <p className="mb-3">No positions yet</p>
        <Link href={ROUTES.markets} className="text-sm font-medium text-green-500 hover:underline">
          Browse markets
        </Link>
      </div>
    );
  } else {
    body = (
      <div className="overflow-x-auto">
        <table aria-label="Holdings" className="w-full text-sm text-left">
          <thead className="text-xs text-[#a1a1aa] bg-[#0a0a0a] border-b border-[#27272a]">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={`px-4 py-3 font-medium whitespace-nowrap ${column.align === 'right' ? 'text-right' : ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#27272a]">
            {portfolio.positions.map((position) => (
              <HoldingRow key={position.orderbook_id} position={position} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-[#27272a] flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-sm font-medium text-white">Holdings</h2>
        <span className="text-xs text-[#a1a1aa]" data-testid="holdings-summary">
          {portfolio
            ? `${positionCount(portfolio.positions.length)} · ${formatMoney(portfolio.holdings_value)}`
            : '—'}
        </span>
      </div>
      {body}
    </section>
  );
}
