import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

interface AnalyticsData {
  userGrowth: {
    daily: Array<{ date: string; count: number; newUsers: number }>;
    monthly: Array<{ month: string; count: number; newUsers: number }>;
  };
  bettingVolume: {
    daily: Array<{ date: string; volume: number; bets: number }>;
    monthly: Array<{ month: string; volume: number; bets: number }>;
  };
  userEngagement: {
    activeUsers: number;
    avgSessionDuration: number;
    retentionRate: number;
    churnRate: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
  };
  predictiveInsights: {
    nextMonthGrowth: number;
    churnRisk: Array<{ userId: string; username: string; risk: number }>;
    trendingCategories: Array<{ category: string; growth: number }>;
  };
}

class AnalyticsService {
  async getAnalyticsData(timeframe: '7d' | '30d' | '90d' | '1y' = '30d'): Promise<AnalyticsData> {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      userGrowth,
      bettingVolume,
      userEngagement,
      revenueMetrics,
      predictiveInsights
    ] = await Promise.all([
      this.getUserGrowth(startDate),
      this.getBettingVolume(startDate),
      this.getUserEngagement(startDate),
      this.getRevenueMetrics(startDate),
      this.getPredictiveInsights(startDate)
    ]);

    return {
      userGrowth,
      bettingVolume,
      userEngagement,
      revenueMetrics,
      predictiveInsights
    };
  }

  private async getUserGrowth(startDate: Date) {
    // Daily user growth
    const dailyUsers = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as newUsers,
        (
          SELECT COUNT(*) 
          FROM users u2 
          WHERE DATE(u2.created_at) <= DATE(u1.created_at)
        ) as count
      FROM users u1 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: string; count: number; newUsers: number }>;

    // Monthly user growth
    const monthlyUsers = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as newUsers,
        (
          SELECT COUNT(*) 
          FROM users u2 
          WHERE DATE_FORMAT(u2.created_at, '%Y-%m') <= DATE_FORMAT(u1.created_at, '%Y-%m')
        ) as count
      FROM users u1 
      WHERE created_at >= ${startDate}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    ` as Array<{ month: string; count: number; newUsers: number }>;

    return { daily: dailyUsers, monthly: monthlyUsers };
  }

  private async getBettingVolume(startDate: Date) {
    // Daily betting volume
    const dailyVolume = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as bets,
        COALESCE(SUM(stake_amount), 0) as volume
      FROM bets 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    ` as Array<{ date: string; bets: number; volume: number }>;

    // Monthly betting volume
    const monthlyVolume = await prisma.$queryRaw`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as bets,
        COALESCE(SUM(stake_amount), 0) as volume
      FROM bets 
      WHERE created_at >= ${startDate}
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    ` as Array<{ month: string; bets: number; volume: number }>;

    return { daily: dailyVolume, monthly: monthlyVolume };
  }

  private async getUserEngagement(startDate: Date) {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastActive: {
          gte: startDate
        }
      }
    });

    // Simulated metrics - in production, these would come from actual tracking
    const avgSessionDuration = 15.5; // minutes
    const retentionRate = 0.75; // 75%
    const churnRate = 0.05; // 5%

    return {
      activeUsers,
      avgSessionDuration,
      retentionRate,
      churnRate
    };
  }

  private async getRevenueMetrics(startDate: Date) {
    // Calculate platform revenue (assuming 5% commission on winning bets)
    const revenueData = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(
          CASE 
            WHEN status = 'SETTLED' AND winner_id IS NOT NULL 
            THEN stake_amount * 0.05 
            ELSE 0 
          END
        ), 0) as totalRevenue
      FROM bets 
      WHERE settled_at >= ${startDate}
    ` as Array<{ totalRevenue: number }>;

    const totalRevenue = revenueData[0]?.totalRevenue || 0;
    const totalUsers = await prisma.user.count();
    
    return {
      totalRevenue,
      monthlyRecurringRevenue: totalRevenue / 1, // Simplified calculation
      averageRevenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0
    };
  }

  private async getPredictiveInsights(startDate: Date) {
    // AI-powered predictive analytics (simplified for demo)
    
    // Predict next month growth based on historical trends
    const currentUsers = await prisma.user.count();
    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: {
          lt: new Date(new Date().setMonth(new Date().getMonth() - 1))
        }
      }
    });
    
    const growthRate = currentUsers > lastMonthUsers ? (currentUsers - lastMonthUsers) / lastMonthUsers : 0;
    const nextMonthGrowth = growthRate * 100;

    // Identify users at risk of churn
    const churnRisk = await this.identifyChurnRisk(startDate);

    // Identify trending categories
    const trendingCategories = await this.identifyTrendingCategories(startDate);

    return {
      nextMonthGrowth,
      churnRisk,
      trendingCategories
    };
  }

  private async identifyChurnRisk(startDate: Date) {
    // Simple churn risk model based on user activity
    const inactiveUsers = await prisma.user.findMany({
      where: {
        OR: [
          { lastActive: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // 7 days inactive
          { bets: { none: { createdAt: { gte: startDate } } } } // No recent bets
        ]
      },
      take: 10,
      select: {
        id: true,
        username: true,
        lastActive: true,
        _count: {
          select: { bets: true }
        }
      }
    });

    return inactiveUsers.map(user => ({
      userId: user.id,
      username: user.username,
      risk: Math.random() * 0.8 + 0.2 // Random risk between 20-100%
    })).sort((a, b) => b.risk - a.risk);
  }

  private async identifyTrendingCategories(startDate: Date) {
    const categoryGrowth = await prisma.$queryRaw`
      SELECT 
        category,
        COUNT(*) as betCount,
        LAG(COUNT(*)) OVER (ORDER BY category) as previousCount
      FROM bets 
      WHERE created_at >= ${startDate}
      GROUP BY category
      ORDER BY betCount DESC
    ` as Array<{ category: string; betCount: number; previousCount?: number }>;

    return categoryGrowth.map(cat => ({
      category: cat.category || 'Other',
      growth: cat.previousCount ? ((cat.betCount - cat.previousCount) / cat.previousCount) * 100 : 0
    })).sort((a, b) => b.growth - a.growth).slice(0, 5);
  }

  async generateReport(type: 'user' | 'revenue' | 'engagement', timeframe: '7d' | '30d' | '90d' = '30d') {
    const data = await this.getAnalyticsData(timeframe);
    
    switch (type) {
      case 'user':
        return this.generateUserReport(data);
      case 'revenue':
        return this.generateRevenueReport(data);
      case 'engagement':
        return this.generateEngagementReport(data);
      default:
        throw new Error('Invalid report type');
    }
  }

  private generateUserReport(data: AnalyticsData) {
    return {
      title: 'User Analytics Report',
      summary: {
        totalUsers: data.userGrowth.monthly[data.userGrowth.monthly.length - 1]?.count || 0,
        newUsers: data.userGrowth.monthly.reduce((sum, month) => sum + month.newUsers, 0),
        growthRate: data.predictiveInsights.nextMonthGrowth,
        activeUsers: data.userEngagement.activeUsers
      },
      charts: {
        userGrowth: data.userGrowth,
        engagement: data.userEngagement
      },
      insights: [
        `User base grew by ${data.predictiveInsights.nextMonthGrowth.toFixed(1)}%`,
        `${data.userEngagement.activeUsers} users active in the last period`,
        `${data.predictiveInsights.churnRisk.length} users at risk of churn`
      ]
    };
  }

  private generateRevenueReport(data: AnalyticsData) {
    return {
      title: 'Revenue Analytics Report',
      summary: {
        totalRevenue: data.revenueMetrics.totalRevenue,
        monthlyRecurringRevenue: data.revenueMetrics.monthlyRecurringRevenue,
        averageRevenuePerUser: data.revenueMetrics.averageRevenuePerUser,
        totalBets: data.bettingVolume.daily.reduce((sum, day) => sum + day.bets, 0)
      },
      charts: {
        revenue: data.revenueMetrics,
        bettingVolume: data.bettingVolume
      },
      insights: [
        `Total revenue: KES ${data.revenueMetrics.totalRevenue.toLocaleString()}`,
        `Average revenue per user: KES ${data.revenueMetrics.averageRevenuePerUser.toLocaleString()}`,
        `Total betting volume: KES ${data.bettingVolume.daily.reduce((sum, day) => sum + day.volume, 0).toLocaleString()}`
      ]
    };
  }

  private generateEngagementReport(data: AnalyticsData) {
    return {
      title: 'User Engagement Report',
      summary: {
        activeUsers: data.userEngagement.activeUsers,
        avgSessionDuration: data.userEngagement.avgSessionDuration,
        retentionRate: data.userEngagement.retentionRate,
        churnRate: data.userEngagement.churnRate
      },
      charts: {
        engagement: data.userEngagement,
        trendingCategories: data.predictiveInsights.trendingCategories
      },
      insights: [
        `Retention rate: ${(data.userEngagement.retentionRate * 100).toFixed(1)}%`,
        `Average session duration: ${data.userEngagement.avgSessionDuration.toFixed(1)} minutes`,
        `Top trending category: ${data.predictiveInsights.trendingCategories[0]?.category || 'N/A'}`
      ]
    };
  }
}

export const analyticsService = new AnalyticsService();
