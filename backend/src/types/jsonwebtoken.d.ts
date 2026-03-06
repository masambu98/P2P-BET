import 'jsonwebtoken';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    username?: string;
    email?: string;
    role?: string;
  }
}
