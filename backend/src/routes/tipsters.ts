import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getTipsters, 
  applyForTipster, 
  getTips, 
  purchaseTip, 
  getMyTips, 
  createTip,
  approveTipster
} from '../controllers/tipsterController.js';

const router = Router();

// Public routes
router.get('/', getTipsters);
router.get('/tips', getTips);

// Protected routes
router.post('/apply', authenticateToken, applyForTipster);
router.post('/purchase', authenticateToken, purchaseTip);
router.get('/my-tips', authenticateToken, getMyTips);
router.post('/create', authenticateToken, createTip);

// Admin routes
router.patch('/:tipsterId/approve', authenticateToken, approveTipster);

export { router as tipsterRoutes };
