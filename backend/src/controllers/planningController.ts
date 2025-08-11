import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  AuthRequest, 
  CreatePlanningTemplateRequest,
  UpdatePlanningTemplateRequest,
  GeneratePlanningRequest,
  PlanningConfig,
  LocationConfig,
  PlanningPreview,
  TaskPreview,
  PlanningTemplateWithConfig
} from '../types';

const prisma = new PrismaClient();

// Helper function to calculate duration based on location
const calculateLocationDuration = (location: any): number => {
  if (!location.surface || !location.cleaningCoefficient) {
    // Default durations by type if no surface data
    const defaultDurations: { [key: string]: number } = {
      'infirmerie': 20,
      'classe': 15,
      'sanitaire': 30,
      'bureau': 10,
      'atelier': 25
    };
    return defaultDurations[location.type] || 15;
  }
  return Math.ceil(location.surface * location.cleaningCoefficient);
};

// Helper function to convert time string to minutes
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes to time string
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Intelligent scheduling algorithm
const generateSchedule = async (config: PlanningConfig, locations: any[]): Promise<PlanningPreview> => {
  const workStartMinutes = timeToMinutes(config.workStart);
  const workEndMinutes = timeToMinutes(config.workEnd);
  const breakStartMinutes = config.breakStart ? timeToMinutes(config.breakStart) : null;
  const breakEndMinutes = config.breakEnd ? timeToMinutes(config.breakEnd) : null;

  // Sort locations by priority
  const sortedLocations = [...config.locations].sort((a, b) => a.priority - b.priority);
  
  const tasks: TaskPreview[] = [];
  const conflicts: string[] = [];
  const warnings: string[] = [];
  let currentTime = workStartMinutes;

  for (const locationConfig of sortedLocations) {
    const location = locations.find(l => l.id === locationConfig.locationId);
    if (!location) {
      conflicts.push(`Lieu introuvable: ${locationConfig.locationId}`);
      continue;
    }

    const duration = locationConfig.estimatedDuration || calculateLocationDuration(location);
    
    // Check time slot constraints
    let scheduledStartTime = currentTime;
    
    switch (locationConfig.timeSlot) {
      case 'morning':
        if (currentTime >= (breakStartMinutes || 660)) { // 11h00 default
          warnings.push(`${location.name}: Planifié pour le matin mais programmé après 11h`);
        }
        break;
      case 'beforeBreak':
        if (breakStartMinutes && currentTime + duration > breakStartMinutes) {
          conflicts.push(`${location.name}: Ne peut pas être terminé avant la pause`);
        }
        break;
      case 'afterBreak':
        if (breakEndMinutes && currentTime < breakEndMinutes) {
          scheduledStartTime = breakEndMinutes;
          currentTime = breakEndMinutes;
        }
        break;
      case 'afternoon':
        const afternoonStart = breakEndMinutes || 720; // 12h00 default
        if (currentTime < afternoonStart) {
          scheduledStartTime = afternoonStart;
          currentTime = afternoonStart;
        }
        break;
    }

    // Handle break time
    if (breakStartMinutes && breakEndMinutes) {
      if (currentTime < breakStartMinutes && currentTime + duration > breakStartMinutes) {
        if (locationConfig.timeSlot === 'beforeBreak') {
          conflicts.push(`${location.name}: Chevauche avec la pause déjeuner`);
        } else {
          // Split around break or move after break
          currentTime = breakEndMinutes;
          scheduledStartTime = breakEndMinutes;
          warnings.push(`${location.name}: Déplacé après la pause pour éviter les chevauchements`);
        }
      } else if (currentTime >= breakStartMinutes && currentTime < breakEndMinutes) {
        currentTime = breakEndMinutes;
        scheduledStartTime = breakEndMinutes;
      }
    }

    const endTime = scheduledStartTime + duration;

    // Check if task fits within work hours
    if (endTime > workEndMinutes) {
      conflicts.push(`${location.name}: Ne peut pas être terminé avant ${config.workEnd}`);
      break;
    }

    tasks.push({
      locationName: location.name,
      startTime: minutesToTime(scheduledStartTime),
      endTime: minutesToTime(endTime),
      duration,
      priority: locationConfig.priority,
      timeSlot: locationConfig.timeSlot
    });

    currentTime = endTime;
  }

  const totalDuration = tasks.reduce((sum, task) => sum + task.duration, 0);

  return {
    totalDuration,
    tasks,
    conflicts,
    warnings
  };
};

// Get all planning templates
export const getPlanningTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.planningTemplate.findMany({
      where: { isActive: true },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const templatesWithConfig = templates.map(template => ({
      ...template,
      // Parse weekly schedule if it exists and is not empty, otherwise parse locations for legacy mode
      weeklySchedule: template.weeklySchedule && template.weeklySchedule.trim() !== "" ? JSON.parse(template.weeklySchedule) : undefined,
      locations: template.locations && template.locations.trim() !== "" ? JSON.parse(template.locations) : []
    }));

    res.json(templatesWithConfig);
  } catch (error) {
    console.error('Error fetching planning templates:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des templates' });
  }
};

// Get specific planning template
export const getPlanningTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const template = await prisma.planningTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template non trouvé' });
    }

    const templateWithConfig = {
      ...template,
      // Parse weekly schedule if it exists and is not empty, otherwise parse locations for legacy mode
      weeklySchedule: template.weeklySchedule && template.weeklySchedule.trim() !== "" ? JSON.parse(template.weeklySchedule) : undefined,
      locations: template.locations && template.locations.trim() !== "" ? JSON.parse(template.locations) : []
    };

    res.json(templateWithConfig);
  } catch (error) {
    console.error('Error fetching planning template:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du template' });
  }
};

// Create new planning template (Admin only)
export const createPlanningTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const data: CreatePlanningTemplateRequest = req.body;

    // Handle weekly schedule vs legacy mode
    if (data.weeklySchedule) {
      // New weekly planning mode - validate each day
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const dayKey of days) {
        const day = data.weeklySchedule[dayKey as keyof typeof data.weeklySchedule];
        if (day && day.isActive !== false) {
          const workStart = timeToMinutes(day.workStart);
          const workEnd = timeToMinutes(day.workEnd);
          
          if (workStart >= workEnd) {
            return res.status(400).json({ error: `Heure de fin invalide pour ${dayKey}` });
          }
          
          if (day.breakStart && day.breakEnd) {
            const breakStart = timeToMinutes(day.breakStart);
            const breakEnd = timeToMinutes(day.breakEnd);
            
            if (breakStart >= breakEnd || breakStart <= workStart || breakEnd >= workEnd) {
              return res.status(400).json({ error: `Heures de pause invalides pour ${dayKey}` });
            }
          }
        }
      }
      
      const template = await prisma.planningTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          weeklySchedule: JSON.stringify(data.weeklySchedule),
          workStart: null, // Legacy field, set to null for weekly mode
          workEnd: null,   // Legacy field, set to null for weekly mode  
          breakStart: null,
          breakEnd: null,
          locations: null, // Legacy field, set to null for weekly mode
          isDefault: data.isDefault || false,
          createdBy: req.user!.id,
          organizationId: req.user!.organizationId
        },
        include: {
          creator: {
            select: { id: true, name: true }
          }
        }
      });
      
      res.status(201).json({
        ...template,
        weeklySchedule: template.weeklySchedule && template.weeklySchedule.trim() !== "" ? JSON.parse(template.weeklySchedule) : undefined
      });
    } else {
      // Legacy single-day mode validation
      if (!data.workStart || !data.workEnd) {
        return res.status(400).json({ error: 'Horaires de travail requis' });
      }
      
      const workStart = timeToMinutes(data.workStart);
      const workEnd = timeToMinutes(data.workEnd);
      
      if (workStart >= workEnd) {
        return res.status(400).json({ error: 'L\'heure de fin doit être après l\'heure de début' });
      }

      if (data.breakStart && data.breakEnd) {
        const breakStart = timeToMinutes(data.breakStart);
        const breakEnd = timeToMinutes(data.breakEnd);
        
        if (breakStart >= breakEnd || breakStart <= workStart || breakEnd >= workEnd) {
          return res.status(400).json({ error: 'Heures de pause invalides' });
        }
      }

      const template = await prisma.planningTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          weeklySchedule: "", // Empty string for legacy mode
          workStart: data.workStart,
          workEnd: data.workEnd,
          breakStart: data.breakStart,
          breakEnd: data.breakEnd,
          locations: JSON.stringify(data.locations || []),
          isDefault: data.isDefault || false,
          createdBy: req.user!.id,
          organizationId: req.user!.organizationId
        },
        include: {
          creator: {
            select: { id: true, name: true }
          }
        }
      });

      res.status(201).json({
        ...template,
        locations: template.locations ? JSON.parse(template.locations) : []
      });
    }
  } catch (error) {
    console.error('Error creating planning template:', error);
    res.status(500).json({ error: 'Erreur lors de la création du template' });
  }
};

// Update planning template (Admin only)
export const updatePlanningTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;
    const data: UpdatePlanningTemplateRequest = req.body;

    const template = await prisma.planningTemplate.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        weeklySchedule: data.weeklySchedule ? JSON.stringify(data.weeklySchedule) : undefined,
        workStart: data.workStart,
        workEnd: data.workEnd,
        breakStart: data.breakStart,
        breakEnd: data.breakEnd,
        locations: data.locations ? JSON.stringify(data.locations) : undefined,
        isDefault: data.isDefault,
        isActive: data.isActive
      },
      include: {
        creator: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      ...template,
      weeklySchedule: template.weeklySchedule && template.weeklySchedule.trim() !== "" ? JSON.parse(template.weeklySchedule) : undefined,
      locations: template.locations && template.locations.trim() !== "" ? JSON.parse(template.locations) : []
    });
  } catch (error) {
    console.error('Error updating planning template:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du template' });
  }
};

// Delete planning template (Admin only)
export const deletePlanningTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { id } = req.params;

    await prisma.planningTemplate.delete({
      where: { id }
    });

    res.json({ message: 'Template supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting planning template:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du template' });
  }
};

// Preview planning before generation
export const previewPlanning = async (req: AuthRequest, res: Response) => {
  try {
    const data: GeneratePlanningRequest = req.body;
    
    let config: PlanningConfig;
    
    if (data.templateId) {
      const template = await prisma.planningTemplate.findUnique({
        where: { id: data.templateId }
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template non trouvé' });
      }
      
      const locations: LocationConfig[] = template.locations && template.locations.trim() !== "" ? JSON.parse(template.locations) : [];
      config = {
        agentId: data.agentId,
        workStart: (template.workStart || "07:00") as string,
        workEnd: (template.workEnd || "15:30") as string,
        breakStart: template.breakStart || undefined,
        breakEnd: template.breakEnd || undefined,
        locations
      };
    } else if (data.config) {
      config = data.config;
    } else {
      return res.status(400).json({ error: 'Template ou configuration requis' });
    }

    // Get all locations data
    const locationIds = config.locations.map(l => l.locationId);
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } }
    });

    const preview = await generateSchedule(config, locations);
    res.json(preview);
  } catch (error) {
    console.error('Error generating planning preview:', error);
    res.status(500).json({ error: 'Erreur lors de la prévisualisation du planning' });
  }
};

