export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isEmailVerified: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  referralCode?: string;
}
