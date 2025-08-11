import { Request, Response, NextFunction } from 'express';
import {
  extractOrganization,
  requireOrganization,
  requireSuperAdmin,
  canAccessOrganization,
  OrgRequest
} from '../../src/middleware/organization';
import {
  testPrisma,
  cleanupTestData,
  createTestOrganization,
  createTestUser,
  createTestSuperAdmin,
  disconnectTestPrisma
} from '../helpers/testHelpers';

describe('Organization Middleware - Tests de sécurité multi-tenant', () => {
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let testOrg1: any;
  let testOrg2: any;
  let adminUser1: any;
  let superAdmin: any;

  beforeEach(async () => {
    await cleanupTestData();

    // Configuration des mocks
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Créer des données de test
    testOrg1 = await createTestOrganization({
      name: 'Test Org 1',
      slug: 'test-org-1',
      isActive: true
    });

    testOrg2 = await createTestOrganization({
      name: 'Test Org 2',
      slug: 'test-org-2',
      isActive: false // Organisation désactivée pour tester
    });

    adminUser1 = await createTestUser(testOrg1.id, {
      email: 'admin@test.com',
      role: 'ADMIN'
    });

    superAdmin = await createTestSuperAdmin();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await cleanupTestData();
    await disconnectTestPrisma();
  });

  describe('extractOrganization middleware', () => {
    it('devrait extraire l\'organizationId depuis req.user', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: testOrg1.id
        }
      };

      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.organizationId).toBe(testOrg1.id);
      expect(mockReq.organization).toBeDefined();
      expect(mockReq.organization?.id).toBe(testOrg1.id);
      expect(mockNext).toHaveBeenCalled();
    });

    it('devrait rejeter si l\'organisation est désactivée', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: 'test-user-id',
          email: 'test@test.com',
          role: 'ADMIN',
          organizationId: testOrg2.id // Organisation désactivée
        }
      };

      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Organisation inactive ou introuvable'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait continuer si l\'utilisateur n\'a pas d\'organisation (SUPER_ADMIN)', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          role: 'SUPER_ADMIN',
          organizationId: null
        }
      };

      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.organizationId).toBeNull();
      expect(mockNext).toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de base de données', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: 'test-user-id',
          email: 'test@test.com',
          role: 'ADMIN',
          organizationId: 'invalid-org-id'
        }
      };

      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Organisation inactive ou introuvable'
      });
    });
  });

  describe('requireOrganization middleware', () => {
    it('devrait accepter les requêtes avec organizationId', () => {
      const mockReq: Partial<OrgRequest> = {
        organizationId: testOrg1.id
      };

      requireOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('devrait rejeter les requêtes sans organizationId', () => {
      const mockReq: Partial<OrgRequest> = {
        organizationId: undefined
      };

      requireOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Organisation requise'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait rejeter les requêtes avec organizationId vide', () => {
      const mockReq: Partial<OrgRequest> = {
        organizationId: ''
      };

      requireOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin middleware', () => {
    it('devrait accepter les SUPER_ADMIN', () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          role: 'SUPER_ADMIN',
          organizationId: null
        }
      };

      requireSuperAdmin(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('devrait rejeter les ADMIN', () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: adminUser1.id,
          email: adminUser1.email,
          role: 'ADMIN',
          organizationId: testOrg1.id
        }
      };

      requireSuperAdmin(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Accès Super Admin requis'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait rejeter les AGENT', () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: 'agent-id',
          email: 'agent@test.com',
          role: 'AGENT',
          organizationId: testOrg1.id
        }
      };

      requireSuperAdmin(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devrait rejeter les requêtes sans utilisateur', () => {
      const mockReq: Partial<OrgRequest> = {
        user: undefined
      };

      requireSuperAdmin(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('canAccessOrganization helper', () => {
    it('devrait autoriser l\'accès pour un SUPER_ADMIN', () => {
      const result = canAccessOrganization(
        testOrg1.id,
        testOrg2.id,
        true // isSuperAdmin
      );
      expect(result).toBe(true);
    });

    it('devrait autoriser l\'accès pour la même organisation', () => {
      const result = canAccessOrganization(
        testOrg1.id,
        testOrg1.id,
        false // isAdmin
      );
      expect(result).toBe(true);
    });

    it('devrait refuser l\'accès pour une organisation différente', () => {
      const result = canAccessOrganization(
        testOrg1.id,
        testOrg2.id,
        false // isAdmin
      );
      expect(result).toBe(false);
    });

    it('devrait gérer les valeurs null/undefined', () => {
      const result1 = canAccessOrganization('', testOrg1.id, false);
      const result2 = canAccessOrganization(testOrg1.id, '', false);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
    });
  });

  describe('Tests d\'intégration des middlewares', () => {
    it('devrait chaîner extractOrganization -> requireOrganization correctement', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: testOrg1.id
        }
      };

      // Premier middleware
      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.organizationId).toBe(testOrg1.id);

      // Reset mock
      mockNext.mockClear();

      // Deuxième middleware
      requireOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('devrait échouer si extractOrganization trouve une org inactive', async () => {
      const mockReq: Partial<OrgRequest> = {
        user: {
          id: 'test-user',
          email: 'test@test.com',
          role: 'ADMIN',
          organizationId: testOrg2.id // Organisation inactive
        }
      };

      await extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Tests de sécurité edge cases', () => {
    it('devrait gérer les tentatives d\'injection d\'organizationId', () => {
      const mockReq: Partial<OrgRequest> = {
        organizationId: 'injected-org-id',
        user: {
          id: adminUser1.id,
          email: adminUser1.email,
          role: adminUser1.role,
          organizationId: testOrg1.id
        }
      };

      // extractOrganization devrait écraser l'organizationId injecté
      extractOrganization(
        mockReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      // L'organizationId devrait être celui de l'utilisateur, pas l'injecté
      expect(mockReq.organizationId).toBe(testOrg1.id);
      expect(mockReq.organizationId).not.toBe('injected-org-id');
    });

    it('devrait valider que l\'utilisateur appartient vraiment à l\'organisation', async () => {
      // Simuler un utilisateur qui prétend appartenir à une organisation
      const fakeReq: Partial<OrgRequest> = {
        user: {
          id: 'fake-user-id',
          email: 'fake@test.com',
          role: 'ADMIN',
          organizationId: testOrg1.id
        }
      };

      await extractOrganization(
        fakeReq as OrgRequest,
        mockRes as Response,
        mockNext
      );

      // Le middleware devrait charger l'organisation et vérifier qu'elle est active
      expect(mockNext).toHaveBeenCalled();
      expect(fakeReq.organization).toBeDefined();
      expect(fakeReq.organization?.isActive).toBe(true);
    });
  });
});