import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Configuration du serveur de mock pour les tests
export const server = setupServer(...handlers)

// Démarrer le serveur avant tous les tests
beforeAll(() => {
  server.listen()
})

// Réinitialiser les handlers après chaque test
afterEach(() => {
  server.resetHandlers()
})

// Fermer le serveur après tous les tests
afterAll(() => {
  server.close()
})