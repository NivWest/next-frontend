import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Dashboard } from '../Dashboard';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

// The chart and movers widgets fetch market data on mount; they are not under test here.
vi.mock('../AssetChart', () => ({
  AssetChart: () => <div data-testid="asset-chart" />,
}));
vi.mock('../TopMovers', () => ({
  TopMovers: () => <div data-testid="top-movers" />,
}));

const initialPortfolio = usePortfolioStore.getState();
const initialUI = useUIStore.getState();

let fetchDashboard: Mock<() => Promise<void>>;

describe('Dashboard', () => {
  beforeEach(() => {
    fetchDashboard = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    usePortfolioStore.setState({ fetchDashboard });
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

  it('loads the dashboard when the user is signed in', () => {
    useUIStore.setState({ isAuthenticated: true });

    render(<Dashboard />);

    expect(fetchDashboard).toHaveBeenCalledTimes(1);
  });

  it('does not load the dashboard when signed out', () => {
    useUIStore.setState({ isAuthenticated: false });

    render(<Dashboard />);

    expect(fetchDashboard).not.toHaveBeenCalled();
  });
});
