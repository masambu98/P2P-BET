import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/bets/stats - Get platform statistics
router.get('/stats', authenticateToken, async (req: any, res: any) => {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count({
      where: { isActive: true }
    });

    // Get active bets count
    const activeBets = await prisma.bet.count({
      where: { 
        status: 'ACTIVE'
      }
    });

    // Get total volume (sum of all bet stakes)
    const bets = await prisma.bet.findMany({
      select: { stakeAmount: true }
    });
    
    const totalVolume = bets.reduce((sum, bet) => sum + Number(bet.stakeAmount), 0);

    // Get recent activity (mock data for now)
    const recentActivity = [];

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeBets,
        totalVolume,
        recentActivity
      }
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});

export default router;
