import request from 'supertest';
import express from 'express';
import { login, getCurrentUser } from '../src/controllers/authController';
import { authenticateToken } from '../src/middleware/auth';
import { testPrisma, createTestToken } from './helpers/testHelpers';

// Configuration de l'app Express pour les tests
const app = express();
app.use(express.json());
app.post('/auth/login', login);
app.get('/auth/me', authenticateToken, getCurrentUser);

describe('Auth Controller - Tests de sécurité critiques', () => {
  beforeEach(async () => {
    // Nettoyer les données existantes
    await testPrisma.user.deleteMany();
    await testPrisma.organization.deleteMany();
  });

  afterAll(async () => {
    await testPrisma.user.deleteMany();
    await testPrisma.organization.deleteMany();
    await testPrisma.$disconnect();
  });

  describe('Authentication & Multi-tenant Security', () => {
    it('devrait isoler complètement les organisations', async () => {
      // Créer deux organisations
      const org1 = await testPrisma.organization.create({
        data: {
          name: 'Organisation 1',
          slug: 'org1',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });

      const org2 = await testPrisma.organization.create({
        data: {
          name: 'Organisation 2', 
          slug: 'org2',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });

      // Créer des utilisateurs dans chaque organisation
      const admin1 = await testPrisma.user.create({
        data: {
          email: 'admin1@org1.com',
          name: 'Admin 1',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'ADMIN',
          organizationId: org1.id
        }
      });

      const admin2 = await testPrisma.user.create({
        data: {
          email: 'admin2@org2.com',
          name: 'Admin 2',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'ADMIN',
          organizationId: org2.id
        }
      });

      // Test 1: Admin1 se connecte à son organisation
      const login1 = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'password',
          organizationSlug: 'org1'
        });

      expect(login1.status).toBe(200);
      expect(login1.body.user.organizationId).toBe(org1.id);
      expect(login1.body.user.organization.slug).toBe('org1');
      expect(login1.body.token).toBeDefined();

      // Test 2: Admin2 se connecte à son organisation
      const login2 = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin2@org2.com',
          password: 'password',
          organizationSlug: 'org2'
        });

      expect(login2.status).toBe(200);
      expect(login2.body.user.organizationId).toBe(org2.id);
      expect(login2.body.user.organization.slug).toBe('org2');

      // Test 3: CRITIQUE - Admin1 ne peut pas se connecter à org2
      const failedCrossLogin = await request(app)
        .post('/auth/login')
        .send({
          email: 'admin1@org1.com',
          password: 'password',
          organizationSlug: 'org2'
        });

      expect(failedCrossLogin.status).toBe(401);
      expect(failedCrossLogin.body.message).toBe('Invalid credentials');

      // Test 4: Vérifier que les tokens contiennent les bons organizationIds
      const decoded1 = JSON.parse(Buffer.from(login1.body.token.split('.')[1], 'base64').toString());
      const decoded2 = JSON.parse(Buffer.from(login2.body.token.split('.')[1], 'base64').toString());

      expect(decoded1.organizationId).toBe(org1.id);
      expect(decoded2.organizationId).toBe(org2.id);
      expect(decoded1.organizationId).not.toBe(decoded2.organizationId);
    });

    it('devrait créer et authentifier un SUPER_ADMIN correctement', async () => {
      // Créer un SUPER_ADMIN (sans organisation)
      const superAdmin = await testPrisma.user.create({
        data: {
          email: 'superadmin@test.com',
          name: 'Super Admin',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'SUPER_ADMIN',
          organizationId: null
        }
      });

      // SUPER_ADMIN se connecte sans slug d'organisation
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          email: 'superadmin@test.com',
          password: 'password'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.role).toBe('SUPER_ADMIN');
      expect(loginResponse.body.user.organizationId).toBeNull();
      expect(loginResponse.body.user.organization).toBeNull();
    });

    it('devrait rejeter les tentatives de connexion malveillantes', async () => {
      const org = await testPrisma.organization.create({
        data: {
          name: 'Test Org',
          slug: 'test-org',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });

      const user = await testPrisma.user.create({
        data: {
          email: 'user@test.com',
          name: 'Test User',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'AGENT',
          organizationId: org.id
        }
      });

      // Tentatives de connexion malveillantes
      const maliciousAttempts = [
        // Mauvais mot de passe
        { email: 'user@test.com', password: 'wrongpassword', organizationSlug: 'test-org' },
        // Email inexistant
        { email: 'fake@test.com', password: 'password', organizationSlug: 'test-org' },
        // Organisation inexistante
        { email: 'user@test.com', password: 'password', organizationSlug: 'fake-org' },
        // Données malformées
        { email: 'not-an-email', password: '', organizationSlug: 'test-org' }
      ];

      for (const attempt of maliciousAttempts) {
        const response = await request(app)
          .post('/auth/login')
          .send(attempt);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body.token).toBeUndefined();
      }
    });

    it('devrait empêcher l\'accès avec organisation désactivée', async () => {
      const inactiveOrg = await testPrisma.organization.create({
        data: {
          name: 'Inactive Org',
          slug: 'inactive-org',
          subscriptionPlan: 'basic',
          isActive: false // Organisation désactivée
        }
      });

      const user = await testPrisma.user.create({
        data: {
          email: 'user@inactive.com',
          name: 'User Inactive',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'AGENT',
          organizationId: inactiveOrg.id
        }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'user@inactive.com',
          password: 'password',
          organizationSlug: 'inactive-org'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Organisation désactivée');
    });

    it('devrait valider et nettoyer les données d\'entrée', async () => {
      const org = await testPrisma.organization.create({
        data: {
          name: 'Test Org',
          slug: 'test-org',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });

      await testPrisma.user.create({
        data: {
          email: 'user@test.com',
          name: 'Test User',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'AGENT',
          organizationId: org.id
        }
      });

      // Test avec des espaces en début/fin
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: '  user@test.com  ',
          password: '  password  ',
          organizationSlug: '  test-org  '
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('user@test.com');
    });

    it('devrait sécuriser l\'endpoint /auth/me', async () => {
      const org = await testPrisma.organization.create({
        data: {
          name: 'Test Org',
          slug: 'test-org',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });

      const user = await testPrisma.user.create({
        data: {
          email: 'user@test.com',
          name: 'Test User',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          role: 'AGENT',
          organizationId: org.id
        }
      });

      // Test sans token
      const noTokenResponse = await request(app).get('/auth/me');
      expect(noTokenResponse.status).toBe(401);

      // Test avec token invalide
      const invalidTokenResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      expect(invalidTokenResponse.status).toBe(403);

      // Test avec token valide
      const validToken = createTestToken({
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId
      });

      const validResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(validResponse.status).toBe(200);
      expect(validResponse.body.id).toBe(user.id);
      expect(validResponse.body.password).toBeUndefined();
      expect(validResponse.body.organization).toBeDefined();
    });
  });
});