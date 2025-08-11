import request from 'supertest';
import express from 'express';
import {
  createOrganization,
  getOrganizations,
  getOrganization,
  updateOrganization,
  createOrganizationAdmin,
  getOrganizationStats
} from '../../src/controllers/organizationController';
import { authenticateToken } from '../../src/middleware/auth';
import { requireOrganization, requireSuperAdmin } from '../../src/middleware/organization';
import {
  testPrisma,
  cleanupTestData,
  createTestOrganization,
  createTestUser,
  createTestSuperAdmin,
  createTestLocation,
  createTestTask,
  createTestToken,
  disconnectTestPrisma
} from '../helpers/testHelpers';

// Configuration de l'app Express pour les tests
const app = express();
app.use(express.json());

// Routes protégées
app.post('/organizations', authenticateToken, requireSuperAdmin, createOrganization);
app.get('/organizations', authenticateToken, requireSuperAdmin, getOrganizations);
app.get('/organizations/:id', authenticateToken, requireOrganization, getOrganization);
app.put('/organizations/:id', authenticateToken, requireOrganization, updateOrganization);
app.post('/organizations/:organizationId/admin', authenticateToken, requireSuperAdmin, createOrganizationAdmin);
app.get('/organizations/:id/stats', authenticateToken, requireOrganization, getOrganizationStats);

describe('OrganizationController - Tests Multi-tenant Critiques', () => {
  let testOrg1: any;
  let testOrg2: any;
  let superAdmin: any;
  let admin1: any;
  let admin2: any;
  let agent1: any;
  let superAdminToken: string;
  let admin1Token: string;
  let admin2Token: string;

  beforeEach(async () => {
    await cleanupTestData();

    // Créer organisations de test
    testOrg1 = await createTestOrganization({
      name: 'Organisation Test 1',
      slug: 'test-org-1',
      isActive: true
    });

    testOrg2 = await createTestOrganization({
      name: 'Organisation Test 2',
      slug: 'test-org-2',
      isActive: true
    });

    // Créer utilisateurs
    superAdmin = await createTestSuperAdmin();
    admin1 = await createTestUser(testOrg1.id, {
      email: 'admin1@test.com',
      name: 'Admin 1',
      role: 'ADMIN'
    });

    admin2 = await createTestUser(testOrg2.id, {
      email: 'admin2@test.com',
      name: 'Admin 2',
      role: 'ADMIN'
    });

    agent1 = await createTestUser(testOrg1.id, {
      email: 'agent1@test.com',
      name: 'Agent 1',
      role: 'AGENT'
    });

    // Créer tokens
    superAdminToken = createTestToken(superAdmin);
    admin1Token = createTestToken(admin1);
    admin2Token = createTestToken(admin2);
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestPrisma();
  });

  describe('POST /organizations - Création d\'organisation (SUPER_ADMIN only)', () => {
    it('devrait permettre au SUPER_ADMIN de créer une nouvelle organisation', async () => {
      const orgData = {
        name: 'Nouvelle Organisation',
        slug: 'nouvelle-org',
        domain: 'nouvelle-org.com',
        contactEmail: 'contact@nouvelle-org.com',
        contactPhone: '+33123456789',
        address: '123 Rue Test',
        subscriptionPlan: 'pro'
      };

      const response = await request(app)
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(orgData);

      expect(response.status).toBe(201);
      expect(response.body.organization.name).toBe(orgData.name);
      expect(response.body.organization.slug).toBe(orgData.slug);
      expect(response.body.organization.isActive).toBe(true);
      expect(response.body.message).toBe('Organisation créée avec succès');
    });

    it('devrait rejeter la création par un ADMIN', async () => {
      const response = await request(app)
        .post('/organizations')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          name: 'Test Org',
          slug: 'test-org'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Super Admin access required');
    });

    it('devrait rejeter si le slug existe déjà', async () => {
      const response = await request(app)
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          name: 'Test Duplicate',
          slug: 'test-org-1' // Slug qui existe déjà
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Ce slug d\'organisation existe déjà');
    });
  });

  describe('GET /organizations - Liste des organisations (SUPER_ADMIN only)', () => {
    it('devrait retourner toutes les organisations pour le SUPER_ADMIN', async () => {
      const response = await request(app)
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      
      const orgNames = response.body.map((org: any) => org.name);
      expect(orgNames).toContain('Organisation Test 1');
      expect(orgNames).toContain('Organisation Test 2');
    });

    it('devrait supporter la pagination', async () => {
      const response = await request(app)
        .get('/organizations?page=1&limit=1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.organizations).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.organizations.length).toBe(1);
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });

    it('devrait supporter la recherche', async () => {
      const response = await request(app)
        .get('/organizations?search=Test 1')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      const filteredOrgs = response.body.filter((org: any) => 
        org.name.includes('Test 1')
      );
      expect(filteredOrgs.length).toBe(1);
    });

    it('devrait rejeter l\'accès pour les ADMIN', async () => {
      const response = await request(app)
        .get('/organizations')
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Super Admin access required');
    });
  });

  describe('GET /organizations/:id - Détails d\'une organisation', () => {
    it('devrait permettre au SUPER_ADMIN de voir n\'importe quelle organisation', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg1.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testOrg1.id);
      expect(response.body._count).toBeDefined();
    });

    it('devrait permettre à un ADMIN de voir seulement son organisation', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testOrg1.id);
    });

    it('devrait EMPÊCHER un ADMIN de voir une autre organisation (TEST CRITIQUE)', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg2.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Accès non autorisé à cette organisation');
    });
  });

  describe('PUT /organizations/:id - Mise à jour d\'organisation', () => {
    it('devrait permettre au SUPER_ADMIN de modifier n\'importe quelle organisation', async () => {
      const updateData = {
        name: 'Organisation Test 1 Modifiée',
        isActive: false,
        subscriptionPlan: 'enterprise'
      };

      const response = await request(app)
        .put(`/organizations/${testOrg1.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe(updateData.name);
    });

    it('devrait permettre à un ADMIN de modifier son organisation (champs limités)', async () => {
      const updateData = {
        name: 'Mon Organisation Modifiée',
        contactEmail: 'nouveau@test.com',
        // isActive et subscriptionPlan ne devraient pas être pris en compte
        isActive: false,
        subscriptionPlan: 'enterprise'
      };

      const response = await request(app)
        .put(`/organizations/${testOrg1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.organization.name).toBe(updateData.name);
      expect(response.body.organization.contactEmail).toBe(updateData.contactEmail);
      
      // Vérifier que les champs protégés n'ont pas été modifiés
      expect(response.body.organization.isActive).toBe(true); // Valeur originale
      expect(response.body.organization.subscriptionPlan).toBe('basic'); // Valeur originale
    });

    it('devrait EMPÊCHER un ADMIN de modifier une autre organisation', async () => {
      const response = await request(app)
        .put(`/organizations/${testOrg2.id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({ name: 'Tentative de modification' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Accès non autorisé à cette organisation');
    });
  });

  describe('POST /organizations/:id/admin - Création d\'admin', () => {
    it('devrait permettre au SUPER_ADMIN de créer un admin pour n\'importe quelle organisation', async () => {
      const adminData = {
        email: 'newadmin@test.com',
        password: 'securepassword123',
        name: 'Nouvel Admin'
      };

      const response = await request(app)
        .post(`/organizations/${testOrg1.id}/admin`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(adminData);

      expect(response.status).toBe(201);
      expect(response.body.admin.email).toBe(adminData.email);
      expect(response.body.admin.role).toBe('ADMIN');
      expect(response.body.admin.organizationId).toBe(testOrg1.id);
      expect(response.body.admin.password).toBeUndefined(); // Ne pas retourner le mot de passe
    });

    it('devrait rejeter la création par un ADMIN', async () => {
      const response = await request(app)
        .post(`/organizations/${testOrg1.id}/admin`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          email: 'test@test.com',
          password: 'password',
          name: 'Test'
        });

      expect(response.status).toBe(403);
    });

    it('devrait rejeter si l\'email existe déjà dans l\'organisation', async () => {
      const response = await request(app)
        .post(`/organizations/${testOrg1.id}/admin`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          email: 'admin1@test.com', // Email qui existe déjà
          password: 'password123',
          name: 'Admin Duplicate'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Cet email existe déjà dans cette organisation');
    });
  });

  describe('GET /organizations/:id/stats - Statistiques d\'organisation', () => {
    beforeEach(async () => {
      // Créer des données de test pour les statistiques
      const location1 = await createTestLocation(testOrg1.id, { name: 'Location 1' });
      const location2 = await createTestLocation(testOrg1.id, { name: 'Location 2' });
      
      await createTestTask(testOrg1.id, location1.id, agent1.id, { status: 'COMPLETED' });
      await createTestTask(testOrg1.id, location2.id, agent1.id, { status: 'IN_PROGRESS' });
      await createTestTask(testOrg1.id, location1.id, agent1.id, { status: 'PENDING' });
    });

    it('devrait retourner les statistiques correctes pour le SUPER_ADMIN', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg1.id}/stats`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users.total).toBe(2); // admin1 + agent1
      expect(response.body.users.agents).toBe(1);
      expect(response.body.users.admins).toBe(1);
      expect(response.body.locations).toBe(2);
      expect(response.body.tasks.total).toBe(3);
      expect(response.body.tasks.completed).toBe(1);
      expect(response.body.tasks.inProgress).toBe(1);
      expect(response.body.tasks.pending).toBe(1);
      expect(response.body.tasks.completionRate).toBe(33); // 1/3 * 100, arrondi
    });

    it('devrait permettre à un ADMIN de voir les stats de son organisation', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg1.id}/stats`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.users.total).toBeGreaterThan(0);
    });

    it('devrait EMPÊCHER un ADMIN de voir les stats d\'une autre organisation', async () => {
      const response = await request(app)
        .get(`/organizations/${testOrg2.id}/stats`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Accès non autorisé à cette organisation');
    });
  });

  describe('Tests d\'Isolation Multi-tenant (CRITIQUES)', () => {
    beforeEach(async () => {
      // Créer des données dans les deux organisations
      const location1 = await createTestLocation(testOrg1.id, { name: 'Location Org1' });
      const location2 = await createTestLocation(testOrg2.id, { name: 'Location Org2' });
      
      await createTestTask(testOrg1.id, location1.id, agent1.id, { title: 'Task Org1' });
      await createTestTask(testOrg2.id, location2.id, admin2.id, { title: 'Task Org2' });
    });

    it('devrait garantir l\'isolation complète des données entre organisations', async () => {
      // Admin1 ne doit voir que les données de testOrg1
      const statsOrg1 = await request(app)
        .get(`/organizations/${testOrg1.id}/stats`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(statsOrg1.status).toBe(200);
      expect(statsOrg1.body.tasks.total).toBe(1); // Seulement les tâches de son org

      // Admin2 ne doit voir que les données de testOrg2
      const statsOrg2 = await request(app)
        .get(`/organizations/${testOrg2.id}/stats`)
        .set('Authorization', `Bearer ${admin2Token}`);

      expect(statsOrg2.status).toBe(200);
      expect(statsOrg2.body.tasks.total).toBe(1); // Seulement les tâches de son org

      // Vérifier que les chiffres sont différents et isolés
      expect(statsOrg1.body.users.total).not.toBe(statsOrg2.body.users.total);
    });

    it('devrait empêcher complètement l\'accès inter-organisations', async () => {
      // Tenter d'accéder aux ressources de l'autre organisation
      const attempts = [
        request(app).get(`/organizations/${testOrg2.id}`).set('Authorization', `Bearer ${admin1Token}`),
        request(app).get(`/organizations/${testOrg2.id}/stats`).set('Authorization', `Bearer ${admin1Token}`),
        request(app).put(`/organizations/${testOrg2.id}`).set('Authorization', `Bearer ${admin1Token}`)
          .send({ name: 'Tentative de hack' })
      ];

      const responses = await Promise.all(attempts);
      
      responses.forEach(response => {
        expect(response.status).toBe(403);
        expect(response.body.message).toContain('Accès non autorisé');
      });
    });
  });

  describe('Tests de Performance et Charge', () => {
    it('devrait répondre rapidement même avec beaucoup d\'organisations', async () => {
      // Créer plusieurs organisations pour tester la performance
      const createPromises = [];
      for (let i = 0; i < 20; i++) {
        createPromises.push(
          createTestOrganization({
            name: `Perf Test Org ${i}`,
            slug: `perf-test-${i}`,
            isActive: true
          })
        );
      }
      await Promise.all(createPromises);

      const startTime = Date.now();
      const response = await request(app)
        .get('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Moins de 2 secondes
      expect(response.body.length).toBeGreaterThanOrEqual(22); // Au moins nos orgs de test
    });
  });

  describe('Gestion d\'erreurs', () => {
    it('devrait gérer les ID d\'organisation invalides', async () => {
      const response = await request(app)
        .get('/organizations/invalid-id')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Organisation introuvable');
    });

    it('devrait gérer les erreurs de validation', async () => {
      const response = await request(app)
        .post('/organizations')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          // Données manquantes/invalides
          name: '',
          slug: ''
        });

      expect(response.status).toBe(500); // Erreur serveur pour données invalides
    });
  });
});