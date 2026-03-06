import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  createRoom, 
  getRooms, 
  getRoom, 
  joinRoom, 
  leaveRoom, 
  sendMessage, 
  getMyRooms 
} from '../controllers/roomController.js';

const router = Router();

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoom);

// Protected routes
router.post('/', authenticateToken, createRoom);
router.post('/join', authenticateToken, joinRoom);
router.post('/leave', authenticateToken, leaveRoom);
router.post('/message', authenticateToken, sendMessage);
router.get('/my-rooms', authenticateToken, getMyRooms);

export { router as roomRoutes };
