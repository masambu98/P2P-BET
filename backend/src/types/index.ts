import { JwtPayload } from 'jsonwebtoken';

export interface CustomJWTPayload extends JwtPayload {
  id?: string;
  username?: string;
  email?: string;
  role?: string;
  [key: string]: any;
}
