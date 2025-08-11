// Configuration de l'environnement de test
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-super-secure';

// Utiliser une base de données SQLite en mémoire pour les tests
process.env.DATABASE_URL = 'file:./test.db';

// Configuration globale des timeouts
jest.setTimeout(30000);