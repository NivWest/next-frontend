import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TopMovers } from '../TopMovers';
import type { Portfolio, PortfolioPosition } from '@/features/portfolio/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';

const initialPortfolio = usePortfolioStore.getState();

function position(overrides: Partial<PortfolioPosition>): PortfolioPosition {
  return {
    orderbook_id: 'SIM-XXXX',
    symbol: 'XXXX',
    name: 'Example AB',
    quantity: 10,
    avg_cost: 100,
    last_price: 100,
    market_value: 1000,
    unrealized_pnl: 0,
    unrealized_pnl_percent: 0,
    day_change_percent: 0,
    weight: 100,
    reserved_quantity: 0,
    ...overrides,
  };
}

function portfolio(topMovers: PortfolioPosition[]): Portfolio {
  return {
    cash: 100000,
    reserved_cash: 0,
    buying_power: 100000,
    holdings_value: 0,
    vault_value: 0,
    total_equity: 100000,
    unrealized_pnl: 0,
    realized_pnl: 0,
    positions: topMovers,
    top_movers: topMovers,
  };
}

describe('TopMovers', () => {
  afterEach(() => {
    usePortfolioStore.setState(initialPortfolio, true);
  });

  it('shows a loading status before the portfolio arrives', () => {
    usePortfolioStore.setState({ portfolio: null, portfolioStatus: 'loading' });

    render(<TopMovers />);

    expect(screen.getByRole('heading', { name: 'Top movers' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('shows an alert when the first load fails', () => {
    usePortfolioStore.setState({ portfolio: null, portfolioStatus: 'error' });

    render(<TopMovers />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('shows its own empty text, never the holdings table one, without positions', () => {
    usePortfolioStore.setState({ portfolio: portfolio([]), portfolioStatus: 'ready' });

    render(<TopMovers />);

    expect(screen.getByText('Movers appear once you hold positions.')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('No positions yet');
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('lists top_movers in order with instrument links, price and coloured day change', () => {
    const movers = [
      position({ orderbook_id: 'SIM-NVE', symbol: 'NVE', name: 'Nordvik Energy', last_price: 110, day_change_percent: 3 }),
      position({ orderbook_id: 'SIM-FJRD', symbol: 'FJRD', name: 'Fjord AB', last_price: 1234.5, day_change_percent: 0 }),
      position({ orderbook_id: 'SIM-MALM', symbol: 'MALM', name: 'Malm Mining', last_price: 42.5, day_change_percent: -1.25 }),
    ];
    usePortfolioStore.setState({ portfolio: portfolio(movers), portfolioStatus: 'ready' });

    render(<TopMovers />);

    const list = screen.getByRole('list', { name: 'Top movers' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'Nordvik EnergyNVE110.00 SEK+3.00%',
      'Fjord ABFJRD1,234.50 SEK0.00%',
      'Malm MiningMALM42.50 SEK-1.25%',
    ]);
    expect(within(list).getByRole('link', { name: 'Nordvik Energy' })).toHaveAttribute('href', '/markets/SIM-NVE');
    expect(within(list).getByRole('link', { name: 'Malm Mining' })).toHaveAttribute('href', '/markets/SIM-MALM');
    expect(within(rows[0]).getByText('+3.00%')).toHaveClass('text-green-500');
    expect(within(rows[1]).getByText('0.00%')).toHaveClass('text-[#a1a1aa]');
    expect(within(rows[2]).getByText('-1.25%')).toHaveClass('text-red-500');
    expect(document.body.textContent).not.toContain('$');
  });

  it('keeps showing the last movers while a refresh is loading', () => {
    usePortfolioStore.setState({
      portfolio: portfolio([position({ name: 'Nordvik Energy' })]),
      portfolioStatus: 'loading',
    });

    render(<TopMovers />);

    expect(screen.getByRole('list', { name: 'Top movers' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
