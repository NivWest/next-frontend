import { api } from '@/lib/api';
import type { UserProfile } from '@/features/auth/types';

// POST /api/v1/auth/guest (201): starts a guest session (HttpOnly session_id cookie) and returns its profile.
export function loginAsGuest(): Promise<UserProfile> {
  return api<UserProfile>('auth/guest', { method: 'POST' });
}
