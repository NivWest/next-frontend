// Mirrors backend api/openapi.yaml: #/components/schemas/Profile and #/components/schemas/Error.

export type UserRole = 'member' | 'admin' | 'guest';

// GET /api/v1/user/profile (200) and POST /api/v1/auth/guest (201)
export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  is_guest: boolean;
}

export type ProfileResponse = UserProfile;

// Error body of new and changed endpoints, e.g. { error: 'authentication required', code: 'UNAUTHENTICATED' }
export interface ApiError {
  error: string;
  code: string;
}
