import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getBalance = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    res.json({ balance: wallet?.balance || 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
};

export const deposit = async (req: Request, res: Response) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = (req.user as CustomJWTPayload).id!;
    
    // Create deposit request
    const deposit = await prisma.depositRequest.create({
      data: {
        userId,
        amount: parseFloat(amount),
        status: 'PENDING',
        method: 'MPESA'
      }
    });
    
    res.json({ message: 'Deposit request created', deposit });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create deposit' });
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = (req.user as CustomJWTPayload).id!;
    
    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: parseFloat(amount),
        status: 'PENDING',
        method: 'MPESA',
        destination: phoneNumber || userId
      }
    });
    
    res.json({ message: 'Withdrawal request created', withdrawal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create withdrawal' });
  }
};

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};
