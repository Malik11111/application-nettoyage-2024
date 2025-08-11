import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { requireSuperAdmin, extractOrganization } from '../middleware/organization';
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  createOrganizationAdmin,
  getOrganizationStats
} from '../controllers/organizationController';

const router = Router();

// Appliquer les middlewares sur toutes les routes
router.use(requireAuth);
router.use(extractOrganization);

// Routes Super Admin seulement
router.post('/', requireSuperAdmin, createOrganization);
router.get('/', requireSuperAdmin, getOrganizations);
router.post('/:organizationId/admin', requireSuperAdmin, createOrganizationAdmin);

// Routes accessibles par Admin de l'organisation et Super Admin
router.get('/:id', requireAdmin, getOrganization);
router.put('/:id', requireAdmin, updateOrganization);
router.get('/:id/stats', requireAdmin, getOrganizationStats);

export default router;