import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HoldingsTable } from '../HoldingsTable';
import type { Portfolio, PortfolioPosition } from '@/features/portfolio/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';

const initialPortfolio = usePortfolioStore.getState();

const fresh: Portfolio = {
  cash: 100000,
  reserved_cash: 0,
  buying_power: 100000,
  holdings_value: 0,
  vault_value: 0,
  total_equity: 100000,
  unrealized_pnl: 0,
  realized_pnl: 0,
  positions: [],
  top_movers: [],
};

const nve: PortfolioPosition = {
  orderbook_id: 'SIM-NVE',
  symbol: 'NVE',
  name: 'Nordvik Energy',
  quantity: 10,
  avg_cost: 100.35,
  last_price: 110,
  market_value: 1100,
  unrealized_pnl: 96.5,
  unrealized_pnl_percent: 9.62,
  day_change_percent: -1.25,
  weight: 100,
  reserved_quantity: 0,
};

const withPosition: Portfolio = {
  cash: 98996.5,
  reserved_cash: 0,
  buying_power: 98996.5,
  holdings_value: 1100,
  vault_value: 0,
  total_equity: 100096.5,
  unrealized_pnl: 96.5,
  realized_pnl: 0,
  positions: [nve],
  top_movers: [nve],
};

describe('HoldingsTable', () => {
  afterEach(() => {
    usePortfolioStore.setState(initialPortfolio, true);
  });

  it('shows a loading status, not the empty state, before the portfolio is ready', () => {
    usePortfolioStore.setState({ portfolio: null, portfolioStatus: 'loading' });

    render(<HoldingsTable />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading holdings');
    expect(screen.queryByText('No positions yet')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('shows an alert when the first load fails', () => {
    usePortfolioStore.setState({ portfolio: null, portfolioStatus: 'error' });

    render(<HoldingsTable />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('No positions yet')).toBeNull();
  });

  it('shows the empty state with a link to the markets for a fresh portfolio', () => {
    usePortfolioStore.setState({ portfolio: fresh, portfolioStatus: 'ready' });

    render(<HoldingsTable />);

    expect(screen.getByRole('heading', { name: 'Holdings' })).toBeInTheDocument();
    expect(screen.getByText('0 positions · 0.00 SEK')).toBeInTheDocument();
    expect(screen.getByText('No positions yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse markets' })).toHaveAttribute('href', '/markets');
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('lists a position with a link to its instrument page and formatted values', () => {
    usePortfolioStore.setState({ portfolio: withPosition, portfolioStatus: 'ready' });

    render(<HoldingsTable />);

    expect(screen.getByText('1 position · 1,100.00 SEK')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Holdings' });
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      'Instrument',
      'Qty',
      'Avg cost',
      'Last price',
      'Market value',
      'Unrealized P&L',
      'Day change',
      'Weight',
    ]);
    headers.forEach((h) => expect(h).toHaveAttribute('scope', 'col'));

    const link = within(table).getByRole('link', { name: 'Nordvik Energy' });
    expect(link).toHaveAttribute('href', '/markets/SIM-NVE');

    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(2);
    const cells = within(rows[1]).getAllByRole('cell').map((c) => c.textContent);
    expect(cells).toEqual([
      'Nordvik EnergyNVE',
      '10',
      '100.35 SEK',
      '110.00 SEK',
      '1,100.00 SEK',
      '+96.50 SEK+9.62%',
      '-1.25%',
      '100.00%',
    ]);
    expect(within(rows[1]).getByText('-1.25%')).toHaveClass('text-red-500');
    expect(document.body.textContent).not.toContain('$');
    expect(screen.queryByText(/Apple/)).toBeNull();
    expect(table.querySelector('svg')).toBeNull();
  });

  it('shows fractional quantities with up to 4 decimals instead of rounding to whole shares', () => {
    const fractional: PortfolioPosition = { ...nve, quantity: 0.5 };
    usePortfolioStore.setState({
      portfolio: { ...withPosition, positions: [fractional], top_movers: [fractional] },
      portfolioStatus: 'ready',
    });

    render(<HoldingsTable />);

    const table = screen.getByRole('table', { name: 'Holdings' });
    const cells = within(within(table).getAllByRole('row')[1]).getAllByRole('cell').map((c) => c.textContent);
    expect(cells[1]).toBe('0.5');
  });

  it('keeps showing the last portfolio while a refresh is loading', () => {
    usePortfolioStore.setState({ portfolio: withPosition, portfolioStatus: 'loading' });

    render(<HoldingsTable />);

    expect(screen.getByRole('table', { name: 'Holdings' })).toBeInTheDocument();
  });
});
