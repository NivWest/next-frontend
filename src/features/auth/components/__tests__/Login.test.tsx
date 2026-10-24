import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { Login } from '../Login';
import { useUIStore } from '@/store/useUIStore';

const initialState = useUIStore.getState();

let loginAsGuest: Mock<() => Promise<void>>;

describe('Login', () => {
  beforeEach(() => {
    loginAsGuest = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    useUIStore.setState({ loginAsGuest });
  });

  afterEach(() => {
    useUIStore.setState(initialState, true);
  });

  it('offers a "Try the demo" button that needs no account', () => {
    render(<Login />);

    const button = screen.getByRole('button', { name: 'Try the demo' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button.closest('a')).toBeNull();
    expect(screen.getByText(/demo needs no account/i)).toBeInTheDocument();
  });

  it('starts a guest session when "Try the demo" is clicked', async () => {
    render(<Login />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Try the demo' }));
    });

    expect(loginAsGuest).toHaveBeenCalledTimes(1);
  });

  it('keeps its name while pending and shows a busy, disabled state', async () => {
    let finish: () => void = () => {};
    loginAsGuest.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    render(<Login />);
    const button = screen.getByRole('button', { name: 'Try the demo' });

    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Try the demo' })).toBe(button);

    fireEvent.click(button);
    expect(loginAsGuest).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish();
    });

    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
  });
});
