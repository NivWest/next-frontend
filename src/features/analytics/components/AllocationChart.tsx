'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatMoney } from '@/lib/format';
import { CASH_LABEL, type AllocationSlice } from '../types';

interface AllocationChartProps {
  allocation: AllocationSlice[];
  totalEquity: number;
}

/** Position colours in slice order; the cash slice is always zinc. */
const POSITION_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16', '#f97316'];
const CASH_COLOR = '#71717a';

const weightFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Colour of every slice: positions cycle through POSITION_COLORS, cash is CASH_COLOR. */
export function sliceColors(allocation: AllocationSlice[]): string[] {
  let next = 0;
  return allocation.map((slice) =>
    slice.orderbook_id === null && slice.label === CASH_LABEL ? CASH_COLOR : POSITION_COLORS[next++ % POSITION_COLORS.length],
  );
}

/** `"10.00%"`: allocation weights are shares, so no sign. */
export function formatWeight(weight: number): string {
  return `${weightFormat.format(weight)}%`;
}

/**
 * Donut of the allocation (recharts) with the total in the middle and a legend list ("Allocation") naming every
 * slice with its weight and value; the legend carries the information, the donut is decoration for assistive tech.
 */
export function AllocationChart({ allocation, totalEquity }: AllocationChartProps) {
  const colors = sliceColors(allocation);
  const visible = allocation.filter((slice) => slice.weight > 0);
  const visibleColors = colors.filter((_, i) => allocation[i].weight > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div role="img" aria-label="Allocation chart" className="relative w-44 h-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible}
              dataKey="weight"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              stroke="#0a0a0a"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {visible.map((slice, i) => (
                <Cell key={slice.orderbook_id ?? slice.label} fill={visibleColors[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: unknown, name: unknown) => [formatWeight(Number(value ?? 0)), String(name ?? '')]}
              separator=": "
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[#a1a1aa] text-xs">Total</span>
          <span className="text-white font-bold text-sm">{formatMoney(totalEquity)}</span>
        </div>
      </div>

      <ul aria-label="Allocation" className="w-full space-y-2">
        {allocation.map((slice, i) => (
          <li key={slice.orderbook_id ?? slice.label} className="flex items-center gap-3 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} aria-hidden="true" />
            <span className="text-white font-medium">{slice.label}</span>
            <span className="ml-auto text-[#a1a1aa] tabular-nums">{formatMoney(slice.value)}</span>
            <span className="w-16 text-right text-white tabular-nums">{formatWeight(slice.weight)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
