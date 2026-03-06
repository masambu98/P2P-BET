import { PrismaClient } from '@prisma/client';
import QRCode from 'qrcode';
import axios from 'axios';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface BitcoinDepositRequest {
  userId: string;
  amountKES: number;
}

interface BitcoinWithdrawRequest {
  userId: string;
  btcAddress: string;
  amountKES: number;
}

interface BTCTransaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  amountKES: number;
  amountBTC: number;
  feeKES: number;
  feeBTC: number;
  btcAddress?: string;
  btcTxId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

class BitcoinService {
  private readonly OPENNODE_API_KEY = process.env.OPENNODE_API_KEY;
  private readonly OPENNODE_ENVIRONMENT = process.env.OPENNODE_ENVIRONMENT || 'development';
  private readonly DEPOSIT_FEE_RATE = 0.02; // 2%
  private readonly WITHDRAWAL_FEE_RATE = 0.03; // 3%
  private readonly BET_FEE_RATE = 0.05; // 5%
  private readonly BTC_TO_KES_RATE = 3500000; // Fixed rate as specified

  constructor() {
    if (!this.OPENNODE_API_KEY) {
      logger.warn('OpenNode API key not configured - Bitcoin features will show "coming soon"');
    }
  }

  private getOpenNodeHeaders() {
    return {
      'Authorization': this.OPENNODE_API_KEY,
      'Content-Type': 'application/json'
    };
  }

  private getOpenNodeUrl(path: string) {
    const baseUrl = this.OPENNODE_ENVIRONMENT === 'production' 
      ? 'https://api.opennode.com' 
      : 'https://dev-api.opennode.com';
    return `${baseUrl}${path}`;
  }

  /**
   * Get current BTC to KES exchange rate (using fixed rate as specified)
   */
  private async getBTCtoKESRate(): Promise<number> {
    return this.BTC_TO_KES_RATE;
  }

  /**
   * Convert KES to BTC
   */
  private async KEStoBTC(amountKES: number): Promise<number> {
    const rate = await this.getBTCtoKESRate();
    return amountKES / rate;
  }

  /**
   * Convert BTC to KES
   */
  private async BTCtoKES(amountBTC: number): Promise<number> {
    const rate = await this.getBTCtoKESRate();
    return amountBTC * rate;
  }

  /**
   * Generate BTC deposit charge using OpenNode
   */
  async generateDepositAddress(userId: string, amountKES: number): Promise<{
    address: string;
    amountBTC: number;
    feeKES: number;
    feeBTC: number;
    totalBTC: number;
    chargeId: string;
    hostedUrl: string;
  }> {
    if (!this.OPENNODE_API_KEY) {
      throw new Error('Bitcoin deposits are coming soon - OpenNode API not configured');
    }

    try {
      const feeKES = amountKES * this.DEPOSIT_FEE_RATE;
      const totalKES = amountKES + feeKES;
      const totalBTC = await this.KEStoBTC(totalKES);
      const feeBTC = await this.KEStoBTC(feeKES);
      const amountBTC = await this.KEStoBTC(amountKES);

      // Create OpenNode charge
      const chargeData = {
        amount: totalBTC.toString(),
        currency: 'BTC',
        description: `P2P Betting Deposit - ${amountKES} KES`,
        callback_url: `${process.env.BASE_URL || 'http://localhost:5000'}/api/wallet/btc/webhook`,
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?deposit=success`,
        auto_settle: false,
        customer: {
          name: userId,
          email: `user-${userId}@p2pbetting.com`
        }
      };

      const response = await axios.post(
        this.getOpenNodeUrl('/v1/charges'),
        chargeData,
        { headers: this.getOpenNodeHeaders() }
      );

      const charge = response.data.data;
      
      // Store transaction in database
      await prisma.platformFees.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount: feeKES,
          btcTxId: charge.id,
          createdAt: new Date()
        }
      });

      logger.info('BTC deposit charge created', {
        userId,
        amountKES,
        chargeId: charge.id
      });

      return {
        address: charge.lightning_invoice?.payreq || charge.onchain_address,
        amountBTC,
        feeKES,
        feeBTC,
        totalBTC,
        chargeId: charge.id,
        hostedUrl: charge.hosted_url
      };
    } catch (error: any) {
      logger.error('Failed to generate BTC deposit charge:', error);
      
      if (error.response?.status === 401) {
        throw new Error('Bitcoin deposits are coming soon - OpenNode configuration needed');
      }
      
      throw new Error('Failed to generate deposit address');
    }
  }

  /**
   * Generate QR code for BTC address
   */
  async generateQRCode(address: string, amountBTC: number): Promise<string> {
    try {
      const btcURI = `bitcoin:${address}?amount=${amountBTC}`;
      const qrCode = await QRCode.toDataURL(btcURI);
      return qrCode;
    } catch (error) {
      logger.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Process Bitcoin withdrawal
   */
  async processWithdrawal(userId: string, btcAddress: string, amountKES: number): Promise<{
    id: string;
    amountBTC: number;
    feeKES: number;
    feeBTC: number;
    totalBTC: number;
    status: string;
  }> {
    try {
      // Get user wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const feeKES = amountKES * this.WITHDRAWAL_FEE_RATE;
      const totalKES = amountKES + feeKES;
      const totalBTC = await this.KEStoBTC(totalKES);
      const feeBTC = await this.KEStoBTC(feeKES);
      const amountBTC = await this.KEStoBTC(amountKES);

      // Check if user has sufficient balance
      if (Number(wallet.balance) < totalKES) {
        throw new Error('Insufficient balance');
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { userId },
        data: {
          balance: {
            decrement: totalKES
          }
        }
      });

      // Store withdrawal transaction
      const transaction = await prisma.platformFees.create({
        data: {
          userId,
          type: 'WITHDRAWAL',
          amount: feeKES,
          btcTxId: `WITHDRAW_${Date.now()}`,
          createdAt: new Date()
        }
      });

      // In a real implementation, you would integrate with a Bitcoin payment processor
      // to send the actual BTC to the user's address
      logger.info('BTC withdrawal processed', {
        userId,
        btcAddress,
        amountKES,
        feeKES,
        transactionId: transaction.id
      });

      return {
        id: transaction.id,
        amountBTC,
        feeKES,
        feeBTC,
        totalBTC,
        status: 'PENDING'
      };
    } catch (error) {
      logger.error('Failed to process BTC withdrawal:', error);
      throw error;
    }
  }

  /**
   * Handle OpenNode webhook
   */
  async handleWebhook(event: any): Promise<void> {
    try {
      const { type, data } = event;

      if (type === 'charge:confirmed' || type === 'charge:paid') {
        const charge = data;
        
        // Find the platform fee record to get user info
        const platformFee = await prisma.platformFees.findFirst({
          where: { btcTxId: charge.id }
        });

        if (platformFee && platformFee.type === 'DEPOSIT') {
          const userId = platformFee.userId;
          const amountBTC = parseFloat(charge.amount);
          const amountKES = await this.BTCtoKES(amountBTC);
          const feeKES = amountKES * this.DEPOSIT_FEE_RATE;
          const netAmount = amountKES - feeKES;

          // Credit user wallet
          const wallet = await prisma.wallet.findUnique({
            where: { userId }
          });

          if (wallet) {
            await prisma.wallet.update({
              where: { userId },
              data: {
                balance: {
                  increment: netAmount
                }
              }
            });

            // Update platform fee record
            await prisma.platformFees.update({
              where: { id: platformFee.id },
              data: {
                amount: feeKES
              }
            });

            logger.info('BTC deposit confirmed and wallet credited', {
              userId,
              amountKES,
              feeKES,
              netAmount,
              chargeId: charge.id
            });
          }
        }
      }
    } catch (error) {
      logger.error('Failed to handle OpenNode webhook:', error);
      throw error;
    }
  }

  /**
   * Get user balance with transaction history
   */
  async getUserBalance(userId: string): Promise<{
    currentBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    btcEquivalent: number;
    transactions: BTCTransaction[];
  }> {
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      const deposits = await prisma.platformFees.findMany({
        where: {
          userId,
          type: 'DEPOSIT'
        }
      });

      const withdrawals = await prisma.platformFees.findMany({
        where: {
          userId,
          type: 'WITHDRAWAL'
        }
      });

      const totalDeposited = deposits.reduce((sum, d) => sum + Number(d.amount), 0);
      const totalWithdrawn = withdrawals.reduce((sum, w) => sum + Number(w.amount), 0);
      const currentBalance = Number(wallet?.balance || 0);
      const btcEquivalent = await this.KEStoBTC(currentBalance);

      const transactions: BTCTransaction[] = [
        ...deposits.map(d => ({
          id: d.id,
          userId: d.userId,
          type: 'DEPOSIT' as const,
          amountKES: Number(d.amount),
          amountBTC: 0, // Would be calculated from actual transaction
          feeKES: Number(d.amount) * 0.02,
          feeBTC: 0,
          status: 'CONFIRMED' as const,
          btcTxId: d.btcTxId,
          createdAt: d.createdAt,
          updatedAt: d.createdAt
        })),
        ...withdrawals.map(w => ({
          id: w.id,
          userId: w.userId,
          type: 'WITHDRAWAL' as const,
          amountKES: Number(w.amount),
          amountBTC: 0,
          feeKES: Number(w.amount) * 0.03,
          feeBTC: 0,
          status: 'PENDING' as const,
          btcTxId: w.btcTxId,
          createdAt: w.createdAt,
          updatedAt: w.createdAt
        }))
      ];

      return {
        currentBalance,
        totalDeposited,
        totalWithdrawn,
        btcEquivalent,
        transactions
      };
    } catch (error) {
      logger.error('Failed to get user balance:', error);
      throw error;
    }
  }

  /**
   * Process bet settlement with platform fee
   */
  async processBetSettlement(betId: string, winnerId: string, loserId: string, amount: number): Promise<void> {
    try {
      const platformFee = amount * this.BET_FEE_RATE;
      const winnerAmount = amount - platformFee;

      // Credit winner
      const winnerWallet = await prisma.wallet.findUnique({
        where: { userId: winnerId }
      });

      if (winnerWallet) {
        await prisma.wallet.update({
          where: { userId: winnerId },
          data: {
            balance: {
              increment: winnerAmount
            }
          }
        });
      }

      // Debit loser
      const loserWallet = await prisma.wallet.findUnique({
        where: { userId: loserId }
      });

      if (loserWallet) {
        await prisma.wallet.update({
          where: { userId: loserId },
          data: {
            balance: {
              decrement: amount
            }
          }
        });
      }

      // Record platform fee
      await prisma.platformFees.create({
        data: {
          userId: winnerId,
          type: 'BET',
          amount: platformFee,
          btcTxId: `BET_${betId}`,
          createdAt: new Date()
        }
      });

      logger.info('Bet settlement processed', {
        betId,
        winnerId,
        loserId,
        amount,
        platformFee,
        winnerAmount
      });
    } catch (error) {
      logger.error('Failed to process bet settlement:', error);
      throw error;
    }
  }
}

export const bitcoinService = new BitcoinService();
