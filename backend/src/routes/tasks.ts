import { Router } from 'express';
import { 
  getTasks, 
  getTask, 
  createTask, 
  updateTask, 
  deleteTask, 
  startTask, 
  completeTask, 
  getAgentDayView 
} from '../controllers/taskController';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';

const router = Router();

router.use(requireAuth);
router.use(extractOrganization);

router.get('/', getTasks);
router.get('/:id', getTask);
router.get('/agent/:agentId/day/:date', getAgentDayView);
router.post('/', requireAdmin, createTask);
router.post('/:id/start', startTask); // Agents can start their own tasks
router.post('/:id/complete', completeTask); // Agents can complete their own tasks
router.put('/:id', updateTask); // Agents can update their own tasks
router.delete('/:id', requireAdmin, deleteTask);

export default router;