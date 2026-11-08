import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Dashboard } from '../Dashboard';
import type { Portfolio, PortfolioPosition } from '@/features/portfolio/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

// The chart and movers widgets fetch market data on mount; they are not under test here.
vi.mock('@/features/analytics/components/EquityChart', () => ({
  EquityChart: () => <div data-testid="equity-chart" />,
}));
vi.mock('../TopMovers', () => ({
  TopMovers: () => <div data-testid="top-movers" />,
}));

const initialPortfolio = usePortfolioStore.getState();

function position(orderbookId: string, marketValue: number): PortfolioPosition {
  return {
    orderbook_id: orderbookId,
    symbol: orderbookId.replace('SIM-', ''),
    name: `${orderbookId} AB`,
    quantity: 1,
    avg_cost: marketValue,
    last_price: marketValue,
    market_value: marketValue,
    unrealized_pnl: 0,
    unrealized_pnl_percent: 0,
    day_change_percent: 0,
    weight: 50,
    reserved_quantity: 0,
  };
}

function portfolioWith(positions: PortfolioPosition[]): Portfolio {
  const holdings = positions.reduce((sum, p) => sum + p.market_value, 0);
  return {
    cash: 100000 - holdings,
    reserved_cash: 0,
    buying_power: 100000 - holdings,
    holdings_value: holdings,
    total_equity: 100000,
    unrealized_pnl: 0,
    realized_pnl: 0,
    positions,
    top_movers: positions,
  };
}
const initialUI = useUIStore.getState();

let fetchPortfolio: Mock<() => Promise<void>>;

describe('Dashboard', () => {
  beforeEach(() => {
    fetchPortfolio = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    usePortfolioStore.setState({ fetchPortfolio });
  });

  afterEach(() => {
    usePortfolioStore.setState(initialPortfolio, true);
    useUIStore.setState(initialUI, true);
  });

  it('shows the "Overview" heading without the fake date and export controls', () => {
    render(<Dashboard />);

    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export/i })).toBeNull();
    expect(screen.queryByText(/Aug 3 - Aug 9, 2026/)).toBeNull();
  });

  it('has no order ticket; trading happens on the instrument page', () => {
    render(<Dashboard />);

    expect(screen.queryByRole('heading', { name: /order ticket/i })).toBeNull();
    expect(screen.queryByText(/NVDA/)).toBeNull();
    expect(screen.queryByText(/NVIDIA/)).toBeNull();
    expect(screen.getByTestId('top-movers')).toBeInTheDocument();
  });

  it('loads the portfolio when the user is signed in', () => {
    useUIStore.setState({ isAuthenticated: true });

    render(<Dashboard />);

    expect(fetchPortfolio).toHaveBeenCalledTimes(1);
  });

  it('does not load the portfolio when signed out', () => {
    useUIStore.setState({ isAuthenticated: false });

    render(<Dashboard />);

    expect(fetchPortfolio).not.toHaveBeenCalled();
  });

  it('renders the KPI cards and holdings from the loaded portfolio', () => {
    useUIStore.setState({ isAuthenticated: true });
    usePortfolioStore.setState({
      portfolio: {
        cash: 100000,
        reserved_cash: 0,
        buying_power: 100000,
        holdings_value: 0,
        total_equity: 100000,
        unrealized_pnl: 0,
        realized_pnl: 0,
        positions: [],
        top_movers: [],
      },
      portfolioStatus: 'ready',
    });

    render(<Dashboard />);

    expect(screen.getByRole('group', { name: 'Total equity' })).toHaveTextContent('100,000.00 SEK');
    expect(screen.getByRole('group', { name: 'Cash' })).toHaveTextContent('100,000.00 SEK');
    expect(screen.getByText('No positions yet')).toBeInTheDocument();
    expect(screen.getByTestId('equity-chart')).toBeInTheDocument();
  });

  it('shows the equity chart instead of the single-instrument chart (story NW-10)', () => {
    usePortfolioStore.setState({ portfolio: portfolioWith([position('SIM-BIGG', 5000)]), portfolioStatus: 'ready' });

    render(<Dashboard />);

    expect(screen.getByTestId('equity-chart')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Asset chart' })).toBeNull();
    expect(screen.queryByText('Largest holding')).toBeNull();
  });
});
