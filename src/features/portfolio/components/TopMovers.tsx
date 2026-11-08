'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { pnlTone, type PnlTone } from '@/features/portfolio/selectors';
import type { PortfolioPosition } from '@/features/portfolio/types';
import { formatMoney, formatPercent } from '@/lib/format';
import { instrumentHref } from '@/lib/routes';
import { usePortfolioStore } from '@/store/usePortfolioStore';

const TONE_CLASS: Record<PnlTone, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-[#a1a1aa]',
};

function MoverRow({ position }: { position: PortfolioPosition }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Link
          href={instrumentHref(position.orderbook_id)}
          className="block truncate text-sm font-medium text-white hover:underline"
        >
          {position.name}
        </Link>
        <div className="text-xs text-[#a1a1aa]">{position.symbol}</div>
      </div>
      <div className="text-right shrink-0 tabular-nums">
        <div className="text-sm font-medium text-white">{formatMoney(position.last_price)}</div>
        <div className={`text-xs ${TONE_CLASS[pnlTone(position.day_change_percent)]}`}>
          {formatPercent(position.day_change_percent)}
        </div>
      </div>
    </li>
  );
}

/** The portfolio's biggest movers today: `Portfolio.top_movers`, already sorted by day change (desc). */
export function TopMovers() {
  const portfolio = usePortfolioStore((state) => state.portfolio);
  const status = usePortfolioStore((state) => state.portfolioStatus);

  let body: ReactNode;
  if (!portfolio) {
    body =
      status === 'error' ? (
        <p role="alert" className="text-center text-[#a1a1aa] mt-8 text-sm">
          Could not load your movers. Try again later.
        </p>
      ) : (
        <p role="status" className="text-center text-[#a1a1aa] mt-8 text-sm">
          Loading movers…
        </p>
      );
  } else if (portfolio.top_movers.length === 0) {
    body = <p className="text-center text-[#a1a1aa] mt-8 text-sm">Movers appear once you hold positions.</p>;
  } else {
    body = (
      <ul className="space-y-4" aria-label="Top movers">
        {portfolio.top_movers.map((position) => (
          <MoverRow key={position.orderbook_id} position={position} />
        ))}
      </ul>
    );
  }

  return (
    <section className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-5 shadow-sm h-full overflow-y-auto scrollbar-hide">
      <h2 className="text-sm font-medium text-white mb-4">Top movers</h2>
      {body}
    </section>
  );
}
