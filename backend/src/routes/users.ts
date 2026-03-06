import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getUserProfile, 
  followUser, 
  unfollowUser, 
  getFollowers, 
  getFollowing 
} from '../controllers/userController.js';

const router = Router();

// Public routes
router.get('/:username/profile', getUserProfile); // Profile can be viewed without auth, but follow status requires auth

// Protected routes (require authentication)
router.post('/:userId/follow', authenticateToken, followUser);
router.delete('/:userId/follow', authenticateToken, unfollowUser);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);

export { router as userRoutes };
