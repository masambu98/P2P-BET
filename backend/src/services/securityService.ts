import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface SecurityEvent {
  id: string;
  userId?: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'bet_anomaly' | 'account_lockout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: any;
}

interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  suspiciousActivityThreshold: number;
  betAmountThreshold: number;
  requireTwoFactor: boolean;
  sessionTimeout: number; // minutes
}

class SecurityService {
  private config: SecurityConfig = {
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    suspiciousActivityThreshold: 10,
    betAmountThreshold: 100000, // KES
    requireTwoFactor: false,
    sessionTimeout: 60
  };

  private blockedIPs = new Set<string>();
  private suspiciousUsers = new Map<string, number>();

  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    await prisma.securityEvent.create({
      data: {
        userId: securityEvent.userId,
        type: securityEvent.type,
        severity: securityEvent.severity,
        description: securityEvent.description,
        ipAddress: securityEvent.ipAddress,
        userAgent: securityEvent.userAgent,
        metadata: securityEvent.metadata || {}
      }
    });

    logger.warn('Security event logged:', securityEvent);

    // Auto-respond to critical events
    await this.handleSecurityEvent(securityEvent);
  }

  private async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    switch (event.type) {
      case 'failed_login':
        await this.handleFailedLogin(event);
        break;
      case 'suspicious_activity':
        await this.handleSuspiciousActivity(event);
        break;
      case 'bet_anomaly':
        await this.handleBetAnomaly(event);
        break;
      case 'account_lockout':
        await this.handleAccountLockout(event);
        break;
    }
  }

  private async handleFailedLogin(event: SecurityEvent): Promise<void> {
    if (!event.userId) return;

    const recentFailures = await prisma.securityEvent.count({
      where: {
        userId: event.userId,
        type: 'failed_login',
        timestamp: {
          gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    if (recentFailures >= this.config.maxLoginAttempts) {
      await this.lockAccount(event.userId, event.ipAddress);
    }
  }

  private async handleSuspiciousActivity(event: SecurityEvent): Promise<void> {
    // Check if this IP has multiple suspicious events
    const recentSuspiciousEvents = await prisma.securityEvent.count({
      where: {
        ipAddress: event.ipAddress,
        type: 'suspicious_activity',
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      }
    });

    if (recentSuspiciousEvents >= this.config.suspiciousActivityThreshold) {
      this.blockIP(event.ipAddress);
    }
  }

  private async handleBetAnomaly(event: SecurityEvent): Promise<void> {
    if (!event.userId) return;

    // Flag user for manual review
    await this.flagUserForReview(event.userId, 'Unusual betting pattern detected');
  }

  private async handleAccountLockout(event: SecurityEvent): Promise<void> {
    // Notify administrators
    logger.error(`Account locked for user ${event.userId} due to security concerns`);
  }

  async lockAccount(userId: string, ipAddress: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'SUSPENDED',
        suspendedAt: new Date(),
        suspensionReason: 'Automated security lockdown'
      }
    });

    await this.logSecurityEvent({
      userId,
      type: 'account_lockout',
      severity: 'high',
      description: 'Account automatically locked due to multiple failed login attempts',
      ipAddress,
      userAgent: 'Security System'
    });
  }

  private blockIP(ipAddress: string): void {
    this.blockedIPs.add(ipAddress);
    logger.warn(`IP address blocked: ${ipAddress}`);
    
    // Auto-unblock after 24 hours
    setTimeout(() => {
      this.blockedIPs.delete(ipAddress);
    }, 24 * 60 * 60 * 1000);
  }

  private async flagUserForReview(userId: string, reason: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        flaggedForReview: true,
        reviewReason: reason
      }
    });

    logger.warn(`User flagged for review: ${userId} - ${reason}`);
  }

  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  async validateSession(sessionToken: string): Promise<boolean> {
    try {
      const session = await prisma.userSession.findUnique({
        where: { token: sessionToken },
        include: { user: true }
      });

      if (!session) return false;

      // Check if session has expired
      if (session.expiresAt < new Date()) {
        await prisma.userSession.delete({
          where: { id: session.id }
        });
        return false;
      }

      // Check if user is suspended
      if (session.user.status === 'SUSPENDED' || session.user.status === 'BANNED') {
        return false;
      }

      // Update last activity
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastActivity: new Date() }
      });

      return true;
    } catch (error) {
      logger.error('Session validation error:', error);
      return false;
    }
  }

  async detectBetAnomaly(userId: string, betAmount: number, betCount: number): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bets: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        }
      }
    });

    if (!user) return false;

    const avgBetAmount = user.bets.length > 0 
      ? user.bets.reduce((sum, bet) => sum + bet.stakeAmount, 0) / user.bets.length 
      : 0;

    // Check for anomalies
    const anomalies = [];

    // Sudden large bet
    if (betAmount > this.config.betAmountThreshold) {
      anomalies.push('Large bet amount');
    }

    // Bet amount significantly higher than average
    if (avgBetAmount > 0 && betAmount > avgBetAmount * 10) {
      anomalies.push('Bet amount 10x higher than average');
    }

    // Excessive betting frequency
    if (betCount > 50) { // More than 50 bets in 24 hours
      anomalies.push('Excessive betting frequency');
    }

    if (anomalies.length > 0) {
      await this.logSecurityEvent({
        userId,
        type: 'bet_anomaly',
        severity: 'medium',
        description: `Betting anomalies detected: ${anomalies.join(', ')}`,
        ipAddress: 'Unknown',
        userAgent: 'Betting System',
        metadata: { betAmount, betCount, avgBetAmount, anomalies }
      });

      return true;
    }

    return false;
  }

  async getSecurityDashboard(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    blockedIPs: number;
    flaggedUsers: number;
    recentEvents: SecurityEvent[];
  }> {
    const [
      totalEvents,
      criticalEvents,
      flaggedUsers,
      recentEvents
    ] = await Promise.all([
      prisma.securityEvent.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }),
      prisma.securityEvent.count({
        where: {
          severity: 'critical',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.user.count({
        where: { flaggedForReview: true }
      }),
      prisma.securityEvent.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      })
    ]);

    return {
      totalEvents,
      criticalEvents,
      blockedIPs: this.blockedIPs.size,
      flaggedUsers,
      recentEvents
    };
  }

  async cleanupExpiredSessions(): Promise<void> {
    const expiredSessions = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    logger.info(`Cleaned up ${expiredSessions.count} expired sessions`);
  }

  async generateSecurityReport(): Promise<{
    summary: any;
    threats: any[];
    recommendations: string[];
  }> {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalEvents,
      eventsByType,
      eventsBySeverity,
      topThreatIPs
    ] = await Promise.all([
      prisma.securityEvent.count({
        where: { timestamp: { gte: last30Days } }
      }),
      prisma.securityEvent.groupBy({
        by: ['type'],
        where: { timestamp: { gte: last30Days } },
        _count: true
      }),
      prisma.securityEvent.groupBy({
        by: ['severity'],
        where: { timestamp: { gte: last30Days } },
        _count: true
      }),
      prisma.securityEvent.groupBy({
        by: ['ipAddress'],
        where: { timestamp: { gte: last30Days } },
        _count: true,
        orderBy: { _count: 'desc' },
        take: 5
      })
    ]);

    const recommendations = this.generateRecommendations(eventsByType, eventsBySeverity);

    return {
      summary: {
        totalEvents,
        eventsByType,
        eventsBySeverity,
        topThreatIPs
      },
      threats: topThreatIPs.map(ip => ({
        ipAddress: ip.ipAddress,
        eventCount: ip._count,
        riskLevel: ip._count > 20 ? 'high' : ip._count > 10 ? 'medium' : 'low'
      })),
      recommendations
    };
  }

  private generateRecommendations(eventsByType: any[], eventsBySeverity: any[]): string[] {
    const recommendations = [];

    const criticalEvents = eventsBySeverity.find(s => s.severity === 'critical')?._count || 0;
    if (criticalEvents > 0) {
      recommendations.push('Immediate attention required: ' + criticalEvents + ' critical security events detected');
    }

    const failedLogins = eventsByType.find(t => t.type === 'failed_login')?._count || 0;
    if (failedLogins > 100) {
      recommendations.push('Consider implementing additional authentication measures due to high failed login attempts');
    }

    const suspiciousActivities = eventsByType.find(t => t.type === 'suspicious_activity')?._count || 0;
    if (suspiciousActivities > 50) {
      recommendations.push('Review and update IP blocking rules for suspicious activities');
    }

    if (recommendations.length === 0) {
      recommendations.push('Security posture is healthy. Continue monitoring for unusual patterns.');
    }

    return recommendations;
  }
}

export const securityService = new SecurityService();
