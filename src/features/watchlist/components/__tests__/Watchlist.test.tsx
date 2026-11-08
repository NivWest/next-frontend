import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import type { Watchlist as WatchlistModel, WatchlistItem } from '../../types';
import { Watchlist } from '../Watchlist';

const initialUI = useUIStore.getState();
const initialWatchlists = useWatchlistStore.getState();

const nve: WatchlistItem = {
  orderbook_id: 'SIM-NVE',
  symbol: 'NVE',
  name: 'Nordvik Energy',
  last_price: 1234.5,
  change_percent: -0.42,
  added_at: '2026-11-08T09:00:05Z',
};
const fjrd: WatchlistItem = { ...nve, orderbook_id: 'SIM-FJRD', symbol: 'FJRD', name: 'Fjord Robotics', last_price: null, change_percent: null };
const list = (id: number, name: string, items: WatchlistItem[] = []): WatchlistModel => ({ id, name, items, created_at: '' });

let addToast: Mock<(message: string, type?: 'success' | 'error' | 'info') => void>;
let fetchWatchlists: Mock<() => Promise<void>>;

/** Uses the real store actions for mutations, with the API mocked below. */
vi.mock('../../api/watchlists', () => ({
  listWatchlists: vi.fn(),
  getWatchlist: vi.fn(),
  createWatchlist: vi.fn(),
  renameWatchlist: vi.fn(),
  deleteWatchlist: vi.fn(),
  addWatchlistItem: vi.fn(),
  removeWatchlistItem: vi.fn(),
}));
import * as client from '../../api/watchlists';
const api = vi.mocked(client);

beforeEach(() => {
  vi.resetAllMocks();
  addToast = vi.fn();
  fetchWatchlists = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  useUIStore.setState({ isAuthenticated: true, addToast });
  useWatchlistStore.setState({ fetchWatchlists, status: 'ready', watchlists: [] });
});

afterEach(() => {
  // Unmount first: restoring the real store actions would otherwise re-run the components' effects.
  cleanup();
  useUIStore.setState(initialUI, true);
  useWatchlistStore.setState(initialWatchlists, true);
});

describe('Watchlist page', () => {
  it('loads the lists on mount and shows "No watchlists yet" when there are none', () => {
    render(<Watchlist />);
    expect(fetchWatchlists).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Watchlist' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No watchlists yet' })).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).toBeNull();
  });

  it('shows a loading status before the first load', () => {
    useWatchlistStore.setState({ status: 'loading' });
    render(<Watchlist />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading watchlists');
    expect(screen.queryByText('No watchlists yet')).toBeNull();
  });

  it('shows an error with a retry when loading fails', () => {
    useWatchlistStore.setState({ status: 'error' });
    render(<Watchlist />);
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load your watchlists.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(fetchWatchlists).toHaveBeenCalledTimes(2);
  });

  it('renders a tab per list and the first list selected, with real prices', () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve, fjrd]), list(2, 'Tech')] });
    render(<Watchlist />);

    const tabs = within(screen.getByRole('tablist', { name: 'Watchlists' })).getAllByRole('tab');
    expect(tabs.map((t) => t.textContent)).toEqual(['Energy', 'Tech']);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    const panel = screen.getByRole('tabpanel', { name: 'Energy' });
    const row = within(panel).getByRole('row', { name: /Nordvik Energy/ });
    expect(within(row).getByRole('link', { name: 'Nordvik Energy' })).toHaveAttribute('href', '/markets/SIM-NVE');
    expect(row).toHaveTextContent('1,234.50 SEK');
    expect(row).toHaveTextContent('-0.42%');
    // A missing quote shows a dash, never a made-up price.
    const fjrdRow = within(panel).getByRole('row', { name: /Fjord Robotics/ });
    expect(fjrdRow).toHaveTextContent('—');
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it('switches tabs by click and arrow keys', () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve]), list(2, 'Tech')] });
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('tab', { name: 'Tech' }));
    expect(screen.getByRole('tab', { name: 'Tech' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Tech' })).toHaveTextContent('This list is empty.');

    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Energy' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Energy' })).toHaveFocus();
  });

  it('removes a row with "Remove Nordvik Energy"', async () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve, fjrd])] });
    api.removeWatchlistItem.mockResolvedValue(undefined);
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Nordvik Energy' }));

    await waitFor(() => expect(screen.queryByRole('row', { name: /Nordvik Energy/ })).toBeNull());
    expect(api.removeWatchlistItem).toHaveBeenCalledWith(1, 'SIM-NVE');
    expect(screen.getByRole('row', { name: /Fjord Robotics/ })).toBeInTheDocument();
    expect(addToast).toHaveBeenCalledWith('Removed NVE from Energy', 'success');
  });

  it('keeps the row and toasts when removing fails', async () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve])] });
    api.removeWatchlistItem.mockRejectedValue(new ApiRequestError('gone', 404, 'WATCHLIST_NOT_FOUND'));
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove Nordvik Energy' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('That watchlist no longer exists.', 'error'));
    expect(screen.getByRole('row', { name: /Nordvik Energy/ })).toBeInTheDocument();
  });

  it('renames the list through the List actions menu', async () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve])] });
    api.renameWatchlist.mockResolvedValue(list(1, 'Renewables', [nve]));
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('button', { name: 'List actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Rename list' }));
    const input = screen.getByLabelText('List name');
    expect(input).toHaveValue('Energy');
    fireEvent.change(input, { target: { value: 'Renewables' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));

    expect(await screen.findByRole('tab', { name: 'Renewables' })).toBeInTheDocument();
    expect(api.renameWatchlist).toHaveBeenCalledWith(1, 'Renewables');
  });

  it('deletes the list after confirming and falls back to "No watchlists yet"', async () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve])] });
    api.deleteWatchlist.mockResolvedValue(undefined);
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('button', { name: 'List actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Delete list' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Delete Energy?' });
    fireEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('No watchlists yet')).toBeInTheDocument();
    expect(api.deleteWatchlist).toHaveBeenCalledWith(1);
  });

  it('creates a list from the empty state and selects it', async () => {
    api.createWatchlist.mockResolvedValue(list(3, 'Energy'));
    render(<Watchlist />);

    fireEvent.click(screen.getByRole('button', { name: 'Create a list' }));
    fireEvent.change(screen.getByLabelText('List name'), { target: { value: 'Energy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create list' }));

    expect(await screen.findByRole('tab', { name: 'Energy' })).toHaveAttribute('aria-selected', 'true');
    expect(api.createWatchlist).toHaveBeenCalledWith('Energy');
  });
});
