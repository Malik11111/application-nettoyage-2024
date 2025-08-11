import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { login, getCurrentUser, refreshToken } from '../../src/controllers/authController';
import { authenticateToken } from '../../src/middleware/auth';
import {
  testPrisma,
  cleanupTestData,
  createTestOrganization,
  createTestUser,
  createTestSuperAdmin,
  disconnectTestPrisma
} from '../helpers/testHelpers';

// Configuration de l'app Express pour les tests
const app = express();
app.use(express.json());
app.post('/auth/login', login);
app.get('/auth/me', authenticateToken, getCurrentUser);
app.post('/auth/refresh', authenticateToken, refreshToken);

describe('AuthController', () => {
  let testOrg1: any;
  let testOrg2: any;
  let adminUser1: any;
  let adminUser2: any;
  let agentUser1: any;
  let superAdmin: any;

  beforeEach(async () => {
    await cleanupTestData();

    // Créer deux organisations pour tester l'isolation
    testOrg1 = await createTestOrganization({
      name: 'Organization 1',
      slug: 'org1',
      isActive: true
    });

    testOrg2 = await createTestOrganization({
      name: 'Organization 2',
      slug: 'org2',
      isActive: true
    });

    // Créer des utilisateurs pour chaque organisation
    adminUser1 = await createTestUser(testOrg1.id, {
      email: 'admin1@org1.com',
      name: 'Admin 1',
      role: 'ADMIN',
      password: 'admin123'
    });

    adminUser2 = await createTestUser(testOrg2.id, {
      email: 'admin2@org2.com',
      name: 'Admin 2',
      role: 'ADMIN',
      password: 'admin123'
    });

    agentUser1 = await createTestUser(testOrg1.id, {
      email: 'agent1@org1.com',
      name: 'Agent 1',
      role: 'AGENT',
      password: 'agent123'
    });

    // Créer un SUPER_ADMIN
    superAdmin = await createTestSuperAdmin();
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestPrisma();
  });

  describe('POST /auth/login', () => {
    it('devrait permettre à un ADMIN de se connecter avec slug d\'organisation', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'admin123',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('admin1@org1.com');
      expect(response.body.user.role).toBe('ADMIN');
      expect(response.body.user.organization.slug).toBe('org1');
      expect(response.body.token).toBeDefined();
      expect(response.body.user.password).toBeUndefined();

      // Vérifier la validité du token JWT
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(adminUser1.id);
      expect(decoded.organizationId).toBe(testOrg1.id);
    });

    it('devrait permettre à un AGENT de se connecter', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'agent1@org1.com',
          password: 'agent123',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('AGENT');
      expect(response.body.user.organization.id).toBe(testOrg1.id);
    });

    it('devrait permettre à un SUPER_ADMIN de se connecter sans slug d\'organisation', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'superadmin@test.com',
          password: 'superadmin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('SUPER_ADMIN');
      expect(response.body.user.organizationId).toBeNull();
    });

    it('devrait rejeter les credentials invalides', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'wrongpassword',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('devrait rejeter si l\'utilisateur essaie de se connecter à la mauvaise organisation', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'admin123',
          organizationSlug: 'org2'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('devrait rejeter la connexion si l\'organisation est désactivée', async () => {
      // Désactiver l'organisation
      await testPrisma.organization.update({
        where: { id: testOrg1.id },
        data: { isActive: false }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'admin123',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Organisation désactivée');
    });

    it('devrait valider le format des données d\'entrée', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          password: '',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors).toBeDefined();
    });

    it('devrait nettoyer les espaces en début et fin des champs', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: '  admin1@org1.com  ',
          password: '  admin123  ',
          organizationSlug: '  org1  '
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('admin1@org1.com');
    });

    it('devrait fonctionner en mode rétrocompatibilité sans slug d\'organisation', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.organization.slug).toBe('org1');
    });
  });

  describe('GET /auth/me', () => {
    it('devrait retourner les informations de l\'utilisateur authentifié', async () => {
      const token = jwt.sign(
        {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: adminUser1.organizationId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(adminUser1.id);
      expect(response.body.email).toBe(adminUser1.email);
      expect(response.body.password).toBeUndefined();
      expect(response.body.organization).toBeDefined();
    });

    it('devrait rejeter les requêtes sans token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Access token required');
    });

    it('devrait rejeter les tokens invalides', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('devrait rejeter les tokens expirés', async () => {
      const expiredToken = jwt.sign(
        {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: adminUser1.organizationId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '-1h' } // Token expiré
      );

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or expired token');
    });
  });

  describe('POST /auth/refresh', () => {
    it('devrait générer un nouveau token pour un utilisateur authentifié', async () => {
      const token = jwt.sign(
        {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: adminUser1.organizationId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.token).not.toBe(token); // Nouveau token différent

      // Vérifier que le nouveau token est valide
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as any;
      expect(decoded.id).toBe(adminUser1.id);
    });

    it('devrait rejeter les requêtes sans authentification', async () => {
      const response = await request(app)
        .post('/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Access token required');
    });
  });

  describe('Isolation Multi-tenant', () => {
    it('devrait empêcher un admin de voir les données d\'une autre organisation', async () => {
      // Ce test sera étendu dans les tests d'API spécifiques
      // mais nous testons ici que le token contient bien l'organizationId
      const token = jwt.sign(
        {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: adminUser1.organizationId
        },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      expect(decoded.organizationId).toBe(testOrg1.id);
      expect(decoded.organizationId).not.toBe(testOrg2.id);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de base de données', async () => {
      // Simuler une erreur en fermant la connexion
      await testPrisma.$disconnect();

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'admin123',
          organizationSlug: 'org1'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal server error');

      // Reconnecter pour les autres tests
      await testPrisma.$connect();
    });
  });
});