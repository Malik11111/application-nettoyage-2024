import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

// Load environment variables from secrets if in production
if (process.env.NODE_ENV === 'production') {
  const secrets = [
    'DATABASE_URL_FILE',
    'JWT_SECRET_FILE',
    'REDIS_URL_FILE'
  ];
  
  secrets.forEach(secret => {
    const secretFile = process.env[secret];
    if (secretFile && fs.existsSync(secretFile)) {
      const secretValue = fs.readFileSync(secretFile, 'utf8').trim();
      const envVar = secret.replace('_FILE', '');
      process.env[envVar] = secretValue;
    }
  });
}

dotenv.config();

// Configuration par défaut pour Railway si DATABASE_URL manque
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import locationRoutes from './routes/locations';
import taskRoutes from './routes/tasks';
import templateRoutes from './routes/templates';
import planningRoutes from './routes/planning';
import dashboardRoutes from './routes/dashboard';
import healthRoutes from './routes/health';
import maintenanceRoutes from './routes/maintenance';
import organizationRoutes from './routes/organizations';
import seedRoutes from './routes/seed';
import { metricsCollector } from './middleware/metrics';
import { startScheduledTaskGeneration } from './services/scheduledTaskGenerator';

const app = express();
const PORT = process.env.PORT || 3001;

// Request metrics middleware
app.use(metricsCollector.collectRequestMetrics);

// Security middleware
import { 
  globalRateLimit, 
  authRateLimit, 
  apiRateLimit, 
  securityHeaders, 
  sanitizeRequest, 
  requestSizeLimiter, 
  getCorsOptions, 
  securityLogger 
} from './middleware/security';

// Security logging
app.use(securityLogger);

// Security headers
app.use(securityHeaders);

// Request size limiting
app.use(requestSizeLimiter);

// Request sanitization
app.use(sanitizeRequest);

// Global rate limiting
app.use(globalRateLimit);

// CORS configuration
app.use(cors(getCorsOptions()));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoints
app.use('/api', healthRoutes);

// Legacy health endpoint for compatibility
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes with specific rate limiting
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/users', apiRateLimit, userRoutes);
app.use('/api/locations', apiRateLimit, locationRoutes);
app.use('/api/tasks', apiRateLimit, taskRoutes);
app.use('/api/templates', apiRateLimit, templateRoutes);
app.use('/api/planning', apiRateLimit, planningRoutes);
app.use('/api/dashboard', apiRateLimit, dashboardRoutes);
app.use('/api/maintenance', apiRateLimit, maintenanceRoutes);
app.use('/api/seed', seedRoutes); // Temporary seeding route
app.use('/api/organizations', apiRateLimit, organizationRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard/stats`);
  console.log(`💾 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'Not configured'}`);
  
  // Démarrer le système de génération automatique des tâches
  console.log('\n📋 Initialisation du système de génération automatique des tâches...');
  try {
    startScheduledTaskGeneration();
    console.log('✅ Système de génération automatique démarré avec succès!');
    console.log('⏰ Les tâches seront générées automatiquement chaque jour à 6h00');
    console.log('📅 Planning utilisé: Configuration hebdomadaire de chaque organisation');
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du système automatique:', error);
  }
});