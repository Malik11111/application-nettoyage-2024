import { Router } from 'express';
import { getDashboardStats, getAgentStats } from '../controllers/dashboardController';
import { authenticateToken, requireAdminOrOwner } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';

const router = Router();

router.use(authenticateToken);
router.use(extractOrganization);

router.get('/stats', getDashboardStats);
router.get('/agent/:id', requireAdminOrOwner, getAgentStats);

export default router;