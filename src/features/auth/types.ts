// GET /api/v1/user/profile

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  balance: number;
}
