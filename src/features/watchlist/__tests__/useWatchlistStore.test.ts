import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore, type UserProfile } from '@/store/useUIStore';
import * as client from '../api/watchlists';
import { useWatchlistStore } from '../store/useWatchlistStore';
import type { Watchlist, WatchlistItem } from '../types';

vi.mock('../api/watchlists', () => ({
  listWatchlists: vi.fn(),
  getWatchlist: vi.fn(),
  createWatchlist: vi.fn(),
  renameWatchlist: vi.fn(),
  deleteWatchlist: vi.fn(),
  addWatchlistItem: vi.fn(),
  removeWatchlistItem: vi.fn(),
}));

const api = vi.mocked(client);
const initial = useWatchlistStore.getState();
const initialUI = useUIStore.getState();

const nve: WatchlistItem = {
  orderbook_id: 'SIM-NVE',
  symbol: 'NVE',
  name: 'Nordvik Energy',
  last_price: 100,
  change_percent: -0.42,
  added_at: '2026-11-08T09:00:05Z',
};
const energy: Watchlist = { id: 1, name: 'Energy', items: [nve], created_at: '2026-11-08T09:00:00Z' };
const tech: Watchlist = { id: 2, name: 'Tech', items: [], created_at: '2026-11-08T09:01:00Z' };

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  useUIStore.setState(initialUI, true);
  useWatchlistStore.setState(initial, true);
});

describe('useWatchlistStore', () => {
  it('fetchWatchlists loads the lists and marks the store ready', async () => {
    api.listWatchlists.mockResolvedValue([energy, tech]);
    const pending = useWatchlistStore.getState().fetchWatchlists();
    expect(useWatchlistStore.getState().status).toBe('loading');
    await pending;
    expect(useWatchlistStore.getState()).toMatchObject({ status: 'ready', watchlists: [energy, tech] });
  });

  it('fetchWatchlists keeps the last good lists and reports an error on failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useWatchlistStore.setState({ watchlists: [energy], status: 'ready' });
    api.listWatchlists.mockRejectedValue(new Error('down'));
    await useWatchlistStore.getState().fetchWatchlists();
    expect(useWatchlistStore.getState()).toMatchObject({ status: 'error', watchlists: [energy] });
  });

  it('createWatchlist trims, appends the new list and returns it', async () => {
    useWatchlistStore.setState({ watchlists: [energy] });
    api.createWatchlist.mockResolvedValue(tech);
    await expect(useWatchlistStore.getState().createWatchlist('  Tech ')).resolves.toEqual(tech);
    expect(api.createWatchlist).toHaveBeenCalledWith('Tech');
    expect(useWatchlistStore.getState().watchlists).toEqual([energy, tech]);
  });

  it('createWatchlist rejects and leaves the lists alone on 422', async () => {
    useWatchlistStore.setState({ watchlists: [energy] });
    api.createWatchlist.mockRejectedValue(new ApiRequestError('limit', 422, 'WATCHLIST_LIMIT_REACHED'));
    await expect(useWatchlistStore.getState().createWatchlist('Eleventh')).rejects.toMatchObject({ code: 'WATCHLIST_LIMIT_REACHED' });
    expect(useWatchlistStore.getState().watchlists).toEqual([energy]);
  });

  it('renameWatchlist replaces the list in place', async () => {
    useWatchlistStore.setState({ watchlists: [energy, tech] });
    api.renameWatchlist.mockResolvedValue({ ...energy, name: 'Renewables' });
    await useWatchlistStore.getState().renameWatchlist(1, 'Renewables');
    expect(useWatchlistStore.getState().watchlists.map((l) => l.name)).toEqual(['Renewables', 'Tech']);
  });

  it('deleteWatchlist drops the list', async () => {
    useWatchlistStore.setState({ watchlists: [energy, tech] });
    api.deleteWatchlist.mockResolvedValue(undefined);
    await useWatchlistStore.getState().deleteWatchlist(1);
    expect(useWatchlistStore.getState().watchlists).toEqual([tech]);
  });

  it('addItem appends the returned item to that list only', async () => {
    useWatchlistStore.setState({ watchlists: [energy, tech] });
    api.addWatchlistItem.mockResolvedValue(nve);
    await useWatchlistStore.getState().addItem(2, 'SIM-NVE');
    expect(api.addWatchlistItem).toHaveBeenCalledWith(2, 'SIM-NVE');
    const [first, second] = useWatchlistStore.getState().watchlists;
    expect(first.items).toEqual([nve]);
    expect(second.items).toEqual([nve]);
  });

  it('addItem rejects on a duplicate and changes nothing', async () => {
    useWatchlistStore.setState({ watchlists: [energy] });
    api.addWatchlistItem.mockRejectedValue(new ApiRequestError('dup', 409, 'CONFLICT'));
    await expect(useWatchlistStore.getState().addItem(1, 'SIM-NVE')).rejects.toBeInstanceOf(ApiRequestError);
    expect(useWatchlistStore.getState().watchlists).toEqual([energy]);
  });

  it('removeItem drops the item from that list', async () => {
    useWatchlistStore.setState({ watchlists: [energy] });
    api.removeWatchlistItem.mockResolvedValue(undefined);
    await useWatchlistStore.getState().removeItem(1, 'SIM-NVE');
    expect(useWatchlistStore.getState().watchlists[0].items).toEqual([]);
  });

  it('reset clears everything', () => {
    useWatchlistStore.setState({ watchlists: [energy], status: 'ready' });
    useWatchlistStore.getState().reset();
    expect(useWatchlistStore.getState()).toMatchObject({ watchlists: [], status: 'idle' });
  });

  it('forgets the lists when the signed-in user changes', () => {
    const user: UserProfile = { id: 1, name: 'Guest trader', email: 'g@guest.invalid', role: 'guest', balance: 100000, is_guest: true, leaderboard_opt_in: false };
    useUIStore.setState({ user });
    useWatchlistStore.setState({ watchlists: [energy], status: 'ready' });
    useUIStore.setState({ user: { ...user } }); // same user: kept
    expect(useWatchlistStore.getState().watchlists).toEqual([energy]);
    useUIStore.setState({ user: null }); // signed out
    expect(useWatchlistStore.getState()).toMatchObject({ watchlists: [], status: 'idle' });
  });
});
