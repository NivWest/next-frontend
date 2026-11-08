import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import type { Portfolio } from '@/features/portfolio/types';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

const portfolio: Portfolio = {
  cash: 98996.5,
  reserved_cash: 0,
  buying_power: 98996.5,
  holdings_value: 1100,
  vault_value: 0,
  total_equity: 100096.5,
  unrealized_pnl: 96.5,
  realized_pnl: 0,
  positions: [
    {
      orderbook_id: 'SIM-NVE',
      symbol: 'NVE',
      name: 'Nordvik Energy',
      quantity: 10,
      avg_cost: 100.35,
      last_price: 110,
      market_value: 1100,
      unrealized_pnl: 96.5,
      unrealized_pnl_percent: 9.62,
      day_change_percent: 1.25,
      weight: 100,
      reserved_quantity: 0,
    },
  ],
  top_movers: [],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const initialState = usePortfolioStore.getState();

let fetchMock: FetchMock;

function calledUrls(): string[] {
  return fetchMock.mock.calls.map((call) => String(call[0]));
}

/** Routes /portfolio to the given response; anything else is a 404. */
function routeFetch(portfolioResponse: () => Response): void {
  fetchMock.mockImplementation(async (input) => {
    const url = String(input);
    if (url === '/api/v1/portfolio') return portfolioResponse();
    return jsonResponse({ error: 'not found' }, 404);
  });
}

beforeEach(() => {
  usePortfolioStore.setState(initialState, true);
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePortfolioStore', () => {
  it('starts idle without a portfolio', () => {
    const state = usePortfolioStore.getState();
    expect(state.portfolio).toBeNull();
    expect(state.portfolioStatus).toBe('idle');
  });

  it('loads the typed portfolio from GET /portfolio only (watchlists live in useWatchlistStore since NW-06)', async () => {
    routeFetch(() => jsonResponse(portfolio));

    await usePortfolioStore.getState().fetchPortfolio();

    const state = usePortfolioStore.getState();
    expect(state.portfolioStatus).toBe('ready');
    expect(state.portfolio).toEqual(portfolio);
    expect(calledUrls()).toEqual(['/api/v1/portfolio']);
    expect(calledUrls()).not.toContain('/api/v1/portfolio/dashboard');
  });

  it('is loading while the request is in flight', async () => {
    let resolve: (response: Response) => void = () => {};
    fetchMock.mockImplementation((input) => {
      if (String(input) === '/api/v1/portfolio') {
        return new Promise<Response>((r) => {
          resolve = r;
        });
      }
      return Promise.resolve(jsonResponse([]));
    });

    const pending = usePortfolioStore.getState().fetchPortfolio();
    expect(usePortfolioStore.getState().portfolioStatus).toBe('loading');

    resolve(jsonResponse(portfolio));
    await pending;
    expect(usePortfolioStore.getState().portfolioStatus).toBe('ready');
  });

  it('sets error and keeps the last portfolio when a refresh fails', async () => {
    usePortfolioStore.setState({ portfolio, portfolioStatus: 'ready' });
    routeFetch(() => jsonResponse({ error: 'market data unavailable' }, 502));

    await usePortfolioStore.getState().fetchPortfolio();

    const state = usePortfolioStore.getState();
    expect(state.portfolioStatus).toBe('error');
    expect(state.portfolio).toEqual(portfolio);
  });

  it('keeps an empty portfolio as ready with no positions', async () => {
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
    routeFetch(() => jsonResponse(fresh));

    await usePortfolioStore.getState().fetchPortfolio();

    expect(usePortfolioStore.getState().portfolio).toEqual(fresh);
    expect(usePortfolioStore.getState().portfolioStatus).toBe('ready');
  });
});
