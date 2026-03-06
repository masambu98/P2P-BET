import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getLeaderboard, getUserRank } from '../controllers/leaderboardController.js';

const router = Router();

// All leaderboard routes require authentication
router.get('/', authenticateToken, getLeaderboard);
router.get('/my-rank', authenticateToken, getUserRank);

export { router as leaderboardRoutes };
