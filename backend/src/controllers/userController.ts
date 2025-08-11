import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../services/database';
import { AuthRequest, CreateUserRequest } from '../types';
import { OrgRequest } from '../middleware/organization';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['ADMIN', 'AGENT']),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['ADMIN', 'AGENT']).optional(),
});

export const getUsers = async (req: OrgRequest, res: Response) => {
  try {
    // Filtrage par organisation
    const whereClause: any = {};
    
    if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN peut voir tous les utilisateurs
      // Pas de filtre
    } else {
      // ADMIN ne voit que les utilisateurs de son organisation
      whereClause.organizationId = req.organizationId;
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            assignedTasks: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        assignedTasks: {
          include: {
            location: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: OrgRequest & Request<{}, {}, CreateUserRequest>, res: Response) => {
  try {
    const { email, password, name, role, organizationId } = createUserSchema.extend({
      organizationId: z.string().optional()
    }).parse(req.body);

    // Use organizationId from request body (for SUPER_ADMIN) or from middleware (for ADMIN)
    const targetOrgId = organizationId || req.organizationId;

    if (!targetOrgId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    // Check if user already exists in the SAME organization (respecting multi-tenant)
    const existingUser = await prisma.user.findUnique({
      where: { 
        email_organizationId: {
          email,
          organizationId: targetOrgId
        }
      },
    });

    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists in this organization' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        organizationId: targetOrgId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: OrgRequest & Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Get current user to check its organization
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { organizationId: true }
    });

    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (data.email) {
      // Check if email already exists in the same organization (excluding current user)
      const existingUser = await prisma.user.findUnique({
        where: { 
          email_organizationId: {
            email: data.email,
            organizationId: currentUser.organizationId!
          }
        }
      });

      if (existingUser && existingUser.id !== id) {
        return res.status(409).json({ message: 'Email already in use in this organization' });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      },
    });

    res.json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user has assigned tasks
    const taskCount = await prisma.task.count({
      where: { assignedAgentId: id },
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete user with assigned tasks. Please reassign tasks first.' 
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};