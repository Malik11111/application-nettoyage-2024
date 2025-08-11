import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';
import {
  getPlanningTemplates,
  getPlanningTemplate,
  createPlanningTemplate,
  updatePlanningTemplate,
  deletePlanningTemplate,
  generatePlanning,
  previewPlanning,
  duplicatePlanning,
  deleteAgentPlanning,
} from '../controllers/planningController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(extractOrganization);

// Planning Template Routes (Admin only)
router.get('/templates', getPlanningTemplates);
router.get('/templates/:id', getPlanningTemplate);
router.post('/templates', createPlanningTemplate);
router.put('/templates/:id', updatePlanningTemplate);
router.delete('/templates/:id', deletePlanningTemplate);

// Planning Generation Routes
router.post('/generate', generatePlanning);
router.post('/preview', previewPlanning);
router.post('/duplicate', duplicatePlanning);
router.delete('/agent/:agentId', deleteAgentPlanning);

export default router;