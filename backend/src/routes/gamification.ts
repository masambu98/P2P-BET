import express from 'express';
import { gamificationService } from '../services/gamificationService.js';
import { authenticateToken } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get user stats and progress
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await gamificationService.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    res.status(500).json({ error: 'Failed to get user stats' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const type = req.query.type as 'level' | 'wins' | 'winnings' | 'streak' || 'level';
    const limit = parseInt(req.query.limit as string) || 50;
    
    const leaderboard = await gamificationService.getLeaderboard(type, limit);
    res.json(leaderboard);
  } catch (error) {
    logger.error('Failed to get leaderboard:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await gamificationService.getAchievements();
    res.json(achievements);
  } catch (error) {
    logger.error('Failed to get achievements:', error);
    res.status(500).json({ error: 'Failed to get achievements' });
  }
});

// Get user achievements
router.get('/achievements/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const achievements = await gamificationService.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    logger.error('Failed to get user achievements:', error);
    res.status(500).json({ error: 'Failed to get user achievements' });
  }
});

export { router as gamificationRoutes };
