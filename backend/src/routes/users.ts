import { Router } from 'express';
import { getUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/userController';
import { authenticateToken, requireAdmin, requireAdminOrOwner } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';

const router = Router();

router.use(authenticateToken);
router.use(extractOrganization);

router.get('/', getUsers);
router.get('/:id', requireAdminOrOwner, getUser);
router.post('/', requireAdmin, createUser);
router.put('/:id', requireAdmin, updateUser);
router.delete('/:id', requireAdmin, deleteUser);

export default router;