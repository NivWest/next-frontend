'use client';

import { useId } from 'react';
import { formatSignedMoney, pnlTone, unrealizedPnlPercent, type PnlTone } from '@/features/portfolio/selectors';
import { formatMoney, formatPercent } from '@/lib/format';
import { usePortfolioStore } from '@/store/usePortfolioStore';

/** Shown until a portfolio has loaded; never a fake 0. */
const PLACEHOLDER = '—';

const TONE_CLASS: Record<PnlTone, string> = {
  positive: 'text-green-500',
  negative: 'text-red-500',
  neutral: 'text-white',
};

interface KPICardProps {
  title: string;
  value: string;
  tone?: PnlTone;
  detail?: string;
}

function KPICard({ title, value, tone = 'neutral', detail }: KPICardProps) {
  const titleId = useId();
  return (
    <div
      role="group"
      aria-labelledby={titleId}
      className="bg-[#0a0a0a] border border-[#27272a] rounded-xl p-4 flex flex-col justify-between min-h-28 shadow-sm"
    >
      <div id={titleId} className="text-sm text-[#a1a1aa] font-medium">
        {title}
      </div>
      <div>
        <div className={`text-xl sm:text-2xl font-bold break-words ${TONE_CLASS[tone]}`}>{value}</div>
        {detail && <div className={`text-xs mt-1 ${TONE_CLASS[tone]}`}>{detail}</div>}
      </div>
    </div>
  );
}

export function KPICards() {
  const portfolio = usePortfolioStore((state) => state.portfolio);

  if (!portfolio) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total equity" value={PLACEHOLDER} />
        <KPICard title="Cash" value={PLACEHOLDER} />
        <KPICard title="Unrealized P&L" value={PLACEHOLDER} />
        <KPICard title="Realized P&L" value={PLACEHOLDER} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KPICard title="Total equity" value={formatMoney(portfolio.total_equity)} />
      <KPICard title="Cash" value={formatMoney(portfolio.cash)} />
      <KPICard
        title="Unrealized P&L"
        value={formatSignedMoney(portfolio.unrealized_pnl)}
        tone={pnlTone(portfolio.unrealized_pnl)}
        detail={formatPercent(unrealizedPnlPercent(portfolio))}
      />
      <KPICard
        title="Realized P&L"
        value={formatSignedMoney(portfolio.realized_pnl)}
        tone={pnlTone(portfolio.realized_pnl)}
      />
    </div>
  );
}
