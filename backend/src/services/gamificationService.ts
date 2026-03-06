import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'wins' | 'bets' | 'streaks' | 'special';
  requirement: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserStats {
  userId: string;
  level: number;
  experience: number;
  totalBets: number;
  totalWins: number;
  currentStreak: number;
  bestStreak: number;
  totalWinnings: number;
  achievements: string[];
  badges: string[];
}

class GamificationService {
  private achievements: Achievement[] = [
    // Wins achievements
    { id: 'first_win', name: 'First Victory', description: 'Win your first bet', icon: '🏆', category: 'wins', requirement: 1, points: 100, rarity: 'common' },
    { id: 'win_streak_5', name: 'Hot Streak', description: 'Win 5 bets in a row', icon: '🔥', category: 'streaks', requirement: 5, points: 500, rarity: 'rare' },
    { id: 'win_streak_10', name: 'Unstoppable', description: 'Win 10 bets in a row', icon: '⚡', category: 'streaks', requirement: 10, points: 1000, rarity: 'epic' },
    { id: 'big_winner', name: 'Big Winner', description: 'Win 50,000 KES total', icon: '💰', category: 'wins', requirement: 50000, points: 750, rarity: 'rare' },
    
    // Bet achievements
    { id: 'first_bet', name: 'Getting Started', description: 'Place your first bet', icon: '🎯', category: 'bets', requirement: 1, points: 50, rarity: 'common' },
    { id: 'bet_master', name: 'Bet Master', description: 'Place 100 bets', icon: '🎲', category: 'bets', requirement: 100, points: 800, rarity: 'epic' },
    { id: 'high_roller', name: 'High Roller', description: 'Bet 10,000 KES in a single bet', icon: '💎', category: 'bets', requirement: 10000, points: 600, rarity: 'rare' },
    
    // Special achievements
    { id: 'perfect_month', name: 'Perfect Month', description: 'Maintain positive ROI for 30 days', icon: '📅', category: 'special', requirement: 30, points: 2000, rarity: 'legendary' },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'Have 50 followers', icon: '🦋', category: 'special', requirement: 50, points: 400, rarity: 'common' },
    { id: 'early_bird', name: 'Early Bird', description: 'Place first bet of the day', icon: '🌅', category: 'special', requirement: 1, points: 25, rarity: 'common' }
  ];

  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bets: true,
        achievements: true,
        followers: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const totalBets = user.bets.length;
    const totalWins = user.bets.filter(bet => bet.status === 'WON' && bet.winnerId === userId).length;
    const totalWinnings = user.bets
      .filter(bet => bet.status === 'WON' && bet.winnerId === userId)
      .reduce((sum, bet) => sum + (bet.potentialWin || 0), 0);

    // Calculate current streak
    const currentStreak = await this.calculateCurrentStreak(userId);
    
    // Calculate experience and level
    const experience = this.calculateExperience(totalBets, totalWins, totalWinnings, currentStreak);
    const level = this.calculateLevel(experience);

    return {
      userId,
      level,
      experience,
      totalBets,
      totalWins,
      currentStreak,
      bestStreak: user.bestStreak || 0,
      totalWinnings,
      achievements: user.achievements.map(a => a.achievementId),
      badges: this.getUserBadges(user)
    };
  }

  async processBetResult(userId: string, won: boolean, amount: number): Promise<{
    newAchievements: Achievement[];
    levelUp: boolean;
    newLevel?: number;
    experienceGained: number;
  }> {
    const stats = await this.getUserStats(userId);
    const newAchievements: Achievement[] = [];
    let experienceGained = 0;

    // Update streak
    const newStreak = won ? stats.currentStreak + 1 : 0;
    if (newStreak > stats.bestStreak) {
      await prisma.user.update({
        where: { id: userId },
        data: { bestStreak: newStreak }
      });
    }

    // Calculate experience gain
    experienceGained = won ? Math.floor(amount / 100) + 50 : 10;
    if (newStreak > 3) experienceGained *= 1.5; // Bonus for streaks

    // Check for new achievements
    const updatedStats = { ...stats, currentStreak: newStreak };
    
    for (const achievement of this.achievements) {
      if (!stats.achievements.includes(achievement.id) && this.checkAchievement(updatedStats, achievement)) {
        await this.unlockAchievement(userId, achievement.id);
        newAchievements.push(achievement);
        experienceGained += achievement.points; // Bonus experience for achievements
      }
    }

    // Check for level up
    const newExperience = stats.experience + experienceGained;
    const newLevel = this.calculateLevel(newExperience);
    const levelUp = newLevel > stats.level;

    return {
      newAchievements,
      levelUp,
      newLevel: levelUp ? newLevel : undefined,
      experienceGained
    };
  }

  private async calculateCurrentStreak(userId: string): Promise<number> {
    const recentBets = await prisma.bet.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { bettorId: userId }
        ],
        status: 'SETTLED'
      },
      orderBy: { settledAt: 'desc' },
      take: 20
    });

    let streak = 0;
    for (const bet of recentBets) {
      if (bet.winnerId === userId) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateExperience(bets: number, wins: number, winnings: number, streak: number): number {
    return Math.floor(
      (bets * 10) + 
      (wins * 50) + 
      (winnings / 1000) + 
      (streak * 25)
    );
  }

  private calculateLevel(experience: number): number {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  }

  private checkAchievement(stats: UserStats, achievement: Achievement): boolean {
    switch (achievement.category) {
      case 'wins':
        if (achievement.id === 'first_win') return stats.totalWins >= 1;
        if (achievement.id === 'big_winner') return stats.totalWinnings >= achievement.requirement;
        return false;
        
      case 'bets':
        if (achievement.id === 'first_bet') return stats.totalBets >= 1;
        if (achievement.id === 'bet_master') return stats.totalBets >= 100;
        if (achievement.id === 'high_roller') return false; // Need to check individual bet amounts
        return false;
        
      case 'streaks':
        return stats.currentStreak >= achievement.requirement;
        
      case 'special':
        if (achievement.id === 'social_butterfly') return false; // Need to check followers
        return false;
        
      default:
        return false;
    }
  }

  private async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    await prisma.userAchievement.create({
      data: {
        userId,
        achievementId,
        unlockedAt: new Date()
      }
    });

    logger.info(`User ${userId} unlocked achievement ${achievementId}`);
  }

  private getUserBadges(user: any): string[] {
    const badges: string[] = [];
    
    // Level badges
    if (user.level >= 10) badges.push('🌟 Expert');
    if (user.level >= 25) badges.push('👑 Master');
    if (user.level >= 50) badges.push('🔥 Legend');
    
    // Win streak badges
    if (user.bestStreak >= 5) badges.push('⚡ Hot');
    if (user.bestStreak >= 10) badges.push('💥 Unstoppable');
    
    // Special badges
    if (user.totalWinnings >= 100000) badges.push('💰 Whale');
    if (user.bets.length >= 500) badges.push('🎯 Veteran');
    
    return badges;
  }

  async getLeaderboard(type: 'level' | 'wins' | 'winnings' | 'streak' = 'level', limit: number = 50): Promise<any[]> {
    const orderBy = type === 'level' ? 'level' : 
                   type === 'wins' ? 'totalWins' : 
                   type === 'winnings' ? 'totalWinnings' : 'bestStreak';

    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { [orderBy]: 'desc' },
      include: {
        _count: {
          select: {
            bets: true,
            followers: true
          }
        }
      }
    });

    return users.map((user, index) => ({
      rank: index + 1,
      username: user.username,
      avatar: user.avatar,
      level: user.level || 1,
      totalWins: user.totalWins || 0,
      totalWinnings: user.totalWinnings || 0,
      bestStreak: user.bestStreak || 0,
      totalBets: user._count.bets,
      followers: user._count.followers
    }));
  }

  async getAchievements(): Promise<Achievement[]> {
    return this.achievements;
  }

  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    });

    return userAchievements.map(ua => ua.achievement as Achievement);
  }
}

export const gamificationService = new GamificationService();
