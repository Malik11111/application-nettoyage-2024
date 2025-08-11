import { Request, Response } from 'express';
import prisma from '../services/database';
import { DashboardStats, AgentStats } from '../types';
import { OrgRequest } from '../middleware/organization';

export const getDashboardStats = async (req: OrgRequest, res: Response) => {
  try {
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID required' });
    }

    // Get total task counts filtered by organization
    const totalTasks = await prisma.task.count({
      where: { organizationId }
    });
    const completedTasks = await prisma.task.count({
      where: { status: 'COMPLETED', organizationId },
    });
    const inProgressTasks = await prisma.task.count({
      where: { status: 'IN_PROGRESS', organizationId },
    });
    const pendingTasks = await prisma.task.count({
      where: { status: 'PENDING', organizationId },
    });

    // Get total agent count filtered by organization
    const totalAgents = await prisma.user.count({
      where: { role: 'AGENT', organizationId },
    });

    // Get detailed agent statistics filtered by organization
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT', organizationId },
      include: {
        assignedTasks: {
          select: {
            id: true,
            status: true,
            actualDuration: true,
            estimatedDuration: true,
          },
        },
      },
    });

    const agentStats: AgentStats[] = agents.map(agent => {
      const totalTasks = agent.assignedTasks.length;
      const completedTasks = agent.assignedTasks.filter(task => task.status === 'COMPLETED').length;
      const inProgressTasks = agent.assignedTasks.filter(task => task.status === 'IN_PROGRESS').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Calculate total hours from completed tasks
      const totalMinutes = agent.assignedTasks
        .filter(task => task.status === 'COMPLETED' && task.actualDuration)
        .reduce((sum, task) => sum + (task.actualDuration || 0), 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

      return {
        id: agent.id,
        name: agent.name,
        totalTasks,
        completedTasks,
        inProgressTasks,
        completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
        totalHours,
      };
    });

    const stats: DashboardStats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      totalAgents,
      agentStats,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAgentStats = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const organizationId = req.organizationId;

    if (!organizationId) {
      return res.status(400).json({ message: 'Organization ID required' });
    }

    const agent = await prisma.user.findUnique({
      where: { id, role: 'AGENT', organizationId },
      include: {
        assignedTasks: {
          include: {
            location: {
              select: {
                name: true,
                floor: true,
                type: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const totalTasks = agent.assignedTasks.length;
    const completedTasks = agent.assignedTasks.filter(task => task.status === 'COMPLETED').length;
    const inProgressTasks = agent.assignedTasks.filter(task => task.status === 'IN_PROGRESS').length;
    const pendingTasks = agent.assignedTasks.filter(task => task.status === 'PENDING').length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Calculate performance metrics
    const completedTasksWithDuration = agent.assignedTasks.filter(
      task => task.status === 'COMPLETED' && task.actualDuration && task.estimatedDuration
    );

    const averageEfficiency = completedTasksWithDuration.length > 0 
      ? completedTasksWithDuration.reduce((sum, task) => {
          const efficiency = (task.estimatedDuration! / task.actualDuration!) * 100;
          return sum + efficiency;
        }, 0) / completedTasksWithDuration.length
      : 100;

    const totalMinutes = agent.assignedTasks
      .filter(task => task.status === 'COMPLETED' && task.actualDuration)
      .reduce((sum, task) => sum + (task.actualDuration || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Group tasks by location for location-based stats
    const locationStats = agent.assignedTasks.reduce((acc, task) => {
      const locationName = task.location.name;
      if (!acc[locationName]) {
        acc[locationName] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
        };
      }
      acc[locationName].total++;
      if (task.status === 'COMPLETED') acc[locationName].completed++;
      if (task.status === 'IN_PROGRESS') acc[locationName].inProgress++;
      if (task.status === 'PENDING') acc[locationName].pending++;
      return acc;
    }, {} as Record<string, any>);

    const stats = {
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
      },
      taskStats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate: Math.round(completionRate * 10) / 10,
        totalHours,
        averageEfficiency: Math.round(averageEfficiency * 10) / 10,
      },
      locationStats,
      recentTasks: agent.assignedTasks.slice(0, 10),
    };

    res.json(stats);
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};