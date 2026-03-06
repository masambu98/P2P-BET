import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getFeed = async (req: Request, res: Response) => {
  try {
    const { sport, category, limit = 20, offset = 0 } = req.query;

    // Build where clause
    const where: any = {
      status: 'PENDING' // Only show active pending bets
    };

    if (sport && sport !== 'all') {
      where.sport = sport;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    // Fetch bets with proposer stats
    const bets = await prisma.bet.findMany({
      where,
      include: {
        proposer: {
          select: {
            id: true,
            username: true,
            avatar: true,
            totalWon: true,
            totalWagered: true
          }
        },
        _count: {
          select: {
            // This would need a proper relation for accepts/likes
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset)
    });

    // Calculate additional stats for each bet
    const feedBets = await Promise.all(bets.map(async (bet) => {
      // Calculate win rate
      const winRate = bet.proposer.totalWagered && bet.proposer.totalWagered > 0 
        ? Number((Number(bet.proposer.totalWon) / Number(bet.proposer.totalWagered)) * 100).toFixed(1)
        : null;

      // Get accept count (simplified - would need proper tracking)
      const acceptCount = Math.floor(Math.random() * 10); // Mock data for now
      
      // Get view count (simplified - would need proper tracking)
      const viewCount = Math.floor(Math.random() * 100); // Mock data for now

      return {
        id: bet.id,
        title: bet.title || `${bet.sport} - ${bet.marketType}`,
        description: bet.description || `Place your bet on ${bet.event}`,
        sport: bet.sport,
        category: bet.category || 'general',
        stakeAmount: Number(bet.stakeAmount),
        odds: Number(bet.odds) || 2.0,
        potentialWin: Number(bet.potentialWin) || Number(bet.stakeAmount) * (Number(bet.odds) || 2.0),
        status: bet.status,
        proposer: {
          id: bet.proposer.id,
          username: bet.proposer.username,
          avatar: bet.proposer.avatar,
          winRate: winRate ? parseFloat(winRate) : undefined,
          totalWon: Number(bet.proposer.totalWon) || undefined
        },
        createdAt: bet.createdAt.toISOString(),
        expiresAt: bet.expiresAt?.toISOString(),
        acceptCount,
        viewCount
      };
    }));

    res.json(feedBets);
  } catch (error) {
    console.error('Feed fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
};

export const getTrendingBets = async (req: Request, res: Response) => {
  try {
    // Get bets with most accepts in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const trendingBets = await prisma.bet.findMany({
      where: {
        createdAt: { gte: oneDayAgo },
        status: 'PENDING'
      },
      include: {
        proposer: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { stakeAmount: 'desc' }, // Sort by stake amount as proxy for trending
      take: 10
    });

    const formattedBets = trendingBets.map(bet => ({
      id: bet.id,
      title: bet.title || `${bet.sport} - ${bet.marketType}`,
      sport: bet.sport,
      stakeAmount: Number(bet.stakeAmount),
      odds: Number(bet.odds) || 2.0,
      proposer: bet.proposer,
      createdAt: bet.createdAt.toISOString(),
      acceptCount: Math.floor(Math.random() * 20) // Mock data
    }));

    res.json(formattedBets);
  } catch (error) {
    console.error('Trending bets error:', error);
    res.status(500).json({ error: 'Failed to fetch trending bets' });
  }
};
