import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

// Interface pour les requêtes avec organisation
export interface OrgRequest extends AuthRequest {
  organizationId?: string;
  organization?: any;
}

// Middleware pour extraire l'organisation depuis le token JWT
export const extractOrganization = async (req: OrgRequest, res: Response, next: NextFunction) => {
  try {
    // Si déjà authentifié, l'utilisateur a une organisation
    if (req.user) {
      req.organizationId = req.user.organizationId;
      
      // Optionnellement, charger les détails de l'organisation
      if (req.organizationId) {
        const organization = await prisma.organization.findUnique({
          where: { id: req.organizationId }
        });
        
        if (!organization || !organization.isActive) {
          return res.status(403).json({ message: 'Organisation inactive ou introuvable' });
        }
        
        req.organization = organization;
      }
    }
    
    next();
  } catch (error) {
    console.error('Extract organization error:', error);
    res.status(500).json({ message: 'Erreur lors de la vérification de l\'organisation' });
  }
};

// Middleware pour s'assurer qu'une organisation est présente
export const requireOrganization = (req: OrgRequest, res: Response, next: NextFunction) => {
  if (!req.organizationId) {
    return res.status(400).json({ message: 'Organisation requise' });
  }
  next();
};

// Middleware pour les Super Admins seulement
export const requireSuperAdmin = (req: OrgRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ message: 'Accès Super Admin requis' });
  }
  next();
};

// Helper pour créer des requêtes filtrées par organisation
export const createOrgFilter = (organizationId: string, additionalFilters: any = {}) => {
  return {
    organizationId,
    ...additionalFilters
  };
};

// Helper pour vérifier si l'utilisateur peut accéder à une ressource d'une organisation
export const canAccessOrganization = (userOrgId: string, resourceOrgId: string, isSuperAdmin: boolean = false) => {
  return isSuperAdmin || userOrgId === resourceOrgId;
};

export default {
  extractOrganization,
  requireOrganization,
  requireSuperAdmin,
  createOrgFilter,
  canAccessOrganization
};