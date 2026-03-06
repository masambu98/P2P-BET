import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

// Get Socket.io instance from server (will be injected)
let io: any;
export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

export const createBet = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const bet = await prisma.bet.create({
      data: {
        ...req.body,
        proposerId: userId
      },
      include: { proposer: true }
    });
    
    // Emit real-time event to all connected clients
    if (io) {
      io.emit('new_bet', {
        id: bet.id,
        description: bet.description,
        sport: bet.sport,
        stakeAmount: bet.stakeAmount,
        odds: bet.odds,
        proposer: bet.proposer,
        createdAt: bet.createdAt
      });
    }
    
    res.status(201).json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bet' });
  }
};

export const getBets = async (req: Request, res: Response) => {
  try {
    const bets = await prisma.bet.findMany({
      where: { status: 'PENDING' },
      include: { proposer: true }
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bets' });
  }
};

export const getBet = async (req: Request, res: Response) => {
  try {
    const bet = await prisma.bet.findUnique({
      where: { id: req.params.id },
      include: { proposer: true, acceptor: true }
    });
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get bet' });
  }
};

export const acceptBet = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const bet = await prisma.bet.update({
      where: { id: req.params.id },
      data: {
        acceptorId: userId,
        status: 'ACTIVE'
      },
      include: { proposer: true, acceptor: true }
    });
    
    // Emit real-time events
    if (io) {
      // Notify all users for live feed
      io.emit('bet_accepted', {
        betId: bet.id,
        bet: {
          id: bet.id,
          title: bet.title,
          sport: bet.sport,
          stakeAmount: bet.stakeAmount,
          status: 'ACCEPTED',
          proposer: bet.proposer,
          acceptor: bet.acceptor,
          createdAt: bet.createdAt
        }
      });
      
      // Notify the bet proposer
      io.to(`user-${bet.proposerId}`).emit('bet_accepted', {
        betId: bet.id,
        acceptor: bet.acceptor,
        message: 'Your bet has been accepted!'
      });
      
      // Send notification to proposer
      io.to(`user-${bet.proposerId}`).emit('notification', {
        type: 'bet',
        title: 'Bet Accepted',
        message: `${bet.acceptor?.username} accepted your bet!`
      });
    }
    
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept bet' });
  }
};

export const counterBet = async (req: Request, res: Response) => {
  try {
    res.json({ message: 'Counter offer feature coming soon' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to counter bet' });
  }
};

export const cancelBet = async (req: Request, res: Response) => {
  try {
    const bet = await prisma.bet.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel bet' });
  }
};

export const getMyBets = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const bets = await prisma.bet.findMany({
      where: {
        OR: [
          { proposerId: userId },
          { acceptorId: userId }
        ]
      },
      include: { proposer: true, acceptor: true }
    });
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get my bets' });
  }
};
