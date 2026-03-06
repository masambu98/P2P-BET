import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getFeed, getTrendingBets } from '../controllers/feedController.js';

const router = Router();

// All feed routes require authentication
router.get('/', authenticateToken, getFeed);
router.get('/trending', authenticateToken, getTrendingBets);

export { router as feedRoutes };
