import { describe, expect, it } from 'vitest';
import {
  NO_VALUE,
  equityChange,
  formatDataPoints,
  formatHistoryTime,
  formatMetricPercent,
  formatRatio,
  metricTone,
  toEquityChartPoints,
} from '../format';

describe('formatMetricPercent', () => {
  it.each([
    [1.25, '+1.25%'],
    [-12.3, '-12.30%'],
    [0, '0.00%'],
    [-0.001, '0.00%'],
    [19.27, '+19.27%'],
  ])('%s → %s', (value, text) => {
    expect(formatMetricPercent(value)).toBe(text);
  });

  it('shows a dash for null (not enough history), never a fake 0', () => {
    expect(formatMetricPercent(null)).toBe(NO_VALUE);
    expect(NO_VALUE).toBe('—');
  });
});

describe('formatRatio', () => {
  it.each([
    [1.84, '1.84'],
    [6.44, '6.44'],
    [-0.42, '-0.42'],
    [0, '0.00'],
    [-0.001, '0.00'],
    [1234.5, '1,234.50'],
  ])('%s → %s', (value, text) => {
    expect(formatRatio(value)).toBe(text);
  });

  it('shows a dash for null', () => {
    expect(formatRatio(null)).toBe('—');
  });
});

describe('metricTone', () => {
  it.each([
    [1, 'positive'],
    [-0.01, 'negative'],
    [0, 'neutral'],
    [-0.004, 'neutral'],
    [null, 'neutral'],
  ] as const)('%s → %s', (value, tone) => {
    expect(metricTone(value)).toBe(tone);
  });
});

describe('formatDataPoints', () => {
  it('counts daily returns against the minimum of 5', () => {
    expect(formatDataPoints(0)).toBe('0 of 5 daily returns');
    expect(formatDataPoints(4)).toBe('4 of 5 daily returns');
  });
});

describe('formatHistoryTime', () => {
  const t = '2026-11-08T09:41:12Z';
  it.each([
    ['1d', '09:41'],
    ['1w', 'Nov 8, 09:41'],
    ['1m', 'Nov 8, 09:41'],
    ['all', 'Nov 8, 2026'],
  ] as const)('%s → %s (UTC)', (range, text) => {
    expect(formatHistoryTime(t, range)).toBe(text);
  });

  it('is UTC, not local time', () => {
    expect(formatHistoryTime('2026-12-31T23:30:00Z', 'all')).toBe('Dec 31, 2026');
    expect(formatHistoryTime('2026-01-01T00:05:00+01:00', '1w')).toBe('Dec 31, 23:05');
  });

  it('returns unparseable input unchanged', () => {
    expect(formatHistoryTime('not a date', '1d')).toBe('not a date');
  });
});

describe('toEquityChartPoints', () => {
  it('keeps order and equity and labels each point for its range', () => {
    const points = [
      { t: '2026-11-08T09:00:00Z', equity: 100000 },
      { t: '2026-11-08T09:41:00Z', equity: 99964.97 },
    ];
    expect(toEquityChartPoints(points, '1d')).toEqual([
      { t: '2026-11-08T09:00:00Z', label: '09:00', equity: 100000 },
      { t: '2026-11-08T09:41:00Z', label: '09:41', equity: 99964.97 },
    ]);
  });
});

describe('equityChange', () => {
  it('is first to last point', () => {
    const change = equityChange([
      { t: 'a', equity: 100000 },
      { t: 'b', equity: 101000 },
      { t: 'c', equity: 99000 },
    ]);
    expect(change?.absolute).toBe(-1000);
    expect(change?.percent).toBeCloseTo(-1, 10);
  });

  it('is null with fewer than two points or a non-positive start', () => {
    expect(equityChange([])).toBeNull();
    expect(equityChange([{ t: 'a', equity: 1 }])).toBeNull();
    expect(equityChange([{ t: 'a', equity: 0 }, { t: 'b', equity: 1 }])).toBeNull();
  });
});
