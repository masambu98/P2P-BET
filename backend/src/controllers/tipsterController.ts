import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomJWTPayload } from '../types';

const prisma = new PrismaClient();

export const getTipsters = async (req: Request, res: Response) => {
  try {
    const tipsters = await prisma.tipster.findMany({
      where: { status: 'APPROVED' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        tips: {
          where: { status: 'SETTLED_WON' },
          select: { id: true }
        },
        _count: {
          select: {
            tips: true
          }
        }
      },
      orderBy: { totalRevenue: 'desc' }
    });

    const tipstersWithStats = tipsters.map(tipster => {
      const winRate = tipster.totalPicks > 0 ? (tipster.winningPicks / tipster.totalPicks) * 100 : 0;
      
      return {
        id: tipster.id,
        userId: tipster.userId,
        username: tipster.user.username,
        avatar: tipster.user.avatar,
        bio: tipster.bio,
        pricePerPick: Number(tipster.pricePerPick),
        totalPicks: tipster.totalPicks,
        winningPicks: tipster.winningPicks,
        winRate: Math.round(winRate * 10) / 10,
        totalRevenue: Number(tipster.totalRevenue),
        totalTips: tipster._count.tips,
        approvedAt: tipster.approvedAt
      };
    });

    res.json(tipstersWithStats);
  } catch (error) {
    console.error('Get tipsters error:', error);
    res.status(500).json({ error: 'Failed to fetch tipsters' });
  }
};

export const applyForTipster = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { bio, pricePerPick } = req.body;

    // Check if user is already a tipster
    const existingTipster = await prisma.tipster.findUnique({
      where: { userId }
    });

    if (existingTipster) {
      return res.status(400).json({ error: 'You are already registered as a tipster' });
    }

    const tipster = await prisma.tipster.create({
      data: {
        userId,
        bio,
        pricePerPick: pricePerPick || 100.00
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Tipster application submitted. Pending admin approval.',
      tipster
    });
  } catch (error) {
    console.error('Apply for tipster error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
};

export const getTips = async (req: Request, res: Response) => {
  try {
    const { sport, status = 'ACTIVE' } = req.query;
    const userId = (req.user as CustomJWTPayload)?.id;

    let where: any = { status };
    
    if (sport && sport !== 'all') {
      where.sport = sport;
    }

    const tips = await prisma.tip.findMany({
      where,
      include: {
        tipster: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        },
        purchases: userId ? {
          where: { userId },
          select: { id: true }
        } : false
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    const tipsWithPurchaseStatus = tips.map(tip => ({
      ...tip,
      pricePerPick: Number(tip.price),
      odds: Number(tip.odds),
      stakeAmount: Number(tip.stakeAmount),
      isPurchased: userId ? tip.purchases.length > 0 : false,
      tipster: {
        ...tip.tipster,
        pricePerPick: Number(tip.tipster.pricePerPick),
        winRate: tip.tipster.totalPicks > 0 
          ? Math.round((tip.tipster.winningPicks / tip.tipster.totalPicks) * 1000) / 10 
          : 0
      }
    }));

    res.json(tipsWithPurchaseStatus);
  } catch (error) {
    console.error('Get tips error:', error);
    res.status(500).json({ error: 'Failed to fetch tips' });
  }
};

export const purchaseTip = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const { tipId } = req.body;

    // Get tip details
    const tip = await prisma.tip.findUnique({
      where: { id: tipId },
      include: {
        tipster: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    });

    if (!tip) {
      return res.status(404).json({ error: 'Tip not found' });
    }

    if (tip.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Tip is no longer active' });
    }

    // Check if already purchased
    const existingPurchase = await prisma.tipPurchase.findUnique({
      where: {
        tipId_userId: {
          tipId,
          userId
        }
      }
    });

    if (existingPurchase) {
      return res.status(400).json({ error: 'You have already purchased this tip' });
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet || Number(wallet.balance) < Number(tip.price)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Process payment
    await prisma.$transaction(async (tx) => {
      // Deduct from user wallet
      await tx.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: tip.price
          }
        }
      });

      // Create purchase record
      await tx.tipPurchase.create({
        data: {
          tipId,
          userId,
          price: tip.price
        }
      });

      // Distribute revenue (80% to tipster, 20% to platform)
      const tipsterRevenue = Number(tip.price) * 0.8;
      const platformRevenue = Number(tip.price) * 0.2;

      // Add to tipster revenue
      await tx.tipster.update({
        where: { id: tip.tipsterId },
        data: {
          totalRevenue: {
            increment: tipsterRevenue
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: 'TIP_PURCHASE',
          amount: Number(tip.price),
          status: 'COMPLETED',
          description: `Purchased tip: ${tip.title} from ${tip.tipster.user.username}`
        }
      });
    });

    res.json({
      message: 'Tip purchased successfully',
      tip: {
        id: tip.id,
        title: tip.title,
        description: tip.description,
        prediction: tip.prediction,
        analysis: tip.analysis,
        odds: Number(tip.odds),
        sport: tip.sport,
        category: tip.category
      }
    });
  } catch (error) {
    console.error('Purchase tip error:', error);
    res.status(500).json({ error: 'Failed to purchase tip' });
  }
};

export const getMyTips = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;

    const tipster = await prisma.tipster.findUnique({
      where: { userId },
      include: {
        tips: {
          include: {
            purchases: {
              select: { id: true }
            },
            _count: {
              select: {
                purchases: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tipster) {
      return res.status(404).json({ error: 'Tipster profile not found' });
    }

    const tips = tipster.tips.map(tip => ({
      ...tip,
      price: Number(tip.price),
      odds: Number(tip.odds),
      stakeAmount: Number(tip.stakeAmount),
      purchaseCount: tip._count.purchases
    }));

    res.json(tips);
  } catch (error) {
    console.error('Get my tips error:', error);
    res.status(500).json({ error: 'Failed to fetch your tips' });
  }
};

export const createTip = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as CustomJWTPayload).id!;
    const {
      title,
      description,
      sport,
      category,
      prediction,
      odds,
      price,
      analysis,
      expiresAt
    } = req.body;

    const tipster = await prisma.tipster.findUnique({
      where: { userId }
    });

    if (!tipster) {
      return res.status(403).json({ error: 'You are not an approved tipster' });
    }

    if (tipster.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Your tipster account is not approved' });
    }

    const tip = await prisma.tip.create({
      data: {
        tipsterId: tipster.id,
        title,
        description,
        sport,
        category,
        prediction,
        odds,
        price,
        analysis,
        expiresAt: new Date(expiresAt)
      },
      include: {
        tipster: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    // Update tipster stats
    await prisma.tipster.update({
      where: { id: tipster.id },
      data: {
        totalPicks: {
          increment: 1
        }
      }
    });

    res.status(201).json(tip);
  } catch (error) {
    console.error('Create tip error:', error);
    res.status(500).json({ error: 'Failed to create tip' });
  }
};

export const approveTipster = async (req: Request, res: Response) => {
  try {
    const { tipsterId } = req.params;

    const tipster = await prisma.tipster.update({
      where: { id: tipsterId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Tipster approved successfully',
      tipster
    });
  } catch (error) {
    console.error('Approve tipster error:', error);
    res.status(500).json({ error: 'Failed to approve tipster' });
  }
};
