import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  GoogleAuthRequest 
} from '../types/auth';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(30),
  referralCode: z.string().optional()
});

const googleAuthSchema = z.object({
  code: z.string(),
  referralCode: z.string().optional()
});

const generateTokens = (userId: string, email: string, role: boolean) => {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  
  if (!jwtSecret || !refreshSecret) {
    throw new Error('JWT secrets not configured');
  }

  const token = jwt.sign(
    { userId, email, role },
    jwtSecret,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    refreshSecret,
    { expiresIn: '7d' }
  );

  return { token, refreshToken };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = registerSchema.parse(req.body) as RegisterRequest;
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({ 
        error: existingUser.email === validatedData.email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
      return;
    }

    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        passwordHash,
        referredBy: validatedData.referralCode
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true
      }
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 10000.00, // 10,000 KES starting balance
        currency: 'KES'
      }
    });

    const { token, refreshToken } = generateTokens(user.id, user.email, user.role === 'ADMIN');

    logger.info(`New user registered: ${user.email}`);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.role === 'ADMIN',
        isVerified: user.isVerified
      },
      token,
      refreshToken
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = loginSchema.parse(req.body) as LoginRequest;

    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
        role: true,
        isVerified: true,
        isActive: true
      }
    });

    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({ error: 'Account deactivated' });
      return;
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { token, refreshToken } = generateTokens(user.id, user.email, user.role === 'ADMIN');

    logger.info(`User logged in: ${user.email}`);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.role === 'ADMIN',
        isVerified: user.isVerified
      },
      token,
      refreshToken
    };

    res.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }

    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, refreshSecret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const { token, refreshToken: newRefreshToken } = generateTokens(
      user.id, 
      user.email, 
      user.role === 'ADMIN'
    );

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        isAdmin: user.role === 'ADMIN',
        isVerified: user.isVerified
      },
      token,
      refreshToken: newRefreshToken
    };

    res.json(response);
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isVerified: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            currency: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
