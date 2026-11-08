import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { TopMovers } from '../TopMovers';
import { useWatchlistStore } from '@/features/watchlist/store/useWatchlistStore';
import type { Watchlist, WatchlistItem } from '@/features/watchlist/types';
import { useUIStore } from '@/store/useUIStore';

const initialWatchlists = useWatchlistStore.getState();
const initialUI = useUIStore.getState();

function item(overrides: Partial<WatchlistItem>): WatchlistItem {
  return {
    orderbook_id: 'SIM-XXXX',
    symbol: 'XXXX',
    name: 'Example AB',
    last_price: 100,
    change_percent: 0,
    added_at: '2026-11-08T09:00:00Z',
    ...overrides,
  };
}

function list(id: number, items: WatchlistItem[]): Watchlist {
  return { id, name: `List ${id}`, items, created_at: '2026-11-08T09:00:00Z' };
}

let fetchWatchlists: Mock<() => Promise<void>>;

describe('TopMovers', () => {
  beforeEach(() => {
    fetchWatchlists = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    useWatchlistStore.setState({ fetchWatchlists });
  });

  afterEach(() => {
    // Unmount first: restoring the real store actions would otherwise re-run the components' effects.
    cleanup();
    useWatchlistStore.setState(initialWatchlists, true);
    useUIStore.setState(initialUI, true);
  });

  it('asks signed-out visitors to sign in and fetches nothing', () => {
    useUIStore.setState({ isAuthenticated: false });

    render(<TopMovers />);

    expect(screen.getByText('Sign in to see watchlist movers.')).toBeInTheDocument();
    expect(fetchWatchlists).not.toHaveBeenCalled();
  });

  it('loads the watchlists when signed in and shows a spinner meanwhile', () => {
    useUIStore.setState({ isAuthenticated: true });
    useWatchlistStore.setState({ status: 'loading', watchlists: [] });

    render(<TopMovers />);

    expect(fetchWatchlists).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Loading movers')).toBeInTheDocument();
  });

  it('shows the empty-watchlist state when no list has a priced item', () => {
    useUIStore.setState({ isAuthenticated: true });
    useWatchlistStore.setState({ status: 'ready', watchlists: [list(1, []), list(2, [item({ last_price: null, change_percent: null })])] });

    render(<TopMovers />);

    expect(screen.getByText('Your watchlist is empty.')).toBeInTheDocument();
  });

  it('lists each instrument once across lists, biggest change first, with formatted price and percent', () => {
    useUIStore.setState({ isAuthenticated: true });
    useWatchlistStore.setState({
      status: 'ready',
      watchlists: [
        list(1, [
          item({ orderbook_id: 'SIM-NVE', symbol: 'NVE', last_price: 100, change_percent: -0.5 }),
          item({ orderbook_id: 'SIM-FJRD', symbol: 'FJRD', last_price: 100000, change_percent: 1.25 }),
        ]),
        list(2, [
          item({ orderbook_id: 'SIM-NVE', symbol: 'NVE', last_price: 100, change_percent: -0.5 }),
          item({ orderbook_id: 'SIM-BALT', symbol: 'BALT', last_price: 42.5, change_percent: 3 }),
        ]),
      ],
    });

    render(<TopMovers />);

    const rows = within(screen.getByRole('list', { name: 'Watchlist movers' })).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'BALT42.50 SEK+3.00%',
      'FJRD100,000.00 SEK+1.25%',
      'NVE100.00 SEK-0.50%',
    ]);
    expect(screen.getByRole('link', { name: 'BALT' })).toHaveAttribute('href', '/markets/SIM-BALT');
  });

  it('shows at most five movers', () => {
    useUIStore.setState({ isAuthenticated: true });
    const items = Array.from({ length: 7 }, (_, i) => item({ orderbook_id: `SIM-${i}`, symbol: `S${i}`, change_percent: i }));
    useWatchlistStore.setState({ status: 'ready', watchlists: [list(1, items)] });

    render(<TopMovers />);

    const rows = within(screen.getByRole('list', { name: 'Watchlist movers' })).getAllByRole('listitem');
    expect(rows).toHaveLength(5);
    expect(rows[0]).toHaveTextContent('S6');
  });
});
