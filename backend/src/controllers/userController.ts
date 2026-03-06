import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = (req.user as CustomJWTPayload)?.id;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatar: true,
        email: true,
        createdAt: true,
        totalWon: true,
        totalWagered: true,
        bets: {
          select: {
            id: true,
            title: true,
            sport: true,
            stakeAmount: true,
            odds: true,
            status: true,
            result: true,
            createdAt: true,
            settledAt: true,
            potentialWin: true,
            winnerId: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Only recent 10 bets for public view
        },
        followers: {
          select: { followerId: true }
        },
        following: {
          select: { followingId: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id
          }
        }
      });
      isFollowing = !!followRelation;
    }

    // Calculate statistics
    const totalBets = user.bets.length;
    const wonBets = user.bets.filter(bet => bet.winnerId === user.id && bet.status === 'SETTLED').length;
    const lostBets = user.bets.filter(bet => bet.status === 'SETTLED' && bet.winnerId !== user.id && bet.winnerId !== null).length;
    const settledBets = user.bets.filter(bet => bet.status === 'SETTLED').length;
    const winRate = settledBets > 0 ? (wonBets / settledBets) * 100 : 0;

    // Calculate biggest win
    const biggestWin = user.bets
      .filter(bet => bet.winnerId === user.id && bet.status === 'SETTLED')
      .reduce((max, bet) => Math.max(max, Number(bet.potentialWin)), 0);

    // Calculate current streak
    const sortedBets = user.bets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

    // Find favourite sport
    const sportCounts: { [key: string]: number } = {};
    user.bets.forEach(bet => {
      sportCounts[bet.sport] = (sportCounts[bet.sport] || 0) + 1;
    });
    const favouriteSport = Object.keys(sportCounts).reduce((a, b) => 
      sportCounts[a] > sportCounts[b] ? a : b, '');

    // Prepare public bet data
    const recentBets = user.bets.map(bet => ({
      id: bet.id,
      title: bet.title || `${bet.sport} - ${bet.sport}`,
      sport: bet.sport,
      stakeAmount: Number(bet.stakeAmount),
      odds: Number(bet.odds) || 2.0,
      status: bet.status,
      result: bet.result as 'WON' | 'LOST' | undefined,
      createdAt: bet.createdAt.toISOString(),
      settledAt: bet.settledAt?.toISOString(),
      potentialWin: Number(bet.potentialWin)
    }));

    const profile = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      email: currentUserId === user.id ? user.email : undefined, // Only show email to owner
      joinedAt: user.createdAt.toISOString(),
      totalBets,
      wonBets,
      lostBets,
      winRate: Math.round(winRate * 10) / 10,
      totalWon: Number(user.totalWon) || 0,
      totalWagered: Number(user.totalWagered) || 0,
      biggestWin,
      favouriteSport,
      currentStreak,
      bestStreak,
      isFollowing,
      followersCount: user.followers.length,
      followingCount: user.following.length
    };

    res.json({
      user: profile,
      recentBets
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

export const followUser = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req.user as CustomJWTPayload).id!;
    const { userId } = req.params;

    if (currentUserId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: userId
      }
    });

    res.json({ message: 'User followed successfully' });
  } catch (error: any) {
    console.error('Follow error:', error);
    if (error.code === 'P2002') {
      // Already following
      return res.status(400).json({ error: 'Already following this user' });
    }
    res.status(500).json({ error: 'Failed to follow user' });
  }
};

export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const currentUserId = (req.user as CustomJWTPayload).id!;
    const { userId } = req.params;

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: userId
        }
      }
    });

    res.json({ message: 'User unfollowed successfully' });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    if (error.code === 'P2025') {
      // Not following
      return res.status(400).json({ error: 'Not following this user' });
    }
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
};

export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json(followers.map(f => f.follower));
  } catch (error) {
    console.error('Followers fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
};

export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.json(following.map(f => f.following));
  } catch (error) {
    console.error('Following fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
};
