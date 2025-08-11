import { Router } from 'express';
import { getLocations, getLocation, createLocation, updateLocation, deleteLocation } from '../controllers/locationController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';

const router = Router();

router.use(authenticateToken);
router.use(extractOrganization);

router.get('/', getLocations);
router.get('/:id', getLocation);
router.post('/', requireAdmin, createLocation);
router.put('/:id', requireAdmin, updateLocation);
router.delete('/:id', requireAdmin, deleteLocation);

export default router;