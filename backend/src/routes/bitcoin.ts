import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { bitcoinService } from '../services/bitcoinService';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/wallet/btc/deposit - Generate BTC deposit address
router.post('/deposit', authenticateToken, [
  body('amountKES').isFloat({ min: 100 }).withMessage('Amount must be at least 100 KES')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amountKES } = req.body;
    const userId = req.user.id;

    const depositInfo = await bitcoinService.generateDepositAddress(userId, amountKES);
    
    // Generate QR code
    const qrCode = await bitcoinService.generateQRCode(
      depositInfo.address, 
      depositInfo.totalBTC
    );

    res.json({
      success: true,
      depositInfo: {
        ...depositInfo,
        qrCode
      }
    });
  } catch (error: any) {
    logger.error('BTC deposit error:', error);
    res.status(500).json({ 
      error: 'Failed to generate deposit address',
      details: error.message 
    });
  }
});

// POST /api/wallet/btc/withdraw - Process BTC withdrawal
router.post('/withdraw', authenticateToken, [
  body('btcAddress').isString().isLength({ min: 26, max: 62 }).withMessage('Invalid Bitcoin address'),
  body('amountKES').isFloat({ min: 500 }).withMessage('Minimum withdrawal is 500 KES')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { btcAddress, amountKES } = req.body;
    const userId = req.user.id;

    const withdrawalInfo = await bitcoinService.processWithdrawal(userId, btcAddress, amountKES);

    res.json({
      success: true,
      withdrawalInfo
    });
  } catch (error: any) {
    logger.error('BTC withdrawal error:', error);
    res.status(500).json({ 
      error: 'Failed to process withdrawal',
      details: error.message 
    });
  }
});

// POST /api/wallet/btc/webhook - OpenNode webhook
router.post('/webhook', async (req: any, res: any) => {
  try {
    // Verify OpenNode webhook signature if needed
    const event = req.body;
    await bitcoinService.handleWebhook(event);
    
    res.json({ received: true });
  } catch (error: any) {
    logger.error('BTC webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
});

// GET /api/wallet/balance - Get user balance and transaction history
router.get('/balance', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const balanceInfo = await bitcoinService.getUserBalance(userId);

    res.json({
      success: true,
      balanceInfo
    });
  } catch (error: any) {
    logger.error('Balance fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch balance',
      details: error.message 
    });
  }
});

export default router;
