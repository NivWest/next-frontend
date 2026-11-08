import { apiGet, apiPatch } from '@/lib/api';
import type { LeaderboardMetric, LeaderboardPage, UpdateProfileRequest } from '../types';
import type { UserProfile } from '@/features/auth/types';

/**
 * Fetches materialized leaderboard entries for the requested metric (story NW-13).
 */
export async function getLeaderboard(metric: LeaderboardMetric, limit = 50): Promise<LeaderboardPage> {
  return apiGet('/leaderboard', {
    query: { metric, limit },
  });
}

/**
 * Updates the signed-in user's display name and/or leaderboard opt-in status (story NW-13).
 */
export async function updateProfile(request: UpdateProfileRequest): Promise<UserProfile> {
  return apiPatch('/me', {
    body: request,
  });
}
