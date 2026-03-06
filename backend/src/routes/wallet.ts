import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getBalance, deposit, withdraw, getTransactions } from '../controllers/walletController.js';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    // First try to find existing wallet
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    // If wallet doesn't exist, create it with 0 balance
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0
        }
      });
    }
    
    res.json({ balance: wallet.balance ?? 0 });
  } catch (e) {
    console.error('Balance fetch error:', e);
    // Always return a valid response, never 500
    res.status(200).json({ balance: 0 });
  }
});

router.post('/btc/deposit', authenticateToken, async (req, res) => {
  res.json({ address: 'btc-address-placeholder', amount: req.body.amount });
});

router.post('/deposit', authenticateToken, deposit);
router.post('/withdraw', authenticateToken, withdraw);
router.get('/transactions', authenticateToken, getTransactions);

export { router as walletRoutes };
