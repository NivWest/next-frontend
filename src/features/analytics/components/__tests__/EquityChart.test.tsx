import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EquityChart } from '../EquityChart';
import type { EquityHistory, EquityPoint, HistoryRange } from '../../types';

const getHistoryMock = vi.fn<(range: HistoryRange, signal?: AbortSignal) => Promise<EquityHistory>>();
vi.mock('@/features/analytics/api/analytics', () => ({
  getPortfolioHistory: (range: HistoryRange, signal?: AbortSignal) => getHistoryMock(range, signal),
}));

interface Deferred {
  range: HistoryRange;
  signal?: AbortSignal;
  resolve: (points: EquityPoint[]) => void;
  reject: (error: Error) => void;
}

function deferCalls(): Deferred[] {
  const calls: Deferred[] = [];
  getHistoryMock.mockImplementation(
    (range, signal) =>
      new Promise<EquityHistory>((resolve, reject) => {
        calls.push({ range, signal, resolve: (points) => resolve({ range, points }), reject });
      }),
  );
  return calls;
}

const points: EquityPoint[] = [
  { t: '2026-11-08T09:00:00Z', equity: 100000 },
  { t: '2026-11-08T09:41:00Z', equity: 99964.97 },
];

function rangeButton(name: string): HTMLElement {
  return within(screen.getByRole('group', { name: 'Equity range' })).getByRole('button', { name });
}

describe('EquityChart', () => {
  beforeEach(() => {
    getHistoryMock.mockReset();
  });

  it('loads 1D first and shows a loading status outside the chart', () => {
    const calls = deferCalls();
    render(<EquityChart />);

    expect(screen.getByRole('region', { name: 'Equity chart' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Equity' })).toBeInTheDocument();
    expect(calls.map((c) => c.range)).toEqual(['1d']);
    expect(rangeButton('1D')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('Loading equity history…');
    expect(screen.queryByRole('img', { name: 'Equity over time' })).toBeNull();
  });

  it('requests GET /portfolio/history for every range that is selected', async () => {
    const calls = deferCalls();
    render(<EquityChart />);
    await act(async () => calls[0].resolve(points));

    for (const [name, range] of [['1W', '1w'], ['1M', '1m'], ['All', 'all'], ['1D', '1d']] as const) {
      fireEvent.click(rangeButton(name));
      expect(rangeButton(name)).toHaveAttribute('aria-pressed', 'true');
      expect(calls[calls.length - 1].range).toBe(range);
      await act(async () => calls[calls.length - 1].resolve(points));
    }
    expect(calls.map((c) => c.range)).toEqual(['1d', '1w', '1m', 'all', '1d']);
  });

  it('shows the latest equity, the change over the range and the chart once loaded', async () => {
    const calls = deferCalls();
    render(<EquityChart />);
    await act(async () => calls[0].resolve(points));

    expect(screen.getByRole('img', { name: 'Equity over time' })).toBeInTheDocument();
    expect(screen.getByTestId('equity-latest')).toHaveTextContent('99,964.97 SEK');
    expect(screen.getByTestId('equity-change')).toHaveTextContent('-35.03 SEK (-0.04%)');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows an explicit empty state when the range has no points', async () => {
    const calls = deferCalls();
    render(<EquityChart />);
    await act(async () => calls[0].resolve([]));

    expect(screen.getByText(/No equity history in this range yet/)).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Equity over time' })).toBeNull();
    expect(screen.queryByTestId('equity-latest')).toBeNull();
  });

  it('shows an alert outside the chart when the request fails', async () => {
    const calls = deferCalls();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<EquityChart />);
    await act(async () => calls[0].reject(new Error('boom')));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Equity history is unavailable right now.');
    expect(alert.closest('[role="img"]')).toBeNull();
  });

  it('aborts the previous request and ignores its late answer when the range changes', async () => {
    const calls = deferCalls();
    render(<EquityChart />);
    fireEvent.click(rangeButton('1W'));

    expect(calls[0].signal?.aborted).toBe(true);
    await act(async () => calls[0].resolve(points)); // late 1d answer
    expect(screen.getByRole('status')).toHaveTextContent('Loading equity history…');

    await act(async () => calls[1].resolve([{ t: '2026-11-08T09:00:00Z', equity: 123456 }]));
    expect(screen.getByTestId('equity-latest')).toHaveTextContent('123,456.00 SEK');
  });
});
