import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload & {
      id: string;
      username?: string;
      email?: string;
      role?: string;
    };
  }
}
