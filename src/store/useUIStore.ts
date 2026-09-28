import { create } from 'zustand';
import { api } from '@/lib/api';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type ViewType = 'Login' | 'Dashboard' | 'Watchlist' | 'Vault' | 'Settings' | 'Orders' | 'Analytics' | 'Screener' | 'Help' | 'Trade';

export interface UserProfile {
  name: string;
  email: string;
}

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
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
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
      const data = await api<any>('user/profile');
      set({ isAuthenticated: true, isAuthChecking: false, user: { name: data.name, email: data.email } });
    } catch (e) {
      set({ isAuthenticated: false, isAuthChecking: false, user: null });
    }
  }
}));
