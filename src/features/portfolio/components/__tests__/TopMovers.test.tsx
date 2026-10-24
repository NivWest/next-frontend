import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TopMovers } from '../TopMovers';
import { searchInstruments } from '@/features/markets/api/market';
import type { InstrumentSearchResponse, InstrumentSummary } from '@/features/markets/types';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useUIStore } from '@/store/useUIStore';

vi.mock('@/features/markets/api/market', () => ({
  searchInstruments: vi.fn<(query: string) => Promise<InstrumentSearchResponse>>(),
}));

const search = vi.mocked(searchInstruments);

const initialPortfolio = usePortfolioStore.getState();
const initialUI = useUIStore.getState();

function instrument(overrides: Partial<InstrumentSummary>): InstrumentSummary {
  return {
    orderbook_id: 'SIM-XXXX',
    symbol: 'XXXX',
    name: 'Example AB',
    currency: 'SEK',
    market: 'XSTO',
    last_price: 100,
    change_percent: 0,
    ...overrides,
  };
}

function page(...items: InstrumentSummary[]): InstrumentSearchResponse {
  return { items, next_cursor: null };
}

describe('TopMovers', () => {
  beforeEach(() => {
    search.mockReset();
  });

  afterEach(() => {
    usePortfolioStore.setState(initialPortfolio, true);
    useUIStore.setState(initialUI, true);
  });

  it('asks signed-out visitors to sign in and fetches nothing', () => {
    useUIStore.setState({ isAuthenticated: false });
    usePortfolioStore.setState({ watchlist: ['FJRD'] });

    render(<TopMovers />);

    expect(screen.getByText('Sign in to see watchlist movers.')).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it('shows the empty-watchlist state and fetches nothing', () => {
    useUIStore.setState({ isAuthenticated: true });
    usePortfolioStore.setState({ watchlist: [] });

    render(<TopMovers />);

    expect(screen.getByText('Your watchlist is empty.')).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it('lists movers sorted by change with formatted price and percent', async () => {
    useUIStore.setState({ isAuthenticated: true });
    usePortfolioStore.setState({ watchlist: ['fjrd', 'NORD', 'AAPL'] });
    search.mockImplementation(async (query) => {
      switch (query) {
        case 'fjrd':
          // The exact symbol match wins over the first hit, ignoring case.
          return page(
            instrument({ symbol: 'FJRD-B', last_price: 1, change_percent: 9 }),
            instrument({ symbol: 'FJRD', last_price: 100000, change_percent: 1.25 }),
          );
        case 'NORD':
          return page(instrument({ symbol: 'NORD', last_price: 42.5, change_percent: -0.5 }));
        case 'AAPL':
          // No exact match: falls back to the first hit.
          return page(instrument({ symbol: 'AAPL.US', currency: 'USD', last_price: 189.9, change_percent: 3 }));
        default:
          return page();
      }
    });

    render(<TopMovers />);

    await screen.findByText('NORD');
    const list = screen.getByRole('list', { name: 'Watchlist movers' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows.map((row) => row.textContent)).toEqual([
      'AAPL189.90 USD+3.00%',
      'fjrd100,000.00 SEK+1.25%',
      'NORD42.50 SEK-0.50%',
    ]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('skips a ticker whose lookup fails or finds nothing', async () => {
    useUIStore.setState({ isAuthenticated: true });
    usePortfolioStore.setState({ watchlist: ['BAD', 'NONE', 'NORD'] });
    search.mockImplementation(async (query) => {
      if (query === 'BAD') throw new Error('upstream unavailable');
      if (query === 'NONE') return page();
      return page(instrument({ symbol: 'NORD', last_price: 42.5, change_percent: -0.5 }));
    });

    render(<TopMovers />);

    await screen.findByText('NORD');
    const list = screen.getByRole('list', { name: 'Watchlist movers' });
    const rows = within(list).getAllByRole('listitem');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent('NORD');
    expect(screen.queryByText('BAD')).toBeNull();
    expect(screen.queryByText('NONE')).toBeNull();
  });
});
