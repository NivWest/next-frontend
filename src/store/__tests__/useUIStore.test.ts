import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mock } from 'vitest';
import { useUIStore } from '@/store/useUIStore';
import type { UserProfile } from '@/store/useUIStore';
import type { ApiError } from '@/features/auth/types';

type FetchMock = Mock<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>;

const guestProfile: UserProfile = {
  id: 42,
  name: 'Guest trader',
  email: 'guest-42@demo.local',
  role: 'guest',
  balance: 100000,
  is_guest: true,
};

const unauthenticated: ApiError = { error: 'authentication required', code: 'UNAUTHENTICATED' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function noContent(): Response {
  return new Response(null, { status: 204 });
}

const initialState = useUIStore.getState();

let fetchMock: FetchMock;

function calledUrl(index: number): string {
  return String(fetchMock.mock.calls[index][0]);
}

function calledMethod(index: number): string {
  return fetchMock.mock.calls[index][1]?.method ?? 'GET';
}

beforeEach(() => {
  useUIStore.setState(initialState, true);
  fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('checkAuth', () => {
  it('stores the full profile including is_guest on success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(guestProfile));

    await useUIStore.getState().checkAuth();

    const state = useUIStore.getState();
    expect(calledUrl(0)).toBe('/api/v1/user/profile');
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAuthChecking).toBe(false);
    expect(state.user).toEqual(guestProfile);
    expect(state.user?.is_guest).toBe(true);
  });

  it('clears the user and isAuthenticated on failure', async () => {
    useUIStore.setState({ isAuthenticated: true, user: guestProfile });
    fetchMock.mockResolvedValueOnce(jsonResponse(unauthenticated, 401));

    await useUIStore.getState().checkAuth();

    const state = useUIStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isAuthChecking).toBe(false);
    expect(state.user).toBeNull();
  });
});

describe('loginAsGuest', () => {
  it('POSTs to /api/v1/auth/guest, then fetches the profile and ends authenticated', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(guestProfile, 201))
      .mockResolvedValueOnce(jsonResponse(guestProfile));

    await useUIStore.getState().loginAsGuest();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calledUrl(0)).toBe('/api/v1/auth/guest');
    expect(calledMethod(0)).toBe('POST');
    expect(fetchMock.mock.calls[0][1]?.body).toBeUndefined();
    expect(calledUrl(1)).toBe('/api/v1/user/profile');
    expect(calledMethod(1)).toBe('GET');

    const state = useUIStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(guestProfile);
    expect(state.toasts).toEqual([]);
  });

  it('leaves the user null and adds an error toast when the guest login fails', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'boom', code: 'INTERNAL' }, 500));

    await expect(useUIStore.getState().loginAsGuest()).resolves.toBeUndefined();

    const state = useUIStore.getState();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Could not start the demo. Please try again.',
    });
  });

  it('adds an error toast when the profile cannot be loaded after the guest login', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(guestProfile, 201))
      .mockResolvedValueOnce(jsonResponse(unauthenticated, 401));

    await useUIStore.getState().loginAsGuest();

    const state = useUIStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.toasts[0]).toMatchObject({
      type: 'error',
      message: 'Could not start the demo. Please try again.',
    });
  });
});

describe('logout', () => {
  it('POSTs to /api/v1/auth/logout and clears the user', async () => {
    useUIStore.setState({ isAuthenticated: true, user: guestProfile });
    fetchMock.mockResolvedValueOnce(noContent());

    await useUIStore.getState().logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calledUrl(0)).toBe('/api/v1/auth/logout');
    expect(calledMethod(0)).toBe('POST');

    const state = useUIStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
