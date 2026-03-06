import { Router } from 'express';
import { body } from 'express-validator';
import {
  initiateMpesaDeposit,
  handleMpesaCallback,
  // initiateStripeDeposit,
  // handleStripeWebhook,
  getTransactionStatus,
  getUserTransactions,
  requestWithdrawal
} from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// M-Pesa routes
router.post('/mpesa/deposit', 
  authenticateToken,
  [
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('phoneNumber').matches(/^(?:\+254|0)?[17]\d{8}$/).withMessage('Invalid Kenyan phone number'),
    body('amount').isFloat({ min: 100 }).withMessage('Minimum deposit is KES 100')
  ],
  validateRequest,
  initiateMpesaDeposit
);

router.post('/mpesa/callback', handleMpesaCallback);

// Stripe routes disabled - using M-Pesa only
/*
router.post('/stripe/deposit',
  authenticateToken,
  [
    body('amount').isFloat({ min: 100 }).withMessage('Minimum deposit is KES 100')
  ],
  validateRequest,
  initiateStripeDeposit
);

router.post('/stripe/webhook', handleStripeWebhook);
*/

// General payment routes
router.get('/transactions',
  authenticateToken,
  getUserTransactions
);

router.get('/transactions/:transactionId',
  authenticateToken,
  getTransactionStatus
);

router.post('/withdrawal',
  authenticateToken,
  [
    body('amount').isFloat({ min: 500 }).withMessage('Minimum withdrawal is KES 500'),
    body('method').isIn(['mpesa', 'bank']).withMessage('Invalid payment method'),
    body('destination').notEmpty().withMessage('Destination is required')
  ],
  validateRequest,
  requestWithdrawal
);

export { router as paymentRoutes };
