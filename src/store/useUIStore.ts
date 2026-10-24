import { create } from 'zustand';
import { api } from '@/lib/api';
import { loginAsGuest as requestGuestSession } from '@/features/auth/api/auth';
import type { ProfileResponse, UserProfile } from '@/features/auth/types';

export type { UserProfile };

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type ViewType = 'Login' | 'Dashboard' | 'Watchlist' | 'Vault' | 'Settings' | 'Orders' | 'Analytics' | 'Screener' | 'Help' | 'Trade';

export interface UIState {
  activeView: ViewType;
  toasts: Toast[];
  cookieConsentDismissed: boolean;
  isAuthenticated: boolean;
  isAuthChecking: boolean;
  user: UserProfile | null;
  setActiveView: (view: ViewType) => void;
  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  dismissCookieConsent: () => void;
  login: () => void;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
  activeView: 'Dashboard',
  toasts: [],
  cookieConsentDismissed: false,
  isAuthenticated: false,
  isAuthChecking: true,
  user: null,
  
  setActiveView: (view) => set({ activeView: view }),
  
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) }));
    }, 3000);
  },
  
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  
  dismissCookieConsent: () => set({ cookieConsentDismissed: true }),
  
  login: () => set({ isAuthenticated: true }),

  loginAsGuest: async () => {
    try {
      await requestGuestSession();
      await get().checkAuth();
      if (!get().isAuthenticated) {
        throw new Error('Guest session was created but the profile could not be loaded');
      }
      set({ activeView: 'Dashboard' });
    } catch (e) {
      console.error('Guest login failed', e);
      get().addToast('Could not start the demo. Please try again.', 'error');
    }
  },
  
  logout: async () => {
    try {
      await api('auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    set({ isAuthenticated: false, activeView: 'Dashboard', user: null });
  },

  checkAuth: async () => {
    try {
      const data = await api<ProfileResponse>('user/profile');
      set({ isAuthenticated: true, isAuthChecking: false, user: data });
    } catch {
      set({ isAuthenticated: false, isAuthChecking: false, user: null });
    }
  }
}));
