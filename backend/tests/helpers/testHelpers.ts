import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../../src/services/database';

// Utiliser la même instance Prisma que l'application
export const testPrisma = prisma;

// Types pour les données de test
export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
  password?: string;
}

export interface TestOrganization {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

// Fonction pour créer un token JWT de test
export const createTestToken = (user: Partial<TestUser>) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId
    },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
};

// Fonction pour créer une organisation de test
export const createTestOrganization = async (data: Partial<TestOrganization> = {}) => {
  const orgData = {
    name: data.name || 'Test Organization',
    slug: data.slug || 'test-org',
    isActive: data.isActive !== undefined ? data.isActive : true,
    subscriptionPlan: 'basic'
  };

  return await testPrisma.organization.create({
    data: orgData
  });
};

// Fonction pour créer un utilisateur de test
export const createTestUser = async (
  organizationId: string,
  userData: Partial<TestUser> = {}
) => {
  const hashedPassword = await bcrypt.hash(userData.password || 'password123', 10);
  
  const user = await testPrisma.user.create({
    data: {
      email: userData.email || 'test@example.com',
      name: userData.name || 'Test User',
      password: hashedPassword,
      role: userData.role || 'AGENT',
      organizationId
    },
    include: {
      organization: true
    }
  });

  return user;
};

// Fonction pour créer un SUPER_ADMIN de test
export const createTestSuperAdmin = async () => {
  const hashedPassword = await bcrypt.hash('superadmin123', 10);
  
  const superAdmin = await testPrisma.user.create({
    data: {
      email: 'superadmin@test.com',
      name: 'Super Admin',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      organizationId: null // SUPER_ADMIN n'appartient à aucune organisation
    }
  });

  return superAdmin;
};

// Fonction pour créer une location de test
export const createTestLocation = async (organizationId: string, data: any = {}) => {
  return await testPrisma.location.create({
    data: {
      name: data.name || 'Test Location',
      description: data.description || 'A test location',
      floor: data.floor || '1',
      type: data.type || 'bureau',
      surface: data.surface || 50,
      cleaningCoefficient: data.cleaningCoefficient || 1.2,
      organizationId
    }
  });
};

// Fonction pour créer une tâche de test
export const createTestTask = async (
  organizationId: string,
  locationId: string,
  assignedAgentId?: string,
  data: any = {}
) => {
  return await testPrisma.task.create({
    data: {
      title: data.title || 'Test Task',
      description: data.description || 'A test task',
      status: data.status || 'PENDING',
      priority: data.priority || 'MEDIUM',
      estimatedDuration: data.estimatedDuration || 60,
      organizationId,
      locationId,
      assignedAgentId,
      ...data
    },
    include: {
      location: true,
      assignedAgent: true,
      organization: true
    }
  });
};

// Fonction pour nettoyer la base de données entre les tests
export const cleanupTestData = async () => {
  try {
    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    await testPrisma.task.deleteMany();
    await testPrisma.cleaningTemplate.deleteMany();
    await testPrisma.planningTemplate.deleteMany();
    await testPrisma.location.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.organization.deleteMany();
  } catch (error) {
    // Si les tables n'existent pas encore, ignorer l'erreur
    console.warn('Warning during cleanup:', error);
  }
};

// Fonction pour fermer la connexion Prisma
export const disconnectTestPrisma = async () => {
  await testPrisma.$disconnect();
};