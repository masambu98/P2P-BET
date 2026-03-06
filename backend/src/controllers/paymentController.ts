import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { mpesaService } from '../services/mpesaService';
// import { createCheckoutSession, createPaymentIntent, confirmPaymentIntent, constructWebhookEvent, processWebhookEvent } from '../services/stripeService';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body } from 'express-validator';

const prisma = new PrismaClient();

// Get Socket.io instance from server (will be injected)
let io: any;
export const setPaymentSocketIO = (socketIO: any) => {
  io = socketIO;
};

export const initiateMpesaDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { phoneNumber, amount } = req.body;

    // Validate input
    if (!phoneNumber || !amount || amount < 100) {
      res.status(400).json({ error: 'Invalid phone number or amount (minimum KES 100)' });
      return;
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance, // Will be updated after callback
        description: `M-Pesa deposit of KES ${amount}`,
        status: 'PENDING',
        reference: `MPESA_${Date.now()}`,
        metadata: {
          phoneNumber,
          method: 'mpesa',
          initiatedAt: new Date().toISOString()
        }
      }
    });

    // Initiate M-Pesa STK Push
    const stkPushResponse = await mpesaService.initiateStkPush({
      phoneNumber,
      amount: parseFloat(amount),
      accountReference: `DEPOSIT_${userId}`,
      transactionDesc: `P2P Betting Deposit`,
      callbackUrl: `${process.env.FRONTEND_URL}/api/payments/mpesa/callback`
    });

    // Update transaction with M-Pesa details
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        reference: stkPushResponse.CheckoutRequestID,
        metadata: {
          ...(transaction.metadata as any ?? {}),
          merchantRequestID: stkPushResponse.MerchantRequestID,
          checkoutRequestID: stkPushResponse.CheckoutRequestID
        }
      }
    });

    logger.info('M-Pesa deposit initiated:', {
      userId,
      amount,
      phoneNumber,
      checkoutRequestID: stkPushResponse.CheckoutRequestID
    });

    res.json({
      success: true,
      message: 'M-Pesa payment initiated. Please check your phone to complete the transaction.',
      checkoutRequestID: stkPushResponse.CheckoutRequestID,
      merchantRequestID: stkPushResponse.MerchantRequestID
    });
  } catch (error: any) {
    logger.error('M-Pesa deposit initiation failed:', error);
    res.status(500).json({ 
      error: 'Failed to initiate M-Pesa payment',
      details: error.message 
    });
  }
};

export const handleMpesaCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const callbackData = req.body;
    
    // Process the callback asynchronously
    setImmediate(async () => {
      try {
        const result = await mpesaService.processCallback(callbackData);
        
        // Emit real-time balance update if payment was successful
        if (result && result.success && io && result.userId && result.newBalance !== undefined) {
          io.to(`user-${result.userId}`).emit('balance_update', {
            balance: result.newBalance
          });
          
          io.to(`user-${result.userId}`).emit('notification', {
            type: 'balance',
            title: 'Deposit Successful',
            message: `M-Pesa deposit of KES ${result.amount} completed successfully!`
          });
        }
      } catch (error) {
        logger.error('Error processing M-Pesa callback:', error);
      }
    });

    // Respond immediately to M-Pesa
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    logger.error('M-Pesa callback error:', error);
    res.status(500).json({ ResultCode: 1, ResultDesc: 'Server error' });
  }
};

// Stripe functions disabled - using M-Pesa only
/*
export const initiateStripeDeposit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { amount } = req.body;

    if (!amount || amount < 100) {
      res.status(400).json({ error: 'Invalid amount (minimum KES 100)' });
      return;
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    // Create pending transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount: parseFloat(amount),
        balanceBefore: wallet.balance,
        balanceAfter: wallet.balance,
        description: `Stripe deposit of KES ${amount}`,
        status: 'PENDING',
        reference: `STRIPE_${Date.now()}`,
        metadata: {
          method: 'stripe',
          initiatedAt: new Date().toISOString()
        }
      }
    });

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      amount: parseFloat(amount),
      userId,
      transactionId: transaction.id,
      successUrl: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: process.env.STRIPE_CANCEL_URL
    });

    // Update transaction with Stripe session ID
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        reference: checkoutSession.id,
        metadata: {
          ...(transaction.metadata as any ?? {}),
          stripeSessionId: checkoutSession.id
        }
      }
    });

    logger.info('Stripe deposit initiated:', {
      userId,
      amount,
      sessionId: checkoutSession.id
    });

    res.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error: any) {
    logger.error('Stripe deposit initiation failed:', error);
    res.status(500).json({ 
      error: 'Failed to initiate Stripe payment',
      details: error.message 
    });
  }
};
*/

// Stripe functions disabled - using M-Pesa only
/*
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = req.body;

    const event = constructWebhookEvent(rawBody, sig);

    // Process webhook asynchronously
    setImmediate(async () => {
      try {
        await processWebhookEvent(event);
      } catch (error) {
        logger.error('Error processing Stripe webhook:', error);
      }
    });

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Stripe webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
};
*/

export const getTransactionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { transactionId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId
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

    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // For M-Pesa transactions, query status if still pending
    if (transaction.status === 'PENDING' && (transaction.metadata as any)?.method === 'mpesa') {
      try {
        const checkoutRequestID = (transaction.metadata as any)?.checkoutRequestID;

        if (!checkoutRequestID) {
          throw new Error('Missing checkoutRequestID in metadata');
        }

        const mpesaStatus = await mpesaService.queryTransactionStatus(checkoutRequestID);
        
        res.json({
          transaction,
          mpesaStatus
        });
        return;
      } catch (error) {
        logger.error('M-Pesa status query failed', { error, transactionId: transaction.id });
        // If query fails, return basic transaction info
      }
    }

    res.json({ transaction });
  } catch (error: any) {
    logger.error('Get transaction status failed:', error);
    res.status(500).json({ error: 'Failed to get transaction status' });
  }
};

export const getUserTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { page = 1, limit = 20, type } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };
    
    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        select: {
          id: true,
          type: true,
          amount: true,
          balanceBefore: true,
          balanceAfter: true,
          description: true,
          status: true,
          reference: true,
          metadata: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    logger.error('Get user transactions failed:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

export const requestWithdrawal = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { amount, method, destination } = req.body;

    // Validate input
    if (!amount || amount < 500) {
      res.status(400).json({ error: 'Invalid amount (minimum withdrawal KES 500)' });
      return;
    }

    if (!method || !destination) {
      res.status(400).json({ error: 'Payment method and destination are required' });
      return;
    }

    // Get user wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      res.status(404).json({ error: 'Wallet not found' });
      return;
    }

    if (wallet.balance < amount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    // Check for pending withdrawals
    const pendingWithdrawals = await prisma.withdrawalRequest.count({
      where: {
        userId,
        status: 'PENDING'
      }
    });

    if (pendingWithdrawals > 0) {
      res.status(400).json({ error: 'You have a pending withdrawal request' });
      return;
    }

    // Create withdrawal request
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        userId,
        amount: parseFloat(amount),
        method,
        destination,
        status: 'PENDING',
        metadata: {
          requestedAt: new Date().toISOString(),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      }
    });

    logger.info('Withdrawal request created:', {
      userId,
      amount,
      method,
      destination,
      requestId: withdrawalRequest.id
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed within 24 hours.',
      requestId: withdrawalRequest.id
    });
  } catch (error: any) {
    logger.error('Withdrawal request failed:', error);
    res.status(500).json({ error: 'Failed to submit withdrawal request' });
  }
};
