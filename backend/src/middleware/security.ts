import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    });
  }
});

export const authRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 20 : 10, // More lenient in production
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '1 hour'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '1 hour'
    });
  }
});

export const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 API requests per minute
  message: {
    error: 'API rate limit exceeded, please try again later.',
    retryAfter: '1 minute'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: '1 minute'
    });
  }
});

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Content Security Policy - Temporarily relaxed for debugging
  if (process.env.NODE_ENV === 'development') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https:; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    );
  } else {
    // More permissive CSP for production debugging
    res.setHeader(
      'Content-Security-Policy',
      "default-src *; " +
      "script-src * 'unsafe-inline' 'unsafe-eval'; " +
      "style-src * 'unsafe-inline'; " +
      "img-src * data:; " +
      "font-src * data:; " +
      "connect-src *; " +
      "frame-ancestors 'none';"
    );
  }
  
  // HTTP Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  next();
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous characters from request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  // Remove potentially dangerous characters from query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  next();
};

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    // Remove HTML tags and potentially dangerous characters
    return obj
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[<>'"]/g, '');
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
}

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    
    if (process.env.NODE_ENV === 'development') {
      return next(); // Skip IP checking in development
    }
    
    if (!clientIP || !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        error: 'Access denied from this IP address'
      });
    }
    
    next();
  };
};

// Request size limiter middleware
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('content-length') || '0');
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (contentLength > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      maxSize: '10MB'
    });
  }
  
  next();
};

// CORS configuration for production
export const getCorsOptions = () => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        process.env.FRONTEND_URL
      ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:3006',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'http://127.0.0.1:3004',
        'http://127.0.0.1:3005',
        'http://127.0.0.1:3006',
        'http://127.0.0.1:5173'
      ];

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400, // 24 hours
    optionsSuccessStatus: 200
  };
};

// Request logging for security monitoring
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalSend = res.json;
  
  res.json = function(body) {
    const duration = Date.now() - startTime;
    
    // Log suspicious activities
    if (res.statusCode >= 400) {
      console.warn(`Security Alert: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode,
        duration,
        body: req.body,
        query: req.query
      });
    }
    
    // Log authentication attempts
    if (req.originalUrl.includes('/auth') || req.originalUrl.includes('/login')) {
      console.info(`Auth Attempt: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        statusCode: res.statusCode,
        duration
      });
    }
    
    return originalSend.call(this, body);
  };
  
  next();
};