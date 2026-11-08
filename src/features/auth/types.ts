// Generated from backend api/openapi.yaml (src/lib/api/schema.d.ts, `npm run api:gen`); don't redefine these.
import type { Schemas } from '@/lib/api';

export type UserRole = Schemas['Role'];

/** GET /api/v1/user/profile (200) and POST /api/v1/auth/guest (201). */
export type UserProfile = Schemas['Profile'];

export type ProfileResponse = UserProfile;

/** Error body of every endpoint, e.g. { error: 'authentication required', code: 'UNAUTHENTICATED' }. */
export type ApiError = Schemas['Error'];
