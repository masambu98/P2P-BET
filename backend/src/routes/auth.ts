import { Router } from 'express';
import { body } from 'express-validator';
import { 
  register, 
  login, 
  refreshToken, 
  getProfile 
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('referralCode').optional().isString()
], validateRequest, register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validateRequest, login);

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
], validateRequest, refreshToken);

router.get('/profile', authenticateToken, getProfile);

export { router as authRoutes };
