import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import type { ListOrdersParams, Order, OrderPage } from '../../types';
import { Orders } from '../Orders';

const mocks = vi.hoisted(() => ({
  listOrders: vi.fn<(params?: ListOrdersParams) => Promise<OrderPage>>(),
  updateOrderNote: vi.fn<(id: number, note: string) => Promise<Order>>(),
  cancelOrder: vi.fn<(id: number) => Promise<Order>>(),
}));

vi.mock('../../api/orders', () => ({
  listOrders: (params?: ListOrdersParams) => mocks.listOrders(params),
  updateOrderNote: (id: number, note: string) => mocks.updateOrderNote(id, note),
  cancelOrder: (id: number) => mocks.cancelOrder(id),
}));

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 43,
    orderbook_id: 'SIM-NVE',
    symbol: 'NVE',
    name: 'Nordvik Energy',
    side: 'BUY',
    type: 'MARKET',
    status: 'FILLED',
    quantity: 10,
    limit_price: null,
    stop_price: null,
    fill_price: 100.1,
    commission: 2.5,
    total: 1003.5,
    reject_reason: null,
    note: '',
    created_at: '2026-10-26T09:42:00Z',
    filled_at: '2026-10-26T09:42:00Z',
    ...overrides,
  };
}

function page(items: Order[], nextCursor: string | null = null): OrderPage {
  return { items, next_cursor: nextCursor };
}

/** A promise plus its resolve, to hold a request open. */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

async function findTable(): Promise<HTMLElement> {
  return screen.findByRole('table', { name: 'Order history' });
}

function bodyRows(table: HTMLElement): HTMLElement[] {
  return within(table).getAllByRole('row').slice(1);
}

const initialState = useUIStore.getState();
let addToast: Mock<(message: string, type?: 'success' | 'error' | 'info') => void>;

describe('Orders', () => {
  beforeEach(() => {
    mocks.listOrders.mockReset();
    mocks.updateOrderNote.mockReset();
    mocks.cancelOrder.mockReset();
    addToast = vi.fn();
    useUIStore.setState({ ...initialState, addToast });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    useUIStore.setState(initialState, true);
    vi.restoreAllMocks();
  });

  it('shows a loading status, then the Order history table with the columns in order', async () => {
    mocks.listOrders.mockResolvedValue(page([order()]));
    render(<Orders />);

    expect(screen.getByRole('heading', { level: 1, name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading orders…');

    const table = await findTable();
    const headers = within(table).getAllByRole('columnheader');
    expect(headers.map((h) => h.textContent)).toEqual([
      'Instrument',
      'Side',
      'Qty',
      'Price',
      'Commission',
      'Total',
      'Status',
      'Time',
    ]);
    headers.forEach((h) => expect(h).toHaveAttribute('scope', 'col'));
    expect(mocks.listOrders).toHaveBeenCalledTimes(1);
    expect(mocks.listOrders).toHaveBeenCalledWith({ limit: 20 });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders an order row with an instrument link, labels and formatted values', async () => {
    mocks.listOrders.mockResolvedValue(page([order({ side: 'SELL', quantity: 2.5 })]));
    render(<Orders />);

    const table = await findTable();
    const [row] = bodyRows(table);
    const link = within(row).getByRole('link', { name: 'Nordvik Energy' });
    expect(link).toHaveAttribute('href', '/markets/SIM-NVE');

    const cells = within(row).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('NVE');
    expect(cells[1]).toHaveTextContent('Sell');
    expect(cells[1]).toHaveClass('text-red-500');
    expect(cells[2]).toHaveTextContent('2.5');
    expect(cells[3]).toHaveTextContent('100.10 SEK');
    expect(cells[4]).toHaveTextContent('2.50 SEK');
    expect(cells[5]).toHaveTextContent('1,003.50 SEK');
    expect(cells[6]).toHaveTextContent('Filled');
    const time = cells[7].querySelector('time');
    expect(time).toHaveAttribute('dateTime', '2026-10-26T09:42:00Z');
    expect(time?.textContent).not.toBe('');
  });

  it('colours Buy green', async () => {
    mocks.listOrders.mockResolvedValue(page([order({ side: 'BUY' })]));
    render(<Orders />);

    const [row] = bodyRows(await findTable());
    const side = within(row).getByText('Buy');
    expect(side).toHaveClass('text-green-500');
  });

  it('shows the empty state with a link to the markets when there are no orders', async () => {
    mocks.listOrders.mockResolvedValue(page([]));
    render(<Orders />);

    expect(await screen.findByText('No orders yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse markets' })).toHaveAttribute('href', '/markets');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('hides Load more when the first page is the last one', async () => {
    mocks.listOrders.mockResolvedValue(page([order()], null));
    render(<Orders />);

    await findTable();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('Load more appends the next page and disappears on the last page', async () => {
    const second = deferred<OrderPage>();
    mocks.listOrders
      .mockResolvedValueOnce(page([order({ id: 3, name: 'Nordvik Energy' })], 'cursor-1'))
      .mockReturnValueOnce(second.promise)
      .mockResolvedValueOnce(page([order({ id: 1, orderbook_id: 'SIM-FJRD', symbol: 'FJRD', name: 'Fjord Robotics' })]));
    render(<Orders />);

    const table = await findTable();
    expect(bodyRows(table)).toHaveLength(1);

    const button = screen.getByRole('button', { name: 'Load more' });
    expect(button).toBeEnabled();
    fireEvent.click(button);

    expect(mocks.listOrders).toHaveBeenLastCalledWith({ limit: 20, cursor: 'cursor-1' });
    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Load more' })).toHaveAttribute('aria-busy', 'true');

    second.resolve(page([order({ id: 2, orderbook_id: 'SIM-AUR', symbol: 'AUR', name: 'Aurora Bank' })], 'cursor-2'));

    await waitFor(() => expect(bodyRows(table)).toHaveLength(2));
    expect(within(bodyRows(table)[0]).getByRole('link')).toHaveTextContent('Nordvik Energy');
    expect(within(bodyRows(table)[1]).getByRole('link')).toHaveTextContent('Aurora Bank');
    const again = screen.getByRole('button', { name: 'Load more' });
    expect(again).toBeEnabled();
    expect(again).toHaveAttribute('aria-busy', 'false');

    fireEvent.click(again);
    expect(mocks.listOrders).toHaveBeenLastCalledWith({ limit: 20, cursor: 'cursor-2' });

    await waitFor(() => expect(bodyRows(table)).toHaveLength(3));
    expect(within(bodyRows(table)[2]).getByRole('link', { name: 'Fjord Robotics' })).toHaveAttribute(
      'href',
      '/markets/SIM-FJRD',
    );
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    expect(mocks.listOrders).toHaveBeenCalledTimes(3);
  });

  it('keeps the loaded rows and Load more when a further page fails', async () => {
    mocks.listOrders
      .mockResolvedValueOnce(page([order()], 'cursor-1'))
      .mockRejectedValueOnce(new ApiRequestError('boom', 500, null));
    render(<Orders />);

    const table = await findTable();
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load more orders');
    expect(bodyRows(table)).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Load more' })).toBeEnabled();
  });

  it('shows an error with Retry, and Retry loads the first page again', async () => {
    mocks.listOrders
      .mockRejectedValueOnce(new ApiRequestError('Internal error', 500, null))
      .mockResolvedValueOnce(page([order()]));
    render(<Orders />);

    const alert = await screen.findByRole('alert');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    fireEvent.click(within(alert).getByRole('button', { name: 'Retry' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading orders…');
    const table = await findTable();
    expect(bodyRows(table)).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.listOrders).toHaveBeenCalledTimes(2);
    expect(mocks.listOrders).toHaveBeenLastCalledWith({ limit: 20 });
  });

  it('displays an order note and supports inline note editing', async () => {
    const initial = order({ id: 43, note: 'Initial thesis' });
    mocks.listOrders.mockResolvedValue(page([initial]));
    mocks.updateOrderNote.mockResolvedValue({ ...initial, note: 'Updated thesis' });
    render(<Orders />);

    const table = await findTable();
    const [row] = bodyRows(table);
    expect(row).toHaveAttribute('id', 'order-43');
    expect(within(row).getByText('Initial thesis')).toBeInTheDocument();

    fireEvent.click(within(row).getByRole('button', { name: 'Edit note for order 43' }));
    const input = within(row).getByLabelText('Note for order 43');
    expect(input).toHaveValue('Initial thesis');

    fireEvent.change(input, { target: { value: 'Updated thesis' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Save note' }));

    await waitFor(() => expect(mocks.updateOrderNote).toHaveBeenCalledWith(43, 'Updated thesis'));
    expect(await within(row).findByText('Updated thesis')).toBeInTheDocument();
  });

  it('renders Open and History tabs and switches between them', async () => {
    mocks.listOrders.mockImplementation(async (params) => {
      if (params?.status?.includes('OPEN')) {
        return page([order({ id: 99, type: 'LIMIT', status: 'OPEN', limit_price: 95, fill_price: null, commission: null, total: null })]);
      }
      return page([order()]);
    });

    render(<Orders />);
    await findTable();

    // Default tab is History
    const historyTab = screen.getByRole('tab', { name: 'History' });
    const openTab = screen.getByRole('tab', { name: 'Open' });
    expect(historyTab).toHaveAttribute('aria-selected', 'true');
    expect(openTab).toHaveAttribute('aria-selected', 'false');

    // Switch to Open tab
    fireEvent.click(openTab);
    expect(openTab).toHaveAttribute('aria-selected', 'true');
    expect(historyTab).toHaveAttribute('aria-selected', 'false');

    const openTable = await screen.findByRole('table', { name: 'Open orders' });
    expect(openTable).toBeInTheDocument();
    expect(within(openTable).getByText('Limit')).toBeInTheDocument();
    expect(within(openTable).getByText('95.00 SEK')).toBeInTheDocument();
    expect(within(openTable).getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // Switch back to History
    fireEvent.click(historyTab);
    expect(await findTable()).toBeInTheDocument();
  });

  it('AC7: Open tab displays "Cancel" button, clicking it calls cancelOrder and moves order to History with status Cancelled', async () => {
    const openOrder = order({
      id: 55,
      type: 'LIMIT',
      status: 'OPEN',
      limit_price: 95,
      fill_price: null,
      commission: null,
      total: null,
    });
    const cancelledOrder = order({
      id: 55,
      type: 'LIMIT',
      status: 'CANCELLED',
      limit_price: 95,
      fill_price: null,
      commission: null,
      total: null,
    });

    mocks.listOrders.mockImplementation(async (params) => {
      if (params?.status?.includes('OPEN')) {
        return page([openOrder]);
      }
      return page([cancelledOrder]);
    });
    mocks.cancelOrder.mockResolvedValue(cancelledOrder);

    render(<Orders />);
    await findTable();

    // Go to Open tab
    fireEvent.click(screen.getByRole('tab', { name: 'Open' }));
    const openTable = await screen.findByRole('table', { name: 'Open orders' });
    const cancelBtn = within(openTable).getByRole('button', { name: 'Cancel' });

    // Click Cancel
    fireEvent.click(cancelBtn);

    await waitFor(() => expect(mocks.cancelOrder).toHaveBeenCalledWith(55));
    expect(addToast).toHaveBeenCalledWith('Order cancelled', 'success');

    // Automatically moved to History tab with Cancelled status
    const historyTab = screen.getByRole('tab', { name: 'History' });
    expect(historyTab).toHaveAttribute('aria-selected', 'true');
    const historyTable = await findTable();
    expect(within(historyTable).getByText('Cancelled')).toBeInTheDocument();
  });

  it('polls open orders every 3 seconds while Open tab is visible', async () => {
    vi.useFakeTimers();
    mocks.listOrders.mockImplementation(async (params) => {
      if (params?.status?.includes('OPEN')) {
        return page([order({ id: 10, status: 'OPEN' })]);
      }
      return page([]);
    });

    const { unmount } = render(<Orders />);
    await act(async () => {});

    // Switch to Open tab
    fireEvent.click(screen.getByRole('tab', { name: 'Open' }));
    await act(async () => {});

    // Initial open orders fetch
    expect(mocks.listOrders).toHaveBeenCalledWith({ limit: 20, status: ['OPEN'] });
    const initialCalls = mocks.listOrders.mock.calls.length;

    // Advance 3s
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3_000);
    });
    expect(mocks.listOrders.mock.calls.length).toBe(initialCalls + 1);

    // Switch to History tab (should stop polling open orders)
    fireEvent.click(screen.getByRole('tab', { name: 'History' }));
    await act(async () => {});
    const historyCalls = mocks.listOrders.mock.calls.length;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });
    // No additional open polls
    expect(mocks.listOrders.mock.calls.length).toBe(historyCalls);

    unmount();
  });
});
