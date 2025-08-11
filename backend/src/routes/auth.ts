import { Router } from 'express';
import { login, getCurrentUser, refreshToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/refresh', authenticateToken, refreshToken);

export default router;