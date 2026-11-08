'use client';

import { Activity, BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPortfolioAnalytics } from '../api/analytics';
import {
  METRIC_EXPLANATIONS,
  formatDataPoints,
  formatMetricPercent,
  formatRatio,
  metricTone,
} from '../format';
import { MIN_DAILY_RETURNS, type PortfolioAnalytics } from '../types';
import { AllocationChart } from './AllocationChart';
import { MetricCard } from './MetricCard';

type LoadResult = { ok: true; analytics: PortfolioAnalytics } | { ok: false };

const PANEL_CLASS = 'bg-[#0a0a0a] border border-[#27272a] rounded-xl p-6 shadow-sm';

/**
 * The /analytics page (story NW-10): total return, annualized volatility, Sharpe ratio and max drawdown from
 * GET /portfolio/analytics, each with a plain-language tooltip; an explicit "Not enough history yet" state
 * while there are fewer than 5 daily returns; and the allocation donut.
 */
export function Analytics() {
  const [result, setResult] = useState<LoadResult | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getPortfolioAnalytics(controller.signal)
      .then((analytics) => setResult({ ok: true, analytics }))
      .catch((e: unknown) => {
        if (controller.signal.aborted) return;
        console.error(e);
        setResult({ ok: false });
      });
    return () => controller.abort();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-white" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>
      <AnalyticsBody result={result} />
    </div>
  );
}

function AnalyticsBody({ result }: { result: LoadResult | null }) {
  if (!result) {
    return (
      <div role="status" className={`${PANEL_CLASS} flex flex-col items-center justify-center text-sm text-[#a1a1aa] min-h-48`}>
        <Activity className="w-6 h-6 animate-spin mb-3" aria-hidden="true" />
        <p>Loading analytics…</p>
      </div>
    );
  }
  if (!result.ok) {
    return (
      <div role="alert" className={`${PANEL_CLASS} text-sm text-red-500`}>
        Analytics are unavailable right now. Please try again later.
      </div>
    );
  }

  const a = result.analytics;
  const totalEquity = a.allocation.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="space-y-6">
      <section aria-labelledby="analytics-performance" className={PANEL_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="text-green-500" aria-hidden="true" />
          <h2 id="analytics-performance" className="text-lg font-medium text-white">
            Risk-adjusted performance
          </h2>
        </div>

        {!a.sufficient_data && <InsufficientData dataPoints={a.data_points} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total return"
            value={formatMetricPercent(a.total_return_pct)}
            tone={metricTone(a.total_return_pct)}
            explanation={METRIC_EXPLANATIONS.totalReturn}
          />
          <MetricCard
            title="Volatility"
            value={formatMetricPercent(a.volatility_annualized_pct)}
            explanation={METRIC_EXPLANATIONS.volatility}
          />
          <MetricCard
            title="Sharpe ratio"
            value={formatRatio(a.sharpe_ratio)}
            tone={metricTone(a.sharpe_ratio)}
            explanation={METRIC_EXPLANATIONS.sharpe}
          />
          <MetricCard
            title="Max drawdown"
            value={formatMetricPercent(a.max_drawdown_pct)}
            tone={metricTone(a.max_drawdown_pct)}
            explanation={METRIC_EXPLANATIONS.maxDrawdown}
          />
        </div>
      </section>

      <section aria-labelledby="analytics-allocation" className={PANEL_CLASS}>
        <div className="flex items-center gap-3 mb-4">
          <PieIcon className="text-blue-500" aria-hidden="true" />
          <h2 id="analytics-allocation" className="text-lg font-medium text-white">
            Asset allocation
          </h2>
        </div>
        <AllocationChart allocation={a.allocation} totalEquity={totalEquity} />
      </section>
    </div>
  );
}

function InsufficientData({ dataPoints }: { dataPoints: number }) {
  return (
    <div
      role="note"
      aria-labelledby="analytics-insufficient"
      className="mb-4 rounded-lg border border-[#27272a] bg-[#111111] p-4 text-sm text-[#a1a1aa]"
    >
      <h3 id="analytics-insufficient" className="text-white font-medium mb-1">
        Not enough history yet
      </h3>
      <p>
        Volatility, Sharpe ratio and max drawdown need at least {MIN_DAILY_RETURNS} daily returns:{' '}
        <span className="text-white font-medium" data-testid="analytics-data-points">
          {formatDataPoints(dataPoints)}
        </span>{' '}
        so far. Your equity is recorded after every trade and every hour, so check back after a few days of
        trading.
      </p>
    </div>
  );
}
