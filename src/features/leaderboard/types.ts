import type { Schemas } from '@/lib/api';

export type LeaderboardEntry = Schemas['LeaderboardEntry'];
export type LeaderboardPage = Schemas['LeaderboardPage'];
export type LeaderboardMetric = Schemas['LeaderboardMetric'];
export type UpdateProfileRequest = Schemas['UpdateProfileRequest'];

export type LeaderboardTab = 'sharpe' | 'return';
