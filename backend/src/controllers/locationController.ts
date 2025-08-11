import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../services/database';
import { CreateLocationRequest } from '../types';
import { OrgRequest } from '../middleware/organization';

const createLocationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  floor: z.string().min(1),
  type: z.string().min(1),
  surface: z.number().positive().optional(),
  cleaningCoefficient: z.number().positive().optional().default(1.2),
});

const updateLocationSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  floor: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  surface: z.number().positive().optional(),
  cleaningCoefficient: z.number().positive().optional(),
});

export const getLocations = async (req: OrgRequest, res: Response) => {
  try {
    // Filtrage par organisation
    const whereClause: any = {};
    
    if (req.user?.role === 'SUPER_ADMIN') {
      // SUPER_ADMIN peut voir tous les lieux
      // Pas de filtre
    } else {
      // ADMIN ne voit que les lieux de son organisation
      whereClause.organizationId = req.organizationId;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: [
        { floor: 'asc' },
        { type: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getLocation = async (req: OrgRequest & Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    // Construire la clause where avec vérification organisation
    const whereClause: any = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      whereClause.organizationId = req.organizationId;
    }

    const location = await prisma.location.findFirst({
      where: whereClause,
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        },
        tasks: {
          include: {
            assignedAgent: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json(location);
  } catch (error) {
    console.error('Get location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createLocation = async (req: OrgRequest & Request<{}, {}, CreateLocationRequest>, res: Response) => {
  try {
    const data = createLocationSchema.parse(req.body);

    if (!req.organizationId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    const location = await prisma.location.create({
      data: {
        ...data,
        organizationId: req.organizationId,
      },
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    res.status(201).json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Create location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLocation = async (req: OrgRequest & Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateLocationSchema.parse(req.body);

    // Vérifier que le lieu appartient à l'organisation (sauf SUPER_ADMIN)
    if (req.user?.role !== 'SUPER_ADMIN') {
      const existingLocation = await prisma.location.findFirst({
        where: { id, organizationId: req.organizationId },
        select: { id: true }
      });
      
      if (!existingLocation) {
        return res.status(404).json({ message: 'Location not found' });
      }
    }

    const location = await prisma.location.update({
      where: { id },
      data,
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    res.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteLocation = async (req: OrgRequest & Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;

    // Vérifier que le lieu appartient à l'organisation (sauf SUPER_ADMIN)
    const whereClause: any = { id };
    if (req.user?.role !== 'SUPER_ADMIN') {
      whereClause.organizationId = req.organizationId;
    }

    const existingLocation = await prisma.location.findFirst({
      where: whereClause,
      select: { id: true }
    });
    
    if (!existingLocation) {
      return res.status(404).json({ message: 'Location not found' });
    }

    // Check if location has tasks
    const taskCount = await prisma.task.count({
      where: { locationId: id },
    });

    if (taskCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete location with existing tasks. Please delete or reassign tasks first.' 
      });
    }

    await prisma.location.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};