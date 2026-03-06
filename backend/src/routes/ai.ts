import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getSuggestedBets, getUserBettingInsights } from '../controllers/aiController.js';

const router = Router();

// All AI routes require authentication
router.get('/suggestions', authenticateToken, getSuggestedBets);
router.get('/insights', authenticateToken, getUserBettingInsights);

export { router as aiRoutes };