// Generate actual planning
export const generatePlanning = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const data: GeneratePlanningRequest = req.body;
    const scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : new Date();
    
    // Verify agent exists
    const agent = await prisma.user.findUnique({
      where: { id: data.agentId, role: 'AGENT' }
    });
    
    if (!agent) {
      return res.status(404).json({ error: 'Agent non trouvé' });
    }

    let config: PlanningConfig;
    
    if (data.templateId) {
      const template = await prisma.planningTemplate.findUnique({
        where: { id: data.templateId }
      });
      
      if (!template) {
        return res.status(404).json({ error: 'Template non trouvé' });
      }
      
      const locations: LocationConfig[] = template.locations && template.locations.trim() !== "" ? JSON.parse(template.locations) : [];
      config = {
        agentId: data.agentId,
        workStart: (template.workStart || "07:00") as string,
        workEnd: (template.workEnd || "15:30") as string,
        breakStart: template.breakStart || undefined,
        breakEnd: template.breakEnd || undefined,
        locations,
        templateId: data.templateId
      };
    } else if (data.config) {
      config = data.config;
    } else {
      return res.status(400).json({ error: 'Template ou configuration requis' });
    }

    // Get all locations data
    const locationIds = config.locations.map(l => l.locationId);
    const locations = await prisma.location.findMany({
      where: { id: { in: locationIds } }
    });

    const preview = await generateSchedule(config, locations);
    
    if (preview.conflicts.length > 0) {
      return res.status(400).json({ 
        error: 'Conflits détectés dans le planning', 
        conflicts: preview.conflicts 
      });
    }

    // Delete existing planning if requested
    if (data.replaceExisting) {
      await prisma.task.deleteMany({
        where: {
          assignedAgentId: data.agentId,
          scheduledDate: {
            gte: new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate()),
            lt: new Date(scheduledDate.getFullYear(), scheduledDate.getMonth(), scheduledDate.getDate() + 1)
          }
        }
      });
    }

    // Create tasks from preview
    const tasks = [];
    for (const taskPreview of preview.tasks) {
      const location = locations.find(l => l.name === taskPreview.locationName);
      if (!location) continue;

      const [startHours, startMinutes] = taskPreview.startTime.split(':').map(Number);
      const taskDate = new Date(scheduledDate);
      taskDate.setHours(startHours, startMinutes, 0, 0);

      const task = await prisma.task.create({
        data: {
          title: `Entretien ${location.name}`,
          description: `Tâche générée automatiquement - ${taskPreview.timeSlot}`,
          locationId: location.id,
          assignedAgentId: data.agentId,
          status: 'PENDING',
          priority: 'MEDIUM',
          estimatedDuration: taskPreview.duration,
          scheduledDate: taskDate,
          scheduledTime: taskPreview.startTime,
          isRecurring: false,
          templateId: config.templateId,
          organizationId: location.organizationId
        }
      });
      
      tasks.push(task);
    }

    res.status(201).json({
      message: `Planning généré avec succès pour ${agent.name}`,
      tasksCreated: tasks.length,
      totalDuration: preview.totalDuration,
      warnings: preview.warnings,
      tasks: tasks
    });
  } catch (error) {
    console.error('Error generating planning:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du planning' });
  }
};

// Duplicate planning from one agent to another
export const duplicatePlanning = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { sourceAgentId, targetAgentId, date } = req.body;
    
    if (!sourceAgentId || !targetAgentId) {
      return res.status(400).json({ error: 'IDs des agents source et cible requis' });
    }

    const scheduleDate = date ? new Date(date) : new Date();
    
    // Get source agent's tasks for the date
    const sourceTasks = await prisma.task.findMany({
      where: {
        assignedAgentId: sourceAgentId,
        scheduledDate: {
          gte: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()),
          lt: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 1)
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    if (sourceTasks.length === 0) {
      return res.status(404).json({ error: 'Aucune tâche trouvée pour l\'agent source' });
    }

    // Delete existing tasks for target agent on that date
    await prisma.task.deleteMany({
      where: {
        assignedAgentId: targetAgentId,
        scheduledDate: {
          gte: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()),
          lt: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 1)
        }
      }
    });

    // Duplicate tasks
    const newTasks = [];
    for (const task of sourceTasks) {
      const newTask = await prisma.task.create({
        data: {
          title: task.title,
          description: `${task.description} (Copié)`,
          locationId: task.locationId,
          assignedAgentId: targetAgentId,
          status: 'PENDING',
          priority: task.priority,
          estimatedDuration: task.estimatedDuration,
          scheduledDate: task.scheduledDate,
          scheduledTime: task.scheduledTime,
          isRecurring: task.isRecurring,
          templateId: task.templateId,
          organizationId: task.organizationId
        }
      });
      newTasks.push(newTask);
    }

    res.json({
      message: 'Planning dupliqué avec succès',
      tasksCreated: newTasks.length,
      tasks: newTasks
    });
  } catch (error) {
    console.error('Error duplicating planning:', error);
    res.status(500).json({ error: 'Erreur lors de la duplication du planning' });
  }
};

// Delete all planning for an agent on a specific date
export const deleteAgentPlanning = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { agentId } = req.params;
    const { date } = req.query;
    
    const scheduleDate = date ? new Date(date as string) : new Date();
    
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        assignedAgentId: agentId,
        scheduledDate: {
          gte: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate()),
          lt: new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate() + 1)
        }
      }
    });

    res.json({
      message: 'Planning supprimé avec succès',
      tasksDeleted: deletedTasks.count
    });
  } catch (error) {
    console.error('Error deleting agent planning:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du planning' });
  }
};