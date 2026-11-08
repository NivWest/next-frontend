import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import type { Watchlist, WatchlistItem } from '../../types';
import { AddToWatchlistMenu, NEW_LIST_LABEL } from '../AddToWatchlistMenu';

const initialUI = useUIStore.getState();
const initialWatchlists = useWatchlistStore.getState();

const nve: WatchlistItem = {
  orderbook_id: 'SIM-NVE',
  symbol: 'NVE',
  name: 'Nordvik Energy',
  last_price: 100,
  change_percent: 0,
  added_at: '2026-11-08T09:00:05Z',
};
const list = (id: number, name: string, items: WatchlistItem[] = []): Watchlist => ({ id, name, items, created_at: '' });

let addToast: Mock<(message: string, type?: 'success' | 'error' | 'info') => void>;
let fetchWatchlists: Mock<() => Promise<void>>;
let createWatchlist: Mock<(name: string) => Promise<Watchlist>>;
let addItem: Mock<(watchlistId: number, orderbookId: string) => Promise<WatchlistItem>>;

function renderMenu() {
  return render(<AddToWatchlistMenu orderbookId="SIM-NVE" symbol="NVE" />);
}

beforeEach(() => {
  addToast = vi.fn();
  fetchWatchlists = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
  createWatchlist = vi.fn<(name: string) => Promise<Watchlist>>();
  addItem = vi.fn<(watchlistId: number, orderbookId: string) => Promise<WatchlistItem>>().mockResolvedValue(nve);
  useUIStore.setState({ isAuthenticated: true, addToast });
  useWatchlistStore.setState({ watchlists: [], status: 'ready', fetchWatchlists, createWatchlist, addItem });
});

afterEach(() => {
  // Unmount first: restoring the real store actions would otherwise re-run the components' effects.
  cleanup();
  useUIStore.setState(initialUI, true);
  useWatchlistStore.setState(initialWatchlists, true);
});

describe('AddToWatchlistMenu', () => {
  it('signed out, links to sign-in and returns to the instrument', () => {
    useUIStore.setState({ isAuthenticated: false });
    renderMenu();
    expect(screen.getByRole('link', { name: 'Sign in to add to watchlist' })).toHaveAttribute(
      'href',
      '/login?next=%2Fmarkets%2FSIM-NVE',
    );
    expect(screen.queryByRole('button', { name: 'Add to watchlist' })).toBeNull();
  });

  it('opens a menu of the lists plus "New list…" and refreshes the lists', () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve]), list(2, 'Tech')] });
    renderMenu();

    const trigger = screen.getByRole('button', { name: 'Add to watchlist' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(fetchWatchlists).toHaveBeenCalledTimes(1);
    const menu = screen.getByRole('menu', { name: 'Add to watchlist' });
    const items = within(menu).getAllByRole('menuitem');
    expect(items.map((i) => i.textContent)).toEqual(['Energy(added)', 'Tech', NEW_LIST_LABEL]);
    expect(NEW_LIST_LABEL).toBe('New list…');
    expect(items[0]).toHaveFocus();
  });

  it('adds to an existing list and toasts "Added NVE to Tech"', async () => {
    useWatchlistStore.setState({ watchlists: [list(2, 'Tech')] });
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Tech' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Added NVE to Tech', 'success'));
    expect(addItem).toHaveBeenCalledWith(2, 'SIM-NVE');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('reports a duplicate as already in the list', async () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy', [nve])] });
    addItem.mockRejectedValue(new ApiRequestError('dup', 409, 'CONFLICT'));
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Energy/ }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('NVE is already in Energy', 'info'));
  });

  it('"New list…" creates the list, adds the instrument and toasts "Added NVE to Energy"', async () => {
    createWatchlist.mockResolvedValue(list(5, 'Energy'));
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    fireEvent.click(screen.getByRole('menuitem', { name: NEW_LIST_LABEL }));

    const input = screen.getByLabelText('List name');
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: '  Energy ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create and add' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Added NVE to Energy', 'success'));
    expect(createWatchlist).toHaveBeenCalledWith('Energy');
    expect(addItem).toHaveBeenCalledWith(5, 'SIM-NVE');
    expect(screen.queryByLabelText('List name')).toBeNull();
  });

  it('validates the name inline before calling the API', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    fireEvent.click(screen.getByRole('menuitem', { name: NEW_LIST_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: 'Create and add' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a name for the list.');
    fireEvent.change(screen.getByLabelText('List name'), { target: { value: 'x'.repeat(51) } });
    fireEvent.click(screen.getByRole('button', { name: 'Create and add' }));
    expect(screen.getByRole('alert')).toHaveTextContent('List names can be at most 50 characters.');
    expect(createWatchlist).not.toHaveBeenCalled();
  });

  it('shows the limit error inline and keeps the form open', async () => {
    createWatchlist.mockRejectedValue(new ApiRequestError('limit', 422, 'WATCHLIST_LIMIT_REACHED'));
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    fireEvent.click(screen.getByRole('menuitem', { name: NEW_LIST_LABEL }));
    fireEvent.change(screen.getByLabelText('List name'), { target: { value: 'Eleventh' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create and add' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You can have at most 10 watchlists.');
    expect(screen.getByLabelText('List name')).toBeInTheDocument();
    expect(addItem).not.toHaveBeenCalled();
  });

  it('closes on Escape and on an outside click, returning focus to the trigger', () => {
    render(
      <div>
        <AddToWatchlistMenu orderbookId="SIM-NVE" symbol="NVE" />
        <p>outside</p>
      </div>,
    );
    const trigger = screen.getByRole('button', { name: 'Add to watchlist' });
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.mouseDown(screen.getByText('outside'));
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('moves focus with the arrow keys', () => {
    useWatchlistStore.setState({ watchlists: [list(1, 'Energy')] });
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: NEW_LIST_LABEL })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Energy' })).toHaveFocus();
  });

  it('keeps the popover above the fixed cookie banner (z-40) and below toasts (z-50)', () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Add to watchlist' }));
    const popover = screen.getByRole('menu').parentElement;
    expect(popover?.className).toContain('z-[45]');
  });
});
