import { testPrisma } from './helpers/testHelpers';

describe('Simple Test', () => {
  it('devrait connecter à la base de données', async () => {
    try {
      // Test de connexion basique
      const result = await testPrisma.$queryRaw`SELECT 1 as test`;
      expect(result).toBeDefined();
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  });

  it('devrait pouvoir créer une organisation', async () => {
    try {
      const org = await testPrisma.organization.create({
        data: {
          name: 'Test Org',
          slug: 'test-org',
          subscriptionPlan: 'basic',
          isActive: true
        }
      });
      
      expect(org).toBeDefined();
      expect(org.name).toBe('Test Org');
      
      // Nettoyer
      await testPrisma.organization.delete({
        where: { id: org.id }
      });
    } catch (error) {
      console.error('Organization creation error:', error);
      throw error;
    }
  });
});