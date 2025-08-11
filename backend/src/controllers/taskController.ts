import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../services/database';
import { OrgRequest } from '../middleware/organization';

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  locationId: z.string(),
  assignedAgentId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  estimatedDuration: z.number().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  isRecurring: z.boolean().optional(),
  templateId: z.string().optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedAgentId: z.string().optional(),
  estimatedDuration: z.number().positive().optional(),
  actualDuration: z.number().positive().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  templateId: z.string().optional(),
});

export const getTasks = async (req: OrgRequest, res: Response) => {
  try {
    const { status, assignedAgentId, locationId, startDate, endDate } = req.query;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    const where: any = {
      organizationId: req.organizationId
    };
    
    if (status && typeof status === 'string') {
      where.status = status;
    }
    
    if (assignedAgentId && typeof assignedAgentId === 'string') {
      where.assignedAgentId = assignedAgentId;
    }
    
    if (locationId && typeof locationId === 'string') {
      where.locationId = locationId;
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate && typeof startDate === 'string') {
        where.scheduledDate.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        where.scheduledDate.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // If user is an agent, only show their assigned tasks
    if (req.user?.role === 'AGENT') {
      where.assignedAgentId = req.user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTask = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    const task = await prisma.task.findFirst({
      where: { 
        id, 
        organizationId: req.organizationId 
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

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTask = async (req: OrgRequest, res: Response) => {
  try {
    const data = createTaskSchema.parse(req.body);

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    // Verify location exists in same organization
    const location = await prisma.location.findFirst({
      where: { 
        id: data.locationId,
        organizationId: req.organizationId 
      },
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Verify assigned agent exists in same organization if provided
    if (data.assignedAgentId) {
      const agent = await prisma.user.findFirst({
        where: { 
          id: data.assignedAgentId, 
          role: 'AGENT',
          organizationId: req.organizationId
        },
      });

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
    }

    const taskData = {
      ...data,
      organizationId: req.organizationId,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    };

    const task = await prisma.task.create({
      data: taskData,
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

    res.status(201).json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateTask = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    // Check if task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: { 
        id,
        organizationId: req.organizationId 
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Agents can only update their own tasks and only status/actualDuration
    if (req.user?.role === 'AGENT') {
      if (existingTask.assignedAgentId !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own tasks' });
      }

      // Agents can only update specific fields
      const allowedFields = ['status', 'actualDuration', 'startTime', 'endTime'];
      const providedFields = Object.keys(data);
      const invalidFields = providedFields.filter(field => !allowedFields.includes(field));
      
      if (invalidFields.length > 0) {
        return res.status(403).json({ 
          message: `Agents can only update: ${allowedFields.join(', ')}` 
        });
      }
    }

    // Verify assigned agent exists in same organization if being updated
    if (data.assignedAgentId) {
      const agent = await prisma.user.findFirst({
        where: { 
          id: data.assignedAgentId, 
          role: 'AGENT',
          organizationId: req.organizationId
        },
      });

      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
    }

    // Set completedAt when status changes to COMPLETED
    const updateData: any = { 
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      startTime: data.startTime ? new Date(data.startTime) : undefined,
      endTime: data.endTime ? new Date(data.endTime) : undefined,
    };
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (data.status !== 'COMPLETED' && data.status !== undefined) {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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

    res.json(task);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteTask = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    // Verify task exists and belongs to organization
    const existingTask = await prisma.task.findFirst({
      where: { 
        id,
        organizationId: req.organizationId 
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await prisma.task.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const startTask = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    const existingTask = await prisma.task.findFirst({
      where: { 
        id,
        organizationId: req.organizationId 
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user?.role === 'AGENT' && existingTask.assignedAgentId !== req.user.id) {
      return res.status(403).json({ message: 'You can only start your own tasks' });
    }

    if (existingTask.status !== 'PENDING') {
      return res.status(400).json({ message: 'Task must be in pending status to start' });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startTime: new Date(),
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

    res.json(task);
  } catch (error) {
    console.error('Start task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const completeTask = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    const existingTask = await prisma.task.findFirst({
      where: { 
        id,
        organizationId: req.organizationId 
      },
    });

    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (req.user?.role === 'AGENT' && existingTask.assignedAgentId !== req.user.id) {
      return res.status(403).json({ message: 'You can only complete your own tasks' });
    }

    if (existingTask.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Task must be in progress to complete' });
    }

    const now = new Date();
    let actualDuration: number | undefined;

    // Calculate actual duration if task was started
    if (existingTask.startTime) {
      const durationMs = now.getTime() - existingTask.startTime.getTime();
      actualDuration = Math.round(durationMs / 60000); // Convert to minutes
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endTime: now,
        completedAt: now,
        actualDuration: actualDuration || existingTask.actualDuration,
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

    res.json(task);
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAgentDayView = async (req: OrgRequest, res: Response) => {
  try {
    const { agentId, date } = req.params;

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organisation requise' });
    }

    // Check permissions
    if (req.user?.role === 'AGENT' && req.user.id !== agentId) {
      return res.status(403).json({ message: 'You can only view your own tasks' });
    }

    // Verify agent belongs to same organization
    const agent = await prisma.user.findFirst({
      where: { 
        id: agentId, 
        organizationId: req.organizationId 
      },
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        assignedAgentId: agentId,
        organizationId: req.organizationId,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
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
      orderBy: [
        { scheduledTime: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimatedDuration || 0), 0);
    const totalActualTime = tasks
      .filter(task => task.status === 'COMPLETED')
      .reduce((sum, task) => sum + (task.actualDuration || 0), 0);

    const agentDayView = {
      date: date,
      tasks,
      totalEstimatedTime,
      totalActualTime: totalActualTime > 0 ? totalActualTime : undefined,
    };

    res.json(agentDayView);
  } catch (error) {
    console.error('Get agent day view error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};