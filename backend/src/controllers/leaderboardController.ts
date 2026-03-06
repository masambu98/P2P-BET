import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { timeframe = 'all-time' } = req.query;
    
    let dateFilter: any = {};
    
    if (timeframe === 'weekly') {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = {
        createdAt: { gte: oneWeekAgo }
      };
    }

    // Get all users with their betting statistics
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatar: true,
        totalWon: true,
        totalWagered: true,
        bets: {
          where: dateFilter,
          select: {
            id: true,
            stakeAmount: true,
            potentialWin: true,
            status: true,
            winnerId: true,
            createdAt: true
          }
        }
      }
    });

    // Calculate statistics for each user
    const leaderboardData = users.map(user => {
      const bets = user.bets;
      const totalBets = bets.length;
      const wonBets = bets.filter(bet => bet.winnerId === user.id && bet.status === 'SETTLED').length;
      const lostBets = bets.filter(bet => bet.status === 'SETTLED' && bet.winnerId !== user.id && bet.winnerId !== null).length;
      
      // Calculate win rate
      const settledBets = bets.filter(bet => bet.status === 'SETTLED').length;
      const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;
      
      // Calculate biggest win
      const biggestWin = bets
        .filter(bet => bet.winnerId === user.id && bet.status === 'SETTLED')
        .reduce((max, bet) => Math.max(max, Number(bet.potentialWin)), 0);
      
      // Calculate profit/loss
      const totalWonFromBets = bets
        .filter(bet => bet.winnerId === user.id && bet.status === 'SETTLED')
        .reduce((sum, bet) => sum + Number(bet.potentialWin), 0);
      
      const totalLostFromBets = bets
        .filter(bet => bet.winnerId !== user.id && bet.status === 'SETTLED' && bet.winnerId !== null)
        .reduce((sum, bet) => sum + Number(bet.stakeAmount), 0);
      
      const profitLoss = totalWonFromBets - totalLostFromBets;
      
      // Calculate current streak
      const sortedBets = bets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      let currentStreak = 0;
      for (const bet of sortedBets) {
        if (bet.status !== 'SETTLED') continue;
        if (bet.winnerId === user.id) {
          currentStreak++;
        } else if (bet.winnerId !== null) {
          break;
        }
      }
      
      // Calculate best streak
      let bestStreak = 0;
      let tempStreak = 0;
      for (const bet of sortedBets.reverse()) {
        if (bet.status !== 'SETTLED') continue;
        if (bet.winnerId === user.id) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else if (bet.winnerId !== null) {
          tempStreak = 0;
        }
      }
      
      return {
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        winRate: Math.round(winRate * 10) / 10,
        totalWon: Number(user.totalWon) || totalWonFromBets,
        biggestWin,
        totalBets,
        wonBets,
        lostBets,
        profitLoss,
        currentStreak,
        bestStreak
      };
    });

    // Filter out users with no bets and sort by total won (descending)
    const filteredLeaderboard = leaderboardData
      .filter(entry => entry.totalBets > 0)
      .sort((a, b) => b.totalWon - a.totalWon)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

    res.json(filteredLeaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};

export const getUserRank = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { timeframe = 'all-time' } = req.query;
    
    // Get leaderboard and find user's rank
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/leaderboard?timeframe=${timeframe}`, {
      headers: {
        'Authorization': req.headers.authorization || ''
      }
    });
    
    if (response.ok) {
      const leaderboard = await response.json();
      const userRank = leaderboard.findIndex((entry: any) => entry.userId === userId) + 1;
      
      res.json({
        rank: userRank > 0 ? userRank : null,
        totalParticipants: leaderboard.length
      });
    } else {
      res.status(500).json({ error: 'Failed to get user rank' });
    }
  } catch (error) {
    console.error('User rank fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
};
