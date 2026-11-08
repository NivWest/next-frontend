import { act, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Analytics } from '../Analytics';
import type { PortfolioAnalytics } from '../../types';

const getAnalyticsMock = vi.fn<(signal?: AbortSignal) => Promise<PortfolioAnalytics>>();
vi.mock('@/features/analytics/api/analytics', () => ({
  getPortfolioAnalytics: (signal?: AbortSignal) => getAnalyticsMock(signal),
}));

const fresh: PortfolioAnalytics = {
  total_return_pct: 0,
  volatility_annualized_pct: null,
  sharpe_ratio: null,
  max_drawdown_pct: null,
  sufficient_data: false,
  data_points: 0,
  allocation: [{ label: 'Cash', orderbook_id: null, value: 100000, weight: 100 }],
};

const seasoned: PortfolioAnalytics = {
  total_return_pct: 2.15,
  volatility_annualized_pct: 14.32,
  sharpe_ratio: 1.12,
  max_drawdown_pct: -3.4,
  sufficient_data: true,
  data_points: 21,
  allocation: [
    { label: 'FJRD', orderbook_id: 'SIM-FJRD', value: 10000, weight: 10 },
    { label: 'Cash', orderbook_id: null, value: 90000, weight: 90 },
  ],
};

async function renderWith(analytics: PortfolioAnalytics): Promise<void> {
  getAnalyticsMock.mockResolvedValue(analytics);
  render(<Analytics />);
  await act(async () => {});
}

function card(title: string): HTMLElement {
  return screen.getByRole('group', { name: title });
}

describe('Analytics', () => {
  beforeEach(() => {
    getAnalyticsMock.mockReset();
  });

  it('shows a loading status first', () => {
    getAnalyticsMock.mockReturnValue(new Promise(() => {}));
    render(<Analytics />);
    expect(screen.getByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading analytics…');
  });

  it('fresh guest: "Not enough history yet" with the number of data points and dashes, never fake numbers', async () => {
    await renderWith(fresh);

    const note = screen.getByRole('note', { name: 'Not enough history yet' });
    expect(note).toHaveTextContent('0 of 5 daily returns');
    expect(card('Total return')).toHaveTextContent('0.00%');
    for (const title of ['Volatility', 'Sharpe ratio', 'Max drawdown']) {
      expect(card(title)).toHaveTextContent('—');
    }
    const text = document.body.textContent ?? '';
    for (const fake of ['+18.4%', '1.84', '-12.3%', 'Tech (75%)', 'YTD Return']) {
      expect(text).not.toContain(fake);
    }
  });

  it('shows the allocation chart with a legend that includes Cash', async () => {
    await renderWith(fresh);

    expect(screen.getByRole('img', { name: 'Allocation chart' })).toBeInTheDocument();
    const legend = screen.getByRole('list', { name: 'Allocation' });
    const items = within(legend).getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(items[0]).toHaveTextContent('Cash');
    expect(items[0]).toHaveTextContent('100,000.00 SEK');
    expect(items[0]).toHaveTextContent('100.00%');
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('with enough history: formatted metrics and no insufficient-data note', async () => {
    await renderWith(seasoned);

    expect(screen.queryByText('Not enough history yet')).toBeNull();
    expect(card('Total return')).toHaveTextContent('+2.15%');
    expect(card('Volatility')).toHaveTextContent('+14.32%');
    expect(card('Sharpe ratio')).toHaveTextContent('1.12');
    expect(card('Max drawdown')).toHaveTextContent('-3.40%');
    const items = within(screen.getByRole('list', { name: 'Allocation' })).getAllByRole('listitem');
    expect(items.map((i) => i.textContent)).toEqual(['FJRD10,000.00 SEK10.00%', 'Cash90,000.00 SEK90.00%']);
  });

  it('every metric card explains itself in a tooltip', async () => {
    await renderWith(seasoned);

    for (const title of ['Total return', 'Volatility', 'Sharpe ratio', 'Max drawdown']) {
      const button = within(card(title)).getByRole('button', { name: `What is ${title.toLowerCase()}?` });
      const tooltipId = button.getAttribute('aria-describedby');
      expect(tooltipId).toBeTruthy();
      const tooltip = document.getElementById(tooltipId ?? '');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
      expect(tooltip?.textContent?.length).toBeGreaterThan(40);
      expect(card(title)).toHaveAccessibleDescription(tooltip?.textContent ?? '');
    }
    expect(screen.getAllByRole('tooltip', { hidden: true })).toHaveLength(4);
  });

  it('shows an alert when the request fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getAnalyticsMock.mockRejectedValue(new Error('boom'));
    render(<Analytics />);
    await act(async () => {});
    expect(screen.getByRole('alert')).toHaveTextContent('Analytics are unavailable right now.');
  });
});
