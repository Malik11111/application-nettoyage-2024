import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../services/database';
import { AuthRequest, LoginRequest } from '../types';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  organizationSlug: z.string().optional(), // Optionnel pour rétrocompatibilité
});

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    // Nettoyer les espaces en début/fin des champs
    const cleanedBody = {
      email: req.body.email?.trim(),
      password: req.body.password?.trim(),
      organizationSlug: req.body.organizationSlug?.trim()
    };
    const { email, password, organizationSlug } = loginSchema.parse(cleanedBody);

    let user;
    
    if (organizationSlug) {
      // Trouver l'utilisateur par email et organisation
      user = await prisma.user.findFirst({
        where: { 
          email,
          organization: {
            slug: organizationSlug
          }
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          }
        }
      });
    } else {
      // Mode rétrocompatibilité - chercher par email seulement (pour l'organisation par défaut)
      user = await prisma.user.findFirst({
        where: { email },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          }
        }
      });
    }

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Vérifier que l'organisation est active (sauf pour SUPER_ADMIN)
    if (user.role !== 'SUPER_ADMIN' && !user.organization?.isActive) {
      return res.status(403).json({ message: 'Organisation désactivée' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organizationId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const refreshToken = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        organizationId: user.organizationId 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};