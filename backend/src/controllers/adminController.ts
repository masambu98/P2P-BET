import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getBets = async (req: Request, res: Response) => {
  try {
    const bets = await prisma.bet.findMany({
      include: {
        proposer: true,
        acceptor: true
      }
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bets' });
  }
};

export const settleBet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { winner } = req.body;
    
    const bet = await prisma.bet.update({
      where: { id },
      data: {
        status: 'SETTLED',
        winnerId: winner
      } as any
    });
    
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to settle bet' });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalBets = await prisma.bet.count();
    const totalTransactions = await prisma.transaction.count();
    
    res.json({
      totalUsers,
      totalBets,
      totalTransactions
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'APPROVED' }
    });
    
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
};

export const rejectWithdrawal = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await prisma.withdrawalRequest.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    
    res.json(withdrawal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
};
