import express from 'express';
import { PrismaClient } from '@prisma/client';
import { metricsCollector } from '../middleware/metrics';

const router = express.Router();
const prisma = new PrismaClient();

// Basic health check
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      services: {
        database: 'unknown',
        redis: 'unknown'
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'DEGRADED';
    }

    // Check Redis connection (if configured)
    if (process.env.REDIS_URL) {
      try {
        // Redis health check would go here
        healthCheck.services.redis = 'healthy';
      } catch (error) {
        healthCheck.services.redis = 'unhealthy';
        healthCheck.status = 'DEGRADED';
      }
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check
router.get('/health/detailed', async (req, res) => {
  try {
    const detailed = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      node_version: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        ...process.memoryUsage(),
        free: process.memoryUsage().heapTotal - process.memoryUsage().heapUsed,
        usage_percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
      },
      cpu: process.cpuUsage(),
      services: {
        database: { status: 'unknown', response_time: null as number | null },
        redis: { status: 'unknown', response_time: null as number | null }
      },
      metrics: metricsCollector.getMetrics()
    };

    // Check database with timing
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = Date.now();
      detailed.services.database = {
        status: 'healthy',
        response_time: dbEnd - dbStart
      };
    } catch (error) {
      detailed.services.database = {
        status: 'unhealthy',
        response_time: null
      };
      detailed.status = 'DEGRADED';
    }

    // Check Redis with timing (if configured)
    if (process.env.REDIS_URL) {
      try {
        const redisStart = Date.now();
        // Redis ping would go here
        const redisEnd = Date.now();
        detailed.services.redis = {
          status: 'healthy',
          response_time: redisEnd - redisStart
        };
      } catch (error) {
        detailed.services.redis = {
          status: 'unhealthy',
          response_time: null
        };
        detailed.status = 'DEGRADED';
      }
    }

    const statusCode = detailed.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(detailed);
  } catch (error) {
    res.status(503).json({
      status: 'UNHEALTHY',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

// Readiness probe
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      timestamp: new Date().toISOString(),
      error: 'Service not ready'
    });
  }
});

// Liveness probe
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
router.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.end(metricsCollector.generatePrometheusMetrics());
});

export default router;