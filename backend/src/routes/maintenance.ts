import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { extractOrganization } from '../middleware/organization';
import { generateDailyTasksForAllAgents, resetAllTaskTimers, cleanupOldTasks, dailyMaintenance, smartDailyStartup, resetDailyTimers } from '../services/dailyTaskGenerator';
import { 
  getScheduledTaskStatus, 
  testScheduledGeneration, 
  forceGenerateToday, 
  generateForDate,
  getUpcomingGenerations
} from '../services/scheduledTaskGenerator';
import { AuthRequest } from '../types';
import { Response } from 'express';

const router = Router();

router.use(requireAuth);
router.use(extractOrganization);

// Smart daily startup (recommended for automatic/cron use)
router.post('/smart-startup', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    await smartDailyStartup(targetDate);
    
    res.json({ 
      message: 'Smart daily startup completed - timers reset, tasks generated only if needed',
      date: targetDate.toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Smart startup error:', error);
    res.status(500).json({ 
      message: 'Failed to execute smart startup',
      error: error.message 
    });
  }
});

// Generate daily tasks for all agents
router.post('/generate-daily-tasks', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { date, forceRegenerate = false } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    await generateDailyTasksForAllAgents(targetDate, forceRegenerate);
    
    res.json({ 
      message: forceRegenerate 
        ? 'Daily tasks regenerated successfully (existing tasks replaced)'
        : 'Daily tasks generated successfully',
      date: targetDate.toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Generate daily tasks error:', error);
    res.status(500).json({ 
      message: 'Failed to generate daily tasks',
      error: error.message 
    });
  }
});

// Just reset timers (preserve task assignments)
router.post('/reset-daily-timers', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    await resetDailyTimers(targetDate);
    
    res.json({ 
      message: 'Daily timers reset successfully - task assignments preserved',
      date: targetDate.toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Reset daily timers error:', error);
    res.status(500).json({ 
      message: 'Failed to reset daily timers',
      error: error.message 
    });
  }
});

// Reset task timers
router.post('/reset-timers', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    await resetAllTaskTimers(targetDate);
    
    res.json({ 
      message: 'Task timers reset successfully',
      date: targetDate.toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Reset timers error:', error);
    res.status(500).json({ 
      message: 'Failed to reset task timers',
      error: error.message 
    });
  }
});

// Cleanup old tasks
router.delete('/cleanup-old-tasks', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { daysToKeep = 30 } = req.body;
    
    await cleanupOldTasks(daysToKeep);
    
    res.json({ 
      message: `Old tasks cleaned up successfully (kept last ${daysToKeep} days)`
    });
  } catch (error: any) {
    console.error('Cleanup old tasks error:', error);
    res.status(500).json({ 
      message: 'Failed to cleanup old tasks',
      error: error.message 
    });
  }
});

// Full daily maintenance
router.post('/daily-maintenance', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await dailyMaintenance();
    
    res.json({ 
      message: 'Daily maintenance completed successfully',
      date: new Date().toLocaleDateString('fr-FR'),
      actions: [
        'Generated daily tasks for all agents',
        'Reset task timers',
        'Cleaned up old tasks (30+ days)'
      ]
    });
  } catch (error: any) {
    console.error('Daily maintenance error:', error);
    res.status(500).json({ 
      message: 'Daily maintenance failed',
      error: error.message 
    });
  }
});

// Get maintenance status
router.get('/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Count tasks for today
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const tasksToday = await prisma.task.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    const agents = await prisma.user.count({
      where: { role: 'AGENT' }
    });

    const tasksInProgress = await prisma.task.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: 'IN_PROGRESS'
      }
    });

    const tasksCompleted = await prisma.task.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay
        },
        status: 'COMPLETED'
      }
    });

    await prisma.$disconnect();

    res.json({
      date: today.toLocaleDateString('fr-FR'),
      stats: {
        totalAgents: agents,
        tasksToday: tasksToday,
        tasksInProgress: tasksInProgress,
        tasksCompleted: tasksCompleted,
        tasksAverage: agents > 0 ? Math.round(tasksToday / agents) : 0
      },
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Maintenance status error:', error);
    res.status(500).json({ 
      message: 'Failed to get maintenance status',
      error: error.message 
    });
  }
});

// === NOUVELLES ROUTES POUR LE SYSTÈME AUTOMATIQUE ===

// Statut du système de génération automatique
router.get('/auto-status', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const status = getScheduledTaskStatus();
    const upcoming = getUpcomingGenerations();
    
    res.json({
      message: 'Statut du système automatique',
      autoGeneration: status,
      upcomingGenerations: upcoming
    });
  } catch (error: any) {
    console.error('Auto status error:', error);
    res.status(500).json({ 
      message: 'Failed to get automatic system status',
      error: error.message 
    });
  }
});

// Forcer génération immédiate pour aujourd'hui
router.post('/force-generate-today', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await forceGenerateToday();
    
    res.json({
      message: 'Génération forcée pour aujourd\'hui terminée',
      date: new Date().toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Force generate today error:', error);
    res.status(500).json({ 
      message: 'Failed to force generate tasks for today',
      error: error.message 
    });
  }
});

// Générer pour une date spécifique
router.post('/generate-for-date', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    
    const targetDate = new Date(date);
    await generateForDate(targetDate);
    
    res.json({
      message: `Génération terminée pour ${targetDate.toLocaleDateString('fr-FR')}`,
      date: targetDate.toLocaleDateString('fr-FR')
    });
  } catch (error: any) {
    console.error('Generate for date error:', error);
    res.status(500).json({ 
      message: 'Failed to generate tasks for specified date',
      error: error.message 
    });
  }
});

// Test du système automatique
router.post('/test-auto-generation', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await testScheduledGeneration();
    
    res.json({
      message: 'Test du système automatique réussi',
      note: 'Vérifiez les logs pour les détails'
    });
  } catch (error: any) {
    console.error('Test auto generation error:', error);
    res.status(500).json({ 
      message: 'Test du système automatique échoué',
      error: error.message 
    });
  }
});

export default router;