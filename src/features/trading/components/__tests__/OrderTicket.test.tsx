import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import type { UserProfile } from '@/features/auth/types';
import type { Quote } from '@/features/markets/types';
import { ApiRequestError } from '@/lib/api';
import { useUIStore } from '@/store/useUIStore';
import type { Order, OrderRequest } from '../../types';
import { OrderTicket } from '../OrderTicket';

const mocks = vi.hoisted(() => ({
  getQuote: vi.fn<(orderbookId: string) => Promise<Quote>>(),
  placeOrder: vi.fn<(request: OrderRequest, idempotencyKey: string) => Promise<Order>>(),
  newIdempotencyKey: vi.fn<() => string>(),
}));

vi.mock('@/features/markets/api/market', () => ({
  getQuote: (orderbookId: string) => mocks.getQuote(orderbookId),
}));

vi.mock('@/features/trading/api/orders', () => ({
  IDEMPOTENCY_KEY_HEADER: 'Idempotency-Key',
  placeOrder: (request: OrderRequest, idempotencyKey: string) => mocks.placeOrder(request, idempotencyKey),
  newIdempotencyKey: () => mocks.newIdempotencyKey(),
}));

/** Simulated SIM-FJRD pinned at 100: bid 99.90 / ask 100.10. */
function pinnedQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    orderbook_id: 'SIM-FJRD',
    symbol: 'FJRD',
    last: 100,
    bid: 99.9,
    ask: 100.1,
    change_percent: 0,
    currency: 'SEK',
    updated_at: '2026-10-25T12:00:00Z',
    ...overrides,
  };
}

function filledOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    orderbook_id: 'SIM-FJRD',
    symbol: 'FJRD',
    name: 'Fjord Robotics',
    side: 'BUY',
    type: 'MARKET',
    status: 'FILLED',
    quantity: 10,
    fill_price: 100.1,
    commission: 2.5,
    total: 1003.5,
    created_at: '2026-10-25T12:00:00Z',
    filled_at: '2026-10-25T12:00:00Z',
    ...overrides,
  };
}

const trader: UserProfile = {
  id: 7,
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'member',
  balance: 100000,
  is_guest: false,
};

const initialState = useUIStore.getState();

let addToast: Mock<(message: string, type?: 'success' | 'error' | 'info') => void>;
let checkAuth: Mock<() => Promise<void>>;

function signIn(balance = trader.balance) {
  useUIStore.setState({ isAuthenticated: true, user: { ...trader, balance } });
}

/** The <dd> next to the <dt> with this label. */
function previewValue(label: string): string | null {
  const term = screen.getByText(label, { selector: 'dt' });
  return term.nextElementSibling?.textContent ?? null;
}

function enterQuantity(value: string) {
  fireEvent.change(screen.getByLabelText('Quantity'), { target: { value } });
}

describe('OrderTicket', () => {
  beforeEach(() => {
    mocks.getQuote.mockReset().mockResolvedValue(pinnedQuote());
    mocks.placeOrder.mockReset().mockResolvedValue(filledOrder());
    mocks.newIdempotencyKey.mockReset().mockReturnValue('key-1');
    addToast = vi.fn<(message: string, type?: 'success' | 'error' | 'info') => void>();
    checkAuth = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    useUIStore.setState({ ...initialState, isAuthenticated: false, user: null, addToast, checkAuth });
  });

  afterEach(() => {
    vi.useRealTimers();
    useUIStore.setState(initialState, true);
  });

  it('renders the ticket with Buy selected, an empty quantity and dashes', async () => {
    signIn();
    render(<OrderTicket orderbookId="SIM-FJRD" />);

    const ticket = screen.getByRole('region', { name: 'Order ticket' });
    expect(within(ticket).getByRole('heading', { level: 2, name: 'Order ticket' })).toBeInTheDocument();
    const sides = within(ticket).getByRole('group', { name: 'Order side' });
    expect(within(sides).getByRole('button', { name: 'Buy' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sides).getByRole('button', { name: 'Sell' })).toHaveAttribute('aria-pressed', 'false');

    const quantity = within(ticket).getByLabelText('Quantity');
    expect(quantity).toHaveAttribute('type', 'number');
    expect(quantity).toHaveAttribute('min', '1');
    expect(quantity).toHaveAttribute('step', '1');
    expect(quantity).toHaveAttribute('inputmode', 'numeric');
    expect(quantity).toHaveValue(null);

    expect(await screen.findByRole('button', { name: 'Buy FJRD' })).toBeDisabled();
    expect(previewValue('Price')).toBe('—');
    expect(previewValue('Commission')).toBe('—');
    expect(previewValue('Total')).toBe('—');
    expect(previewValue('Cash available')).toBe('100,000.00 SEK');
    expect(ticket.textContent).not.toContain('$');
  });

  it('AC6: previews Buy 10 at the pinned quote', async () => {
    signIn();
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });

    enterQuantity('10');

    expect(previewValue('Price')).toBe('100.10 SEK');
    expect(previewValue('Commission')).toBe('2.50 SEK');
    expect(previewValue('Total')).toBe('1,003.50 SEK');
    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled();
  });

  it('switches to Sell and prices at the bid', async () => {
    signIn();
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });

    fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
    enterQuantity('4');

    expect(screen.getByRole('button', { name: 'Sell' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Buy' })).toHaveAttribute('aria-pressed', 'false');
    expect(previewValue('Price')).toBe('99.90 SEK');
    expect(previewValue('Commission')).toBe('1.00 SEK');
    expect(previewValue('Total')).toBe('398.60 SEK');
    expect(screen.getByRole('button', { name: 'Sell FJRD' })).toBeEnabled();
  });

  it.each(['0', '-3', '2.5'])('shows dashes and disables submit for quantity %s', async (value) => {
    signIn();
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });

    enterQuantity(value);

    expect(previewValue('Total')).toBe('—');
    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeDisabled();
  });

  it('falls back to the orderbook id before the quote loads', () => {
    signIn();
    mocks.getQuote.mockReturnValue(new Promise<Quote>(() => {}));
    render(<OrderTicket orderbookId="SIM-FJRD" />);

    enterQuantity('10');

    expect(screen.getByRole('button', { name: 'Buy SIM-FJRD' })).toBeDisabled();
    expect(previewValue('Price')).toBe('—');
  });

  it('places the order with a fresh idempotency key, toasts the fill and refreshes the balance', async () => {
    signIn();
    checkAuth.mockImplementation(async () => {
      useUIStore.setState({ user: { ...trader, balance: 98996.5 } });
    });
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Bought 10 FJRD @ 100.10', 'success'));
    expect(mocks.placeOrder).toHaveBeenCalledWith({ orderbook_id: 'SIM-FJRD', side: 'BUY', quantity: 10 }, 'key-1');
    expect(checkAuth).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(previewValue('Cash available')).toBe('98,996.50 SEK'));
    expect(screen.getByLabelText('Quantity')).toHaveValue(10);
    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('toasts a sell fill with the bid price', async () => {
    signIn();
    mocks.placeOrder.mockResolvedValue(filledOrder({ side: 'SELL', quantity: 4, fill_price: 99.9 }));
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
    enterQuantity('4');

    fireEvent.click(screen.getByRole('button', { name: 'Sell FJRD' }));

    await waitFor(() => expect(addToast).toHaveBeenCalledWith('Sold 4 FJRD @ 99.90', 'success'));
    expect(mocks.placeOrder).toHaveBeenCalledWith({ orderbook_id: 'SIM-FJRD', side: 'SELL', quantity: 4 }, 'key-1');
  });

  it('uses a new idempotency key for every submit', async () => {
    signIn();
    mocks.newIdempotencyKey.mockReturnValueOnce('key-1').mockReturnValueOnce('key-2');
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    await waitFor(() => expect(checkAuth).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    await waitFor(() => expect(checkAuth).toHaveBeenCalledTimes(2));

    expect(mocks.placeOrder.mock.calls.map(([, key]) => key)).toEqual(['key-1', 'key-2']);
  });

  it('disables the submit button and marks it busy while the order is pending', async () => {
    signIn();
    let resolveOrder: (order: Order) => void = () => {};
    mocks.placeOrder.mockReturnValue(
      new Promise<Order>((resolve) => {
        resolveOrder = resolve;
      }),
    );
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));

    const submit = screen.getByRole('button', { name: 'Buy FJRD' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
    fireEvent.click(submit);
    expect(mocks.placeOrder).toHaveBeenCalledTimes(1);

    await act(async () => resolveOrder(filledOrder()));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy FJRD' })).toHaveAttribute('aria-busy', 'false'));
  });

  it.each([
    [422, 'INSUFFICIENT_FUNDS', 'Not enough cash for this order.'],
    [422, 'INSUFFICIENT_SHARES', "You don't own enough shares to sell."],
    [400, 'VALIDATION_ERROR', 'Enter a whole number of shares greater than 0.'],
    [404, 'INSTRUMENT_NOT_FOUND', "This instrument can't be traded."],
    [503, 'MARKET_DATA_UNAVAILABLE', 'Prices are unavailable right now. Please try again shortly.'],
    [409, 'CONFLICT', 'This order was already submitted.'],
    [500, 'INTERNAL_ERROR', 'The order could not be placed. Please try again.'],
    [500, null, 'The order could not be placed. Please try again.'],
    [422, 'toString', 'The order could not be placed. Please try again.'],
  ])('shows %i %s as "%s" inline and as an error toast', async (status, code, message) => {
    signIn();
    mocks.placeOrder.mockRejectedValue(new ApiRequestError('backend text', status, code));
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));

    const ticket = screen.getByRole('region', { name: 'Order ticket' });
    expect(await within(ticket).findByRole('alert')).toHaveTextContent(message);
    expect(addToast).toHaveBeenCalledWith(message, 'error');
    expect(checkAuth).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled();
  });

  it('shows the generic message for non-API errors', async () => {
    signIn();
    mocks.placeOrder.mockRejectedValue(new TypeError('Failed to fetch'));
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The order could not be placed. Please try again.');
  });

  it('clears the inline error on the next edit', async () => {
    signIn();
    mocks.placeOrder.mockRejectedValue(new ApiRequestError('insufficient funds', 422, 'INSUFFICIENT_FUNDS'));
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');
    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    await screen.findByRole('alert');

    enterQuantity('5');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    await screen.findByRole('alert');
    fireEvent.click(screen.getByRole('button', { name: 'Sell' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('clears the inline error when submitting again', async () => {
    signIn();
    mocks.placeOrder.mockRejectedValueOnce(new ApiRequestError('insufficient funds', 422, 'INSUFFICIENT_FUNDS'));
    let resolveOrder: (order: Order) => void = () => {};
    mocks.placeOrder.mockReturnValueOnce(
      new Promise<Order>((resolve) => {
        resolveOrder = resolve;
      }),
    );
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });
    enterQuantity('10');
    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    await screen.findByRole('alert');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled());

    fireEvent.click(screen.getByRole('button', { name: 'Buy FJRD' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => resolveOrder(filledOrder()));
  });

  it('signed out: previews but links to sign in instead of submitting', async () => {
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await waitFor(() => expect(mocks.getQuote).toHaveBeenCalled());
    await act(async () => {});

    enterQuantity('10');

    expect(previewValue('Total')).toBe('1,003.50 SEK');
    expect(screen.getByRole('link', { name: 'Sign in to trade' })).toHaveAttribute(
      'href',
      '/login?next=%2Fmarkets%2FSIM-FJRD',
    );
    expect(screen.queryByRole('button', { name: /^Buy / })).not.toBeInTheDocument();
    expect(screen.queryByText('Cash available')).not.toBeInTheDocument();
  });

  it('refreshes the quote every 5 seconds and stops after unmount', async () => {
    vi.useFakeTimers();
    signIn();
    mocks.getQuote.mockResolvedValueOnce(pinnedQuote()).mockResolvedValue(pinnedQuote({ bid: 109.9, ask: 110.1 }));
    const { unmount } = render(<OrderTicket orderbookId="SIM-FJRD" />);
    await act(async () => {});
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });
    expect(previewValue('Price')).toBe('100.10 SEK');
    expect(mocks.getQuote).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4_999);
    });
    expect(mocks.getQuote).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(mocks.getQuote).toHaveBeenCalledTimes(2);
    expect(previewValue('Price')).toBe('110.10 SEK');

    unmount();
    await vi.advanceTimersByTimeAsync(20_000);
    expect(mocks.getQuote).toHaveBeenCalledTimes(2);
  });

  it('keeps the last quote when a refresh fails', async () => {
    vi.useFakeTimers();
    signIn();
    mocks.getQuote.mockResolvedValueOnce(pinnedQuote()).mockRejectedValue(new Error('boom'));
    render(<OrderTicket orderbookId="SIM-FJRD" />);
    await act(async () => {});
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });

    expect(mocks.getQuote).toHaveBeenCalledTimes(2);
    expect(previewValue('Price')).toBe('100.10 SEK');
    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeEnabled();
  });

  it('ignores a late quote for a previous orderbook id', async () => {
    signIn();
    let resolveOld: (quote: Quote) => void = () => {};
    mocks.getQuote.mockImplementation((id) =>
      id === 'SIM-OLD'
        ? new Promise<Quote>((resolve) => {
            resolveOld = resolve;
          })
        : Promise.resolve(pinnedQuote()),
    );
    const { rerender } = render(<OrderTicket orderbookId="SIM-OLD" />);
    rerender(<OrderTicket orderbookId="SIM-FJRD" />);
    await screen.findByRole('button', { name: 'Buy FJRD' });

    await act(async () => resolveOld(pinnedQuote({ orderbook_id: 'SIM-OLD', symbol: 'OLD', ask: 50, bid: 49 })));
    enterQuantity('10');

    expect(screen.getByRole('button', { name: 'Buy FJRD' })).toBeInTheDocument();
    expect(previewValue('Price')).toBe('100.10 SEK');
  });
});
