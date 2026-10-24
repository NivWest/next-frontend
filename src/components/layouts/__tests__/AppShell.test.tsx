import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '../AppShell';
import { useUIStore } from '@/store/useUIStore';

const navigation = vi.hoisted(() => ({
  pathname: '/dashboard',
  push: vi.fn<(href: string) => void>(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({
    push: navigation.push,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const initialState = useUIStore.getState();

function openDrawer(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
  return screen.getByRole('dialog', { name: 'Navigation' });
}

describe('AppShell', () => {
  beforeEach(() => {
    navigation.pathname = '/dashboard';
    navigation.push.mockReset();
    useUIStore.setState({ isAuthenticated: false, user: null, cookieConsentDismissed: false });
  });

  afterEach(() => {
    useUIStore.setState(initialState, true);
  });

  it('renders the children inside <main> and the cookie banner', () => {
    render(
      <AppShell>
        <h1>Overview</h1>
      </AppShell>,
    );

    expect(within(screen.getByRole('main')).getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cookie preferences' })).toBeInTheDocument();
  });

  it('keeps the drawer closed until the button is pressed', () => {
    render(<AppShell>content</AppShell>);

    const button = screen.getByRole('button', { name: 'Open navigation' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a modal drawer with the navigation links', () => {
    render(<AppShell>content</AppShell>);

    const drawer = openDrawer();

    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(drawer).toHaveAttribute('id', screen.getByRole('button', { name: 'Open navigation' }).getAttribute('aria-controls'));
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'true');
    for (const name of ['Dashboard', 'Watchlist', 'The Vault', 'Orders', 'Analytics', 'Markets', 'Settings', 'Help center']) {
      expect(within(drawer).getByRole('link', { name })).toBeInTheDocument();
    }
    expect(within(drawer).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    expect(within(drawer).getByRole('button', { name: 'Try the demo' })).toBeInTheDocument();
    expect(within(drawer).getByRole('button', { name: 'Close navigation' })).toHaveFocus();
  });

  it('closes on Escape', () => {
    render(<AppShell>content</AppShell>);
    openDrawer();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveFocus();
  });

  it('closes from the close button', () => {
    render(<AppShell>content</AppShell>);
    const drawer = openDrawer();

    fireEvent.click(within(drawer).getByRole('button', { name: 'Close navigation' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the backdrop is clicked', () => {
    render(<AppShell>content</AppShell>);
    openDrawer();

    fireEvent.click(screen.getByTestId('navigation-backdrop'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes after a search is submitted from the drawer', () => {
    render(<AppShell>content</AppShell>);
    const drawer = openDrawer();

    fireEvent.change(within(drawer).getByRole('searchbox', { name: 'Search markets' }), { target: { value: 'fjord' } });
    fireEvent.submit(within(drawer).getByRole('search'));

    expect(navigation.push).toHaveBeenCalledWith('/markets?q=fjord');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the pathname changes', () => {
    const { rerender } = render(<AppShell>content</AppShell>);
    openDrawer();

    navigation.pathname = '/orders';
    rerender(<AppShell>content</AppShell>);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
