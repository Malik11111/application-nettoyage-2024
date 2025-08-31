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

// Serve static frontend files from public directory
import path from 'path';
import mime from 'mime-types';

app.use(express.static(path.join(__dirname, '../public'), {
  setHeaders: (res, filePath) => {
    const mimeType = mime.lookup(filePath);
    if (mimeType) {
      res.setHeader('Content-Type', mimeType);
    }
    // Force correct MIME types for critical files
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
    // Disable caching during debugging
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Health check endpoints
app.use('/api', healthRoutes);

// Legacy health endpoint for compatibility
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Temporary direct seeding endpoint
app.get('/seed-db', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const bcrypt = require('bcryptjs');
    const prisma = new PrismaClient();

    console.log('🌱 Starting direct database seeding...');

    // Create default organization
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'default-org' },
      update: {},
      create: {
        name: 'Organisation Par Défaut',
        slug: 'default-org',
        subscriptionPlan: 'premium',
        isActive: true
      }
    });

    // Hash password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Create users
    const users = [
      { email: 'admin@cleaning.com', name: 'Super Admin', role: 'SUPER_ADMIN' },
      { email: 'admin1@etablissement.com', name: 'Admin Établissement 1', role: 'ADMIN' },
      { email: 'agent1a@etablissement.com', name: 'Agent 1A', role: 'AGENT' }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { 
          email_organizationId: {
            email: userData.email,
            organizationId: defaultOrg.id
          }
        },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          organizationId: defaultOrg.id
        }
      });
      createdUsers.push(user.email);
    }

    await prisma.$disconnect();

    res.json({
      success: true,
      message: '🎉 Database seeded successfully!',
      users: createdUsers,
      testAccounts: [
        'admin@cleaning.com / 123456',
        'admin1@etablissement.com / 123456',
        'agent1a@etablissement.com / 123456'
      ]
    });

  } catch (error) {
    console.error('❌ Seeding error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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

// Catch-all handler for React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'API route not found' });
  } else {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
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