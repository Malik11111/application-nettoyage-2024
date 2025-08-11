import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OrgRequest } from '../middleware/organization';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Créer une nouvelle organisation (Super Admin seulement)
export const createOrganization = async (req: OrgRequest, res: Response) => {
  try {
    const { name, slug, domain, contactEmail, contactPhone, address, subscriptionPlan = 'basic' } = req.body;

    // Vérifier que le slug est unique
    const existingOrg = await prisma.organization.findUnique({
      where: { slug }
    });

    if (existingOrg) {
      return res.status(400).json({ message: 'Ce slug d\'organisation existe déjà' });
    }

    // Créer l'organisation
    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        domain,
        contactEmail,
        contactPhone,
        address,
        subscriptionPlan,
        isActive: true
      }
    });

    res.status(201).json({
      message: 'Organisation créée avec succès',
      organization
    });
  } catch (error: any) {
    console.error('Create organization error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'organisation',
      error: error.message 
    });
  }
};

// Lister toutes les organisations (Super Admin seulement)
export const getOrganizations = async (req: OrgRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '', isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { slug: { contains: search as string } },
        { contactEmail: { contains: search as string } }
      ];
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              users: true,
              tasks: true,
              locations: true
            }
          }
        }
      }),
      prisma.organization.count({ where })
    ]);

    // Pour le Super Admin, retourner directement les organisations sans pagination si aucun paramètre de pagination
    if (!req.query.page && !req.query.limit) {
      const allOrgs = await prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          _count: {
            select: {
              users: true,
              tasks: true,
              locations: true
            }
          }
        }
      });
      return res.json(allOrgs);
    }

    res.json({
      organizations,
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        current: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Get organizations error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des organisations',
      error: error.message 
    });
  }
};

// Obtenir les détails d'une organisation
export const getOrganization = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Super Admin peut voir toutes les orgs, Admin seulement la sienne
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin && req.organizationId !== id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette organisation' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            tasks: true,
            locations: true,
            cleaningTemplates: true,
            planningTemplates: true
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organisation introuvable' });
    }

    res.json(organization);
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'organisation',
      error: error.message 
    });
  }
};

// Mettre à jour une organisation
export const updateOrganization = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, domain, contactEmail, contactPhone, address, subscriptionPlan, isActive } = req.body;
    
    // Super Admin peut modifier toutes les orgs, Admin seulement la sienne
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin && req.organizationId !== id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette organisation' });
    }

    // Les admins normaux ne peuvent pas changer certains champs
    const updateData: any = {
      name,
      domain,
      contactEmail,
      contactPhone,
      address
    };

    // Seuls les Super Admins peuvent changer le plan et l'état actif
    if (isSuperAdmin) {
      if (subscriptionPlan) updateData.subscriptionPlan = subscriptionPlan;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: updateData
    });

    res.json({
      message: 'Organisation mise à jour avec succès',
      organization
    });
  } catch (error: any) {
    console.error('Update organization error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour de l\'organisation',
      error: error.message 
    });
  }
};

// Créer un admin pour une organisation (Super Admin seulement)
export const createOrganizationAdmin = async (req: OrgRequest, res: Response) => {
  try {
    const { organizationId } = req.params;
    const { email, password, name } = req.body;

    // Vérifier que l'organisation existe
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organisation introuvable' });
    }

    // Vérifier que l'email n'existe pas déjà dans cette organisation
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Cet email existe déjà dans cette organisation' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        organizationId
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Administrateur créé avec succès',
      admin
    });
  } catch (error: any) {
    console.error('Create organization admin error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la création de l\'administrateur',
      error: error.message 
    });
  }
};

// Statistiques d'une organisation
export const getOrganizationStats = async (req: OrgRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Super Admin peut voir toutes les orgs, Admin seulement la sienne
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin && req.organizationId !== id) {
      return res.status(403).json({ message: 'Accès non autorisé à cette organisation' });
    }

    const [
      totalUsers,
      totalAgents,
      totalAdmins,
      totalLocations,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: id } }),
      prisma.user.count({ where: { organizationId: id, role: 'AGENT' } }),
      prisma.user.count({ where: { organizationId: id, role: 'ADMIN' } }),
      prisma.location.count({ where: { organizationId: id } }),
      prisma.task.count({ where: { organizationId: id } }),
      prisma.task.count({ where: { organizationId: id, status: 'COMPLETED' } }),
      prisma.task.count({ where: { organizationId: id, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { organizationId: id, status: 'PENDING' } })
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      users: {
        total: totalUsers,
        agents: totalAgents,
        admins: totalAdmins
      },
      locations: totalLocations,
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        pending: pendingTasks,
        completionRate
      }
    });
  } catch (error: any) {
    console.error('Get organization stats error:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message 
    });
  }
};