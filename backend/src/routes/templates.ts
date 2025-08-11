import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';
import {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generateTasksFromTemplate,
} from '../controllers/templateController';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(extractOrganization);

// Get all templates (with optional filter by agent)
router.get('/', getTemplates);

// Get a specific template
router.get('/:id', getTemplate);

// Create a new template (admin only)
router.post('/', createTemplate);

// Update a template (admin only)
router.put('/:id', updateTemplate);

// Delete a template (admin only)
router.delete('/:id', deleteTemplate);

// Generate tasks from template
router.post('/:id/generate', generateTasksFromTemplate);

export default router;