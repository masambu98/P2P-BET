import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createBet, getBets, getBet, acceptBet, counterBet, cancelBet, getMyBets } from '../controllers/betController.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Stats route must come before /:id route
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Use safe queries that work with SQLite
    const totalBets = await prisma.bet.count().catch(() => 0);
    const activeBets = await prisma.bet.count({ 
      where: { status: 'ACTIVE' } 
    }).catch(() => 0);
    
    // Get additional stats safely
    const totalUsers = await prisma.user.count().catch(() => 0);
    const totalVolume = await prisma.bet.aggregate({
      _sum: { stakeAmount: true }
    }).catch(() => ({ _sum: { stakeAmount: 0 } }));

    res.json({ 
      totalBets, 
      activeBets,
      totalUsers,
      totalVolume: totalVolume._sum.stakeAmount ?? 0,
      recentActivity: [] // Empty array for now
    });
  } catch (e) {
    console.error('Stats error:', e);
    // Always return valid data, never 500
    res.json({ 
      totalBets: 0, 
      activeBets: 0,
      totalUsers: 0,
      totalVolume: 0,
      recentActivity: []
    });
  }
});

router.post('/', authenticateToken, createBet);
router.get('/', getBets);
router.get('/my-bets', authenticateToken, getMyBets);
router.get('/:id', getBet);
router.post('/:id/accept', authenticateToken, acceptBet);
router.post('/:id/counter', authenticateToken, counterBet);
router.post('/:id/cancel', authenticateToken, cancelBet);

export { router as betRoutes };
