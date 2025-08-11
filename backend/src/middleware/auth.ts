import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';
import { OrgRequest } from './organization';

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user as any;
    next();
  });
};

// Alias pour compatibilité avec l'architecture multi-tenant
export const requireAuth = authenticateToken;

export const requireAdmin = (req: OrgRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN')) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export const requireAdminOrOwner = (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.params.id || req.params.userId;
  if (req.user?.role !== 'ADMIN' && req.user?.id !== userId) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};