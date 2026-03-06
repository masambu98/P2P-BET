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

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    isVerified: boolean;
  };
  token: string;
  refreshToken: string;
}

export interface GoogleAuthRequest {
  code: string;
  referralCode?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}
