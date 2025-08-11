import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, CreateCleaningTemplateRequest, UpdateCleaningTemplateRequest, TimeSlot } from '../types';

const prisma = new PrismaClient();

export const getTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { agentId } = req.query;

    const whereClause = agentId ? { agentId: agentId as string } : {};

    const templates = await prisma.cleaningTemplate.findMany({
      where: whereClause,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ message: 'Failed to fetch templates' });
  }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.cleaningTemplate.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            location: true,
          },
          orderBy: {
            scheduledTime: 'asc',
          },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ message: 'Failed to fetch template' });
  }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const data: CreateCleaningTemplateRequest = req.body;

    // Validate JSON format for timeSlots
    try {
      JSON.parse(data.timeSlots);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid timeSlots JSON format' });
    }

    const template = await prisma.cleaningTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        agentId: data.agentId,
        timeSlots: data.timeSlots,
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ message: 'Failed to create template' });
  }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateCleaningTemplateRequest = req.body;

    // Validate JSON format for timeSlots if provided
    if (data.timeSlots) {
      try {
        JSON.parse(data.timeSlots);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid timeSlots JSON format' });
      }
    }

    const template = await prisma.cleaningTemplate.update({
      where: { id },
      data,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ message: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.cleaningTemplate.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ message: 'Failed to delete template' });
  }
};

export const generateTasksFromTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const template = await prisma.cleaningTemplate.findUnique({
      where: { id },
      include: {
        agent: true,
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Parse time slots
    const timeSlots: TimeSlot[] = JSON.parse(template.timeSlots);
    const tasks = [];
    const scheduledDate = new Date(date);

    // Generate tasks for each time slot
    for (const slot of timeSlots) {
      for (const locationTask of slot.locations) {
        const location = await prisma.location.findUnique({
          where: { id: locationTask.locationId },
        });

        if (!location) continue;

        // Create task
        const task = await prisma.task.create({
          data: {
            title: `Nettoyage ${location.name}`,
            description: `Nettoyage programmé - ${slot.period}`,
            locationId: location.id,
            assignedAgentId: template.agentId,
            priority: 'MEDIUM',
            estimatedDuration: locationTask.estimatedDuration,
            scheduledDate: scheduledDate,
            scheduledTime: slot.startTime,
            isRecurring: true,
            templateId: template.id,
            status: 'PENDING',
            organizationId: template.organizationId || location.organizationId,
          },
          include: {
            location: true,
            assignedAgent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        tasks.push(task);
      }
    }

    res.status(201).json(tasks);
  } catch (error) {
    console.error('Error generating tasks from template:', error);
    res.status(500).json({ message: 'Failed to generate tasks from template' });
  }
};

// Helper function to calculate estimated duration based on surface
export const calculateEstimatedDuration = (surface?: number, coefficient: number = 1.2): number => {
  if (!surface) return 30; // Default 30 minutes if no surface
  return Math.ceil(surface * coefficient);
};