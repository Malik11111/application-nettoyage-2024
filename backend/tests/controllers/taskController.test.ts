import request from 'supertest';
import express from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  startTask,
  completeTask,
  getAgentDayView
} from '../../src/controllers/taskController';
import { authenticateToken } from '../../src/middleware/auth';
import { extractOrganization, requireOrganization } from '../../src/middleware/organization';
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

// Routes avec middleware de sécurité
app.get('/tasks', authenticateToken, extractOrganization, getTasks);
app.get('/tasks/:id', authenticateToken, extractOrganization, requireOrganization, getTask);
app.post('/tasks', authenticateToken, extractOrganization, requireOrganization, createTask);
app.put('/tasks/:id', authenticateToken, extractOrganization, requireOrganization, updateTask);
app.delete('/tasks/:id', authenticateToken, extractOrganization, requireOrganization, deleteTask);
app.post('/tasks/:id/start', authenticateToken, extractOrganization, requireOrganization, startTask);
app.post('/tasks/:id/complete', authenticateToken, extractOrganization, requireOrganization, completeTask);
app.get('/agents/:agentId/days/:date', authenticateToken, extractOrganization, requireOrganization, getAgentDayView);

describe('TaskController - Tests de sécurité multi-tenant et fonctionnalités', () => {
  let testOrg1: any;
  let testOrg2: any;
  let superAdmin: any;
  let admin1: any;
  let admin2: any;
  let agent1: any;
  let agent2: any;
  let location1: any;
  let location2: any;
  let task1: any;
  let task2: any;
  let crossOrgTask: any;
  
  // Tokens
  let superAdminToken: string;
  let admin1Token: string;
  let admin2Token: string;
  let agent1Token: string;
  let agent2Token: string;

  beforeEach(async () => {
    await cleanupTestData();

    // Créer organisations
    testOrg1 = await createTestOrganization({
      name: 'Organisation 1',
      slug: 'org-1',
      isActive: true
    });

    testOrg2 = await createTestOrganization({
      name: 'Organisation 2',
      slug: 'org-2',
      isActive: true
    });

    // Créer utilisateurs
    superAdmin = await createTestSuperAdmin();

    admin1 = await createTestUser(testOrg1.id, {
      email: 'admin1@org1.com',
      name: 'Admin 1',
      role: 'ADMIN'
    });

    admin2 = await createTestUser(testOrg2.id, {
      email: 'admin2@org2.com',
      name: 'Admin 2',
      role: 'ADMIN'
    });

    agent1 = await createTestUser(testOrg1.id, {
      email: 'agent1@org1.com',
      name: 'Agent 1',
      role: 'AGENT'
    });

    agent2 = await createTestUser(testOrg2.id, {
      email: 'agent2@org2.com',
      name: 'Agent 2',
      role: 'AGENT'
    });

    // Créer locations
    location1 = await createTestLocation(testOrg1.id, { name: 'Location Org1' });
    location2 = await createTestLocation(testOrg2.id, { name: 'Location Org2' });

    // Créer tâches
    task1 = await createTestTask(testOrg1.id, location1.id, agent1.id, {
      title: 'Task Org1',
      status: 'PENDING',
      priority: 'MEDIUM'
    });

    task2 = await createTestTask(testOrg2.id, location2.id, agent2.id, {
      title: 'Task Org2',
      status: 'PENDING',
      priority: 'HIGH'
    });

    // Créer tokens
    superAdminToken = createTestToken(superAdmin);
    admin1Token = createTestToken(admin1);
    admin2Token = createTestToken(admin2);
    agent1Token = createTestToken(agent1);
    agent2Token = createTestToken(agent2);
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestPrisma();
  });

  describe('GET /tasks - Liste des tâches avec isolation multi-tenant', () => {
    it('devrait permettre à un ADMIN de voir seulement les tâches de son organisation', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0].title).toBe('Task Org1');
      expect(response.body[0].organizationId).toBe(testOrg1.id);
    });

    it('devrait permettre à un AGENT de voir seulement ses tâches assignées', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].assignedAgentId).toBe(agent1.id);
      expect(response.body[0].assignedAgent.id).toBe(agent1.id);
    });

    it('devrait isoler complètement les tâches entre organisations', async () => {
      // Admin1 voit ses tâches
      const response1 = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`);

      // Admin2 voit ses tâches
      const response2 = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${admin2Token}`);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const org1TaskIds = response1.body.map((t: any) => t.id);
      const org2TaskIds = response2.body.map((t: any) => t.id);

      // Aucune tâche ne devrait apparaître dans les deux listes
      const intersection = org1TaskIds.filter((id: string) => org2TaskIds.includes(id));
      expect(intersection.length).toBe(0);
    });

    it('devrait supporter les filtres de recherche', async () => {
      // Créer des tâches avec différents statuts
      await createTestTask(testOrg1.id, location1.id, agent1.id, {
        title: 'Completed Task',
        status: 'COMPLETED'
      });

      const response = await request(app)
        .get('/tasks?status=COMPLETED')
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].status).toBe('COMPLETED');
    });

    it('devrait filtrer par agent assigné', async () => {
      // Créer un autre agent dans la même org
      const agent1b = await createTestUser(testOrg1.id, {
        email: 'agent1b@org1.com',
        name: 'Agent 1B',
        role: 'AGENT'
      });

      await createTestTask(testOrg1.id, location1.id, agent1b.id, {
        title: 'Task for Agent 1B'
      });

      const response = await request(app)
        .get(`/tasks?assignedAgentId=${agent1b.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].assignedAgentId).toBe(agent1b.id);
    });

    it('devrait filtrer par plage de dates', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await createTestTask(testOrg1.id, location1.id, agent1.id, {
        title: 'Tomorrow Task',
        scheduledDate: tomorrow
      });

      const startDate = new Date().toISOString().split('T')[0];
      const endDate = tomorrow.toISOString().split('T')[0];

      const response = await request(app)
        .get(`/tasks?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait inclure les relations location et assignedAgent', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body[0].location).toBeDefined();
      expect(response.body[0].location.name).toBe('Location Org1');
      expect(response.body[0].assignedAgent).toBeDefined();
      expect(response.body[0].assignedAgent.name).toBe('Agent 1');
      expect(response.body[0].assignedAgent.password).toBeUndefined();
    });
  });

  describe('GET /tasks/:id - Détails d\'une tâche', () => {
    it('devrait retourner les détails d\'une tâche de la même organisation', async () => {
      const response = await request(app)
        .get(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(task1.id);
      expect(response.body.title).toBe('Task Org1');
      expect(response.body.location).toBeDefined();
      expect(response.body.assignedAgent).toBeDefined();
    });

    it('CRITIQUE: devrait empêcher l\'accès à une tâche d\'une autre organisation', async () => {
      const response = await request(app)
        .get(`/tasks/${task2.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });

    it('devrait retourner 404 pour une tâche inexistante', async () => {
      const response = await request(app)
        .get('/tasks/nonexistent-id')
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });
  });

  describe('POST /tasks - Création de tâche', () => {
    it('devrait créer une nouvelle tâche avec des données valides', async () => {
      const taskData = {
        title: 'Nouvelle tâche',
        description: 'Description de la tâche',
        locationId: location1.id,
        assignedAgentId: agent1.id,
        priority: 'HIGH',
        estimatedDuration: 60,
        isRecurring: false
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.title).toBe(taskData.title);
      expect(response.body.description).toBe(taskData.description);
      expect(response.body.organizationId).toBe(testOrg1.id);
      expect(response.body.location).toBeDefined();
      expect(response.body.assignedAgent).toBeDefined();
    });

    it('devrait créer une tâche sans agent assigné', async () => {
      const taskData = {
        title: 'Tâche non assignée',
        locationId: location1.id,
        priority: 'MEDIUM'
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.assignedAgentId).toBeNull();
    });

    it('CRITIQUE: devrait empêcher la création avec une location d\'une autre organisation', async () => {
      const taskData = {
        title: 'Tâche malveillante',
        locationId: location2.id, // Location de org2
        assignedAgentId: agent1.id,
        priority: 'HIGH'
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(taskData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Location not found');
    });

    it('CRITIQUE: devrait empêcher l\'assignation à un agent d\'une autre organisation', async () => {
      const taskData = {
        title: 'Tâche malveillante',
        locationId: location1.id,
        assignedAgentId: agent2.id, // Agent de org2
        priority: 'HIGH'
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(taskData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Agent not found');
    });

    it('devrait valider les données d\'entrée', async () => {
      const invalidData = {
        title: '', // Titre vide
        locationId: 'invalid-location-id',
        priority: 'INVALID_PRIORITY',
        estimatedDuration: -30 // Durée négative
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors).toBeDefined();
    });

    it('devrait gérer les dates programmées', async () => {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 1);

      const taskData = {
        title: 'Tâche programmée',
        locationId: location1.id,
        priority: 'MEDIUM',
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: '09:00'
      };

      const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(taskData);

      expect(response.status).toBe(201);
      expect(response.body.scheduledTime).toBe('09:00');
      expect(new Date(response.body.scheduledDate)).toEqual(scheduledDate);
    });
  });

  describe('PUT /tasks/:id - Mise à jour de tâche', () => {
    it('devrait permettre à un ADMIN de mettre à jour une tâche de son organisation', async () => {
      const updateData = {
        title: 'Tâche modifiée',
        description: 'Description modifiée',
        priority: 'URGENT',
        status: 'IN_PROGRESS'
      };

      const response = await request(app)
        .put(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updateData.title);
      expect(response.body.priority).toBe(updateData.priority);
      expect(response.body.status).toBe(updateData.status);
    });

    it('devrait permettre à un AGENT de mettre à jour ses propres tâches (champs limités)', async () => {
      const updateData = {
        status: 'IN_PROGRESS',
        actualDuration: 45
      };

      const response = await request(app)
        .put(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.actualDuration).toBe(updateData.actualDuration);
    });

    it('devrait empêcher un AGENT de modifier des champs non autorisés', async () => {
      const updateData = {
        title: 'Titre modifié par agent', // Non autorisé
        priority: 'URGENT', // Non autorisé
        status: 'IN_PROGRESS' // Autorisé
      };

      const response = await request(app)
        .put(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Agents can only update');
    });

    it('CRITIQUE: devrait empêcher un AGENT de modifier les tâches d\'autres agents', async () => {
      const response = await request(app)
        .put(`/tasks/${task2.id}`)
        .set('Authorization', `Bearer ${agent1Token}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(404); // Task2 n'existe pas pour org1
    });

    it('CRITIQUE: devrait empêcher la modification d\'une tâche d\'une autre organisation', async () => {
      const response = await request(app)
        .put(`/tasks/${task2.id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({ title: 'Tentative de modification' });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');
    });

    it('devrait gérer automatiquement completedAt lors du changement de statut', async () => {
      const response = await request(app)
        .put(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completedAt).toBeDefined();
      expect(new Date(response.body.completedAt)).toBeInstanceOf(Date);
    });
  });

  describe('DELETE /tasks/:id - Suppression de tâche', () => {
    it('devrait permettre la suppression d\'une tâche de la même organisation', async () => {
      const response = await request(app)
        .delete(`/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(204);

      // Vérifier que la tâche a été supprimée
      const deletedTask = await testPrisma.task.findUnique({
        where: { id: task1.id }
      });
      expect(deletedTask).toBeNull();
    });

    it('CRITIQUE: devrait empêcher la suppression d\'une tâche d\'une autre organisation', async () => {
      const response = await request(app)
        .delete(`/tasks/${task2.id}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Task not found');

      // Vérifier que la tâche n'a pas été supprimée
      const stillExistsTask = await testPrisma.task.findUnique({
        where: { id: task2.id }
      });
      expect(stillExistsTask).not.toBeNull();
    });
  });

  describe('POST /tasks/:id/start - Démarrage de tâche', () => {
    it('devrait permettre à un AGENT de démarrer sa propre tâche', async () => {
      const response = await request(app)
        .post(`/tasks/${task1.id}/start`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
      expect(response.body.startTime).toBeDefined();
      expect(new Date(response.body.startTime)).toBeInstanceOf(Date);
    });

    it('devrait permettre à un ADMIN de démarrer n\'importe quelle tâche de son org', async () => {
      const response = await request(app)
        .post(`/tasks/${task1.id}/start`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('IN_PROGRESS');
    });

    it('devrait empêcher un AGENT de démarrer les tâches d\'autres agents', async () => {
      // Créer une tâche assignée à un autre agent
      const agent1b = await createTestUser(testOrg1.id, {
        email: 'agent1b@org1.com',
        name: 'Agent 1B',
        role: 'AGENT'
      });

      const taskForOtherAgent = await createTestTask(testOrg1.id, location1.id, agent1b.id, {
        title: 'Task for other agent'
      });

      const response = await request(app)
        .post(`/tasks/${taskForOtherAgent.id}/start`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only start your own tasks');
    });

    it('devrait empêcher le démarrage d\'une tâche qui n\'est pas PENDING', async () => {
      // Mettre la tâche en IN_PROGRESS
      await testPrisma.task.update({
        where: { id: task1.id },
        data: { status: 'IN_PROGRESS' }
      });

      const response = await request(app)
        .post(`/tasks/${task1.id}/start`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Task must be in pending status to start');
    });
  });

  describe('POST /tasks/:id/complete - Completion de tâche', () => {
    beforeEach(async () => {
      // Mettre la tâche en IN_PROGRESS avec un startTime
      await testPrisma.task.update({
        where: { id: task1.id },
        data: { 
          status: 'IN_PROGRESS',
          startTime: new Date(Date.now() - 60 * 60 * 1000) // Il y a 1 heure
        }
      });
    });

    it('devrait permettre à un AGENT de compléter sa propre tâche', async () => {
      const response = await request(app)
        .post(`/tasks/${task1.id}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.endTime).toBeDefined();
      expect(response.body.completedAt).toBeDefined();
      expect(response.body.actualDuration).toBeGreaterThan(0);
    });

    it('devrait calculer automatiquement la durée réelle', async () => {
      const response = await request(app)
        .post(`/tasks/${task1.id}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.actualDuration).toBeGreaterThan(50); // Environ 60 minutes
      expect(response.body.actualDuration).toBeLessThan(70);
    });

    it('devrait empêcher la completion d\'une tâche qui n\'est pas IN_PROGRESS', async () => {
      // Remettre la tâche en PENDING
      await testPrisma.task.update({
        where: { id: task1.id },
        data: { status: 'PENDING' }
      });

      const response = await request(app)
        .post(`/tasks/${task1.id}/complete`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Task must be in progress to complete');
    });
  });

  describe('GET /agents/:agentId/days/:date - Vue jour agent', () => {
    beforeEach(async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Créer plusieurs tâches pour le même jour
      await createTestTask(testOrg1.id, location1.id, agent1.id, {
        title: 'Morning Task',
        scheduledDate: today,
        scheduledTime: '08:00',
        estimatedDuration: 60
      });

      await createTestTask(testOrg1.id, location1.id, agent1.id, {
        title: 'Afternoon Task',
        scheduledDate: today,
        scheduledTime: '14:00',
        estimatedDuration: 90,
        status: 'COMPLETED',
        actualDuration: 85
      });
    });

    it('devrait retourner la vue jour pour un agent de la même organisation', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/agents/${agent1.id}/days/${today}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.date).toBe(today);
      expect(response.body.tasks).toBeDefined();
      expect(response.body.tasks.length).toBeGreaterThanOrEqual(2);
      expect(response.body.totalEstimatedTime).toBeGreaterThan(0);
      expect(response.body.totalActualTime).toBeGreaterThan(0);
    });

    it('devrait permettre à un AGENT de voir sa propre vue jour', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/agents/${agent1.id}/days/${today}`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.tasks.every((t: any) => t.assignedAgentId === agent1.id)).toBe(true);
    });

    it('devrait empêcher un AGENT de voir la vue jour d\'un autre agent', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/agents/${agent2.id}/days/${today}`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('You can only view your own tasks');
    });

    it('CRITIQUE: devrait empêcher l\'accès aux données d\'agents d\'autres organisations', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/agents/${agent2.id}/days/${today}`)
        .set('Authorization', `Bearer ${admin1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Agent not found');
    });

    it('devrait trier les tâches par heure programmée', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/agents/${agent1.id}/days/${today}`)
        .set('Authorization', `Bearer ${agent1Token}`);

      expect(response.status).toBe(200);
      const tasks = response.body.tasks;
      
      // Vérifier que les tâches sont triées par scheduledTime
      for (let i = 1; i < tasks.length; i++) {
        if (tasks[i-1].scheduledTime && tasks[i].scheduledTime) {
          expect(tasks[i-1].scheduledTime <= tasks[i].scheduledTime).toBe(true);
        }
      }
    });
  });

  describe('Tests de sécurité globaux', () => {
    it('devrait rejeter toutes les requêtes sans authentification', async () => {
      const endpoints = [
        { method: 'get', path: '/tasks' },
        { method: 'get', path: `/tasks/${task1.id}` },
        { method: 'post', path: '/tasks' },
        { method: 'put', path: `/tasks/${task1.id}` },
        { method: 'delete', path: `/tasks/${task1.id}` },
        { method: 'post', path: `/tasks/${task1.id}/start` },
        { method: 'post', path: `/tasks/${task1.id}/complete` }
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)[endpoint.method](endpoint.path);
        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Access token required');
      }
    });

    it('devrait rejeter les tokens invalides', async () => {
      const response = await request(app)
        .get('/tasks')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or expired token');
    });

    it('devrait empêcher complètement l\'accès inter-organisations', async () => {
      // Tenter toutes les opérations possibles avec task2 depuis admin1
      const attempts = [
        request(app).get(`/tasks/${task2.id}`).set('Authorization', `Bearer ${admin1Token}`),
        request(app).put(`/tasks/${task2.id}`).set('Authorization', `Bearer ${admin1Token}`)
          .send({ title: 'Hack attempt' }),
        request(app).delete(`/tasks/${task2.id}`).set('Authorization', `Bearer ${admin1Token}`),
        request(app).post(`/tasks/${task2.id}/start`).set('Authorization', `Bearer ${admin1Token}`),
        request(app).post(`/tasks/${task2.id}/complete`).set('Authorization', `Bearer ${admin1Token}`)
      ];

      const responses = await Promise.all(attempts);
      
      responses.forEach(response => {
        expect(response.status).toBe(404); // Task not found car filtré par organisation
      });
    });
  });
});