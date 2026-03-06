import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/wallet/balance - Get user balance with transaction history
router.get('/balance', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    // Get platform fees (transactions)
    const deposits = await prisma.platformFees.findMany({
      where: {
        userId,
        type: 'DEPOSIT'
      }
    });

    const withdrawals = await prisma.platformFees.findMany({
      where: {
        userId,
        type: 'WITHDRAWAL'
      }
    });

    const totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
    const currentBalance = wallet?.balance || 0;

    // Mock BTC equivalent (in real implementation, fetch from API)
    const btcEquivalent = currentBalance / 3500000; // Assuming 1 BTC = 3,500,000 KES

    const transactions = [
      ...deposits.map(d => ({
        id: d.id,
        userId: d.userId,
        type: 'DEPOSIT' as const,
        amountKES: Number(d.amount),
        amountBTC: Number(d.amount) / 3500000,
        feeKES: Number(d.amount) * 0.02,
        feeBTC: (Number(d.amount) * 0.02) / 3500000,
        status: 'CONFIRMED' as const,
        btcTxId: d.btcTxId,
        createdAt: d.createdAt,
        updatedAt: d.createdAt
      })),
      ...withdrawals.map(w => ({
        id: w.id,
        userId: w.userId,
        type: 'WITHDRAWAL' as const,
        amountKES: Number(w.amount),
        amountBTC: Number(w.amount) / 3500000,
        feeKES: Number(w.amount) * 0.03,
        feeBTC: (Number(w.amount) * 0.03) / 3500000,
        status: 'PENDING' as const,
        btcTxId: w.btcTxId,
        createdAt: w.createdAt,
        updatedAt: w.createdAt
      }))
    ];

    res.json({
      success: true,
      balanceInfo: {
        currentBalance,
        totalDeposited,
        totalWithdrawn,
        btcEquivalent,
        transactions
      }
    });
  } catch (error: any) {
    console.error('Balance fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      details: error.message 
    });
  }
});

export default router;
