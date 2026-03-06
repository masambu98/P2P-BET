import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getSuggestedBets = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;

    // Get user's betting history
    const userBets = await prisma.bet.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { bettorId: userId }
        ],
        status: 'SETTLED'
      },
      include: {
        creator: true,
        bettor: true,
        proposal: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if user has enough history (5+ bets)
    if (userBets.length < 5) {
      return res.json({
        message: 'Need at least 5 settled bets to generate suggestions',
        suggestions: []
      });
    }

    // Analyze user's performance by sport/category
    const sportStats: { [key: string]: { total: number; won: number; winRate: number } } = {};
    const categoryStats: { [key: string]: { total: number; won: number; winRate: number } } = {};

    userBets.forEach(bet => {
      // Track sport performance
      const sport = bet.proposal?.sport || 'general';
      if (!sportStats[sport]) {
        sportStats[sport] = { total: 0, won: 0, winRate: 0 };
      }
      sportStats[sport].total++;
      if (bet.winnerId === userId) {
        sportStats[sport].won++;
      }

      // Track category performance
      const category = bet.proposal?.category || 'general';
      if (!categoryStats[category]) {
        categoryStats[category] = { total: 0, won: 0, winRate: 0 };
      }
      categoryStats[category].total++;
      if (bet.winnerId === userId) {
        categoryStats[category].won++;
      }
    });

    // Calculate win rates
    Object.keys(sportStats).forEach(sport => {
      sportStats[sport].winRate = (sportStats[sport].won / sportStats[sport].total) * 100;
    });

    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].winRate = (categoryStats[category].won / categoryStats[category].total) * 100;
    });

    // Find user's strongest categories (win rate > 60% and at least 3 bets)
    const strongSports = Object.entries(sportStats)
      .filter(([_, stats]) => stats.total >= 3 && stats.winRate > 60)
      .sort((a, b) => b[1].winRate - a[1].winRate)
      .map(([sport, stats]) => ({ sport, ...stats }));

    const strongCategories = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.total >= 3 && stats.winRate > 60)
      .sort((a, b) => b[1].winRate - a[1].winRate)
      .map(([category, stats]) => ({ category, ...stats }));

    // Get available bets that match user's strengths
    const availableBets = await prisma.bet.findMany({
      where: {
        status: 'PENDING',
        creatorId: { not: userId }, // Don't suggest user's own bets
        proposal: {
          OR: [
            // Match strong sports
            ...strongSports.map(s => ({ sport: s.sport })),
            // Match strong categories
            ...strongCategories.map(c => ({ category: c.category }))
          ]
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        proposal: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Score and rank suggestions based on user's strengths
    const scoredBets = availableBets.map(bet => {
      let score = 0;
      let reasons = [];

      // Check sport match
      const sportMatch = strongSports.find(s => s.sport === bet.proposal?.sport);
      if (sportMatch) {
        score += sportMatch.winRate;
        reasons.push(`${sportMatch.sport} - ${sportMatch.winRate.toFixed(1)}% win rate`);
      }

      // Check category match
      const categoryMatch = strongCategories.find(c => c.category === bet.proposal?.category);
      if (categoryMatch) {
        score += categoryMatch.winRate;
        reasons.push(`${categoryMatch.category} - ${categoryMatch.winRate.toFixed(1)}% win rate`);
      }

      // Bonus for recent activity (last 24 hours)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      if (bet.createdAt > oneDayAgo) {
        score += 10;
        reasons.push('Recent activity');
      }

      // Bonus for reasonable odds (1.5 - 3.0)
      const odds = Number(bet.odds) || 2.0;
      if (odds >= 1.5 && odds <= 3.0) {
        score += 5;
        reasons.push('Favorable odds');
      }

      return {
        ...bet,
        suggestionScore: score,
        suggestionReasons: reasons
      };
    });

    // Sort by score and take top 3
    const suggestions = scoredBets
      .sort((a, b) => b.suggestionScore - a.suggestionScore)
      .slice(0, 3)
      .map(bet => ({
        id: bet.id,
        title: bet.proposal?.eventName || `${bet.proposal?.sport || 'Sports'} - ${bet.proposal?.eventType || 'Event'}`,
        sport: bet.proposal?.sport || 'general',
        category: bet.proposal?.category || 'general',
        stakeAmount: Number(bet.stakeAmount),
        odds: Number(bet.odds) || 2.0,
        potentialWin: Number(bet.potentialWin),
        proposer: bet.creator,
        createdAt: bet.createdAt.toISOString(),
        suggestionScore: bet.suggestionScore,
        suggestionReasons: bet.suggestionReasons,
        confidence: Math.min(100, Math.round((bet.suggestionScore / 100) * 100))
      }));

    res.json({
      userStats: {
        totalBets: userBets.length,
        strongSports: strongSports.slice(0, 3),
        strongCategories: strongCategories.slice(0, 3)
      },
      suggestions
    });
  } catch (error) {
    console.error('AI suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
};

export const getUserBettingInsights = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;

    // Get comprehensive betting history
    const userBets = await prisma.bet.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { bettorId: userId }
        ]
      },
      include: {
        creator: true,
        bettor: true,
        proposal: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (userBets.length === 0) {
      return res.json({
        message: 'No betting history available',
        insights: null
      });
    }

    // Calculate various insights
    const totalBets = userBets.length;
    const settledBets = userBets.filter(bet => bet.status === 'SETTLED');
    const wonBets = settledBets.filter(bet => bet.winnerId === userId);
    const overallWinRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;

    // Performance by time of day
    const timePerformance: { [hour: string]: { total: number; won: number } } = {};
    settledBets.forEach(bet => {
      const hour = new Date(bet.createdAt).getHours().toString();
      if (!timePerformance[hour]) {
        timePerformance[hour] = { total: 0, won: 0 };
      }
      timePerformance[hour].total++;
      if (bet.winnerId === userId) {
        timePerformance[hour].won++;
      }
    });

    // Best performing hours
    const bestHours = Object.entries(timePerformance)
      .filter(([_, stats]) => stats.total >= 3)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        winRate: (stats.won / stats.total) * 100,
        totalBets: stats.total
      }))
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 3);

    // Streak analysis
    const sortedBets = settledBets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (const bet of sortedBets) {
      if (bet.winnerId === userId) {
        currentStreak = 0; // Reset current streak (looking for consecutive wins from most recent)
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak (from most recent backwards)
    currentStreak = 0;
    for (let i = sortedBets.length - 1; i >= 0; i--) {
      const bet = sortedBets[i];
      if (bet.winnerId === userId) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Risk analysis
    const avgStake = userBets.reduce((sum, bet) => sum + Number(bet.stakeAmount), 0) / userBets.length;
    const highStakeBets = userBets.filter(bet => Number(bet.stakeAmount) > avgStake * 1.5);
    const highStakeWinRate = highStakeBets.length > 0 
      ? (highStakeBets.filter(bet => bet.winnerId === userId).length / highStakeBets.length) * 100 
      : 0;

    const insights = {
      overview: {
        totalBets,
        settledBets: settledBets.length,
        wonBets: wonBets.length,
        overallWinRate: Math.round(overallWinRate * 10) / 10,
        currentStreak,
        bestStreak
      },
      performance: {
        averageStake: Math.round(avgStake),
        highStakeWinRate: Math.round(highStakeWinRate * 10) / 10,
        bestHours: bestHours.map(h => ({
          hour: `${h.hour}:00`,
          winRate: Math.round(h.winRate * 10) / 10,
          totalBets: h.totalBets
        }))
      },
      recommendation: overallWinRate > 60 ? 'Strong performance - consider increasing stakes gradually' :
                       overallWinRate > 45 ? 'Moderate performance - focus on your strongest categories' :
                       'Developing performance - analyze patterns and consider smaller stakes'
    };

    res.json(insights);
  } catch (error) {
    console.error('Betting insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
};
