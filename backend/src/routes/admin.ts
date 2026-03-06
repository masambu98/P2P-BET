import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getUsers, getBets, settleBet, getStats, approveWithdrawal, rejectWithdrawal } from '../controllers/adminController';

const router = Router();

router.get('/users', authenticateToken, requireAdmin, getUsers);
router.get('/bets', authenticateToken, requireAdmin, getBets);
router.post('/bets/:id/settle', authenticateToken, requireAdmin, settleBet);
router.get('/stats', authenticateToken, requireAdmin, getStats);
router.post('/withdrawals/:id/approve', authenticateToken, requireAdmin, approveWithdrawal);
router.post('/withdrawals/:id/reject', authenticateToken, requireAdmin, rejectWithdrawal);

export { router as adminRoutes };
