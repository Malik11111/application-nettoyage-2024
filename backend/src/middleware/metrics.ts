import { Request, Response, NextFunction } from 'express';

interface Metrics {
  requests_total: { [key: string]: number };
  request_duration_seconds: { [key: string]: number[] };
  active_connections: number;
  errors_total: { [key: string]: number };
  database_connections: number;
  memory_usage_bytes: number;
  cpu_usage_percent: number;
}

class MetricsCollector {
  private metrics: Metrics = {
    requests_total: {},
    request_duration_seconds: {},
    active_connections: 0,
    errors_total: {},
    database_connections: 0,
    memory_usage_bytes: 0,
    cpu_usage_percent: 0,
  };

  private startTimes: Map<string, number> = new Map();

  // Middleware to collect request metrics
  collectRequestMetrics = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = `${req.method}_${req.route?.path || req.path}`;
    
    this.startTimes.set(requestId, startTime);
    this.metrics.active_connections++;

    // Increment request counter
    const key = `${req.method}_${res.statusCode}`;
    this.metrics.requests_total[key] = (this.metrics.requests_total[key] || 0) + 1;

    // Handle response finish
    res.on('finish', () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Record response time
      const durationKey = `${req.method}_${req.route?.path || req.path}`;
      if (!this.metrics.request_duration_seconds[durationKey]) {
        this.metrics.request_duration_seconds[durationKey] = [];
      }
      this.metrics.request_duration_seconds[durationKey].push(duration / 1000); // Convert to seconds

      // Keep only last 100 measurements per endpoint
      if (this.metrics.request_duration_seconds[durationKey].length > 100) {
        this.metrics.request_duration_seconds[durationKey].shift();
      }

      this.metrics.active_connections--;

      // Count errors
      if (res.statusCode >= 400) {
        const errorKey = `${req.method}_${res.statusCode}`;
        this.metrics.errors_total[errorKey] = (this.metrics.errors_total[errorKey] || 0) + 1;
      }
    });

    next();
  };

  // Update system metrics
  updateSystemMetrics = () => {
    const memUsage = process.memoryUsage();
    this.metrics.memory_usage_bytes = memUsage.heapUsed;
    
    // CPU usage would require more complex calculation over time
    // For simplicity, using a placeholder
    this.metrics.cpu_usage_percent = process.cpuUsage().user / 1000000; // rough approximation
  };

  // Generate Prometheus format metrics
  generatePrometheusMetrics = (): string => {
    this.updateSystemMetrics();
    
    let output = '';

    // Request total metrics
    output += '# HELP http_requests_total Total number of HTTP requests\n';
    output += '# TYPE http_requests_total counter\n';
    Object.entries(this.metrics.requests_total).forEach(([key, value]) => {
      const [method, status] = key.split('_');
      output += `http_requests_total{method="${method}",status="${status}"} ${value}\n`;
    });

    // Request duration metrics
    output += '# HELP http_request_duration_seconds HTTP request duration in seconds\n';
    output += '# TYPE http_request_duration_seconds histogram\n';
    Object.entries(this.metrics.request_duration_seconds).forEach(([endpoint, durations]) => {
      if (durations.length > 0) {
        const sorted = [...durations].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        
        output += `http_request_duration_seconds{endpoint="${endpoint}",quantile="0.5"} ${p50}\n`;
        output += `http_request_duration_seconds{endpoint="${endpoint}",quantile="0.95"} ${p95}\n`;
        output += `http_request_duration_seconds{endpoint="${endpoint}",quantile="0.99"} ${p99}\n`;
      }
    });

    // Active connections
    output += '# HELP http_active_connections Currently active HTTP connections\n';
    output += '# TYPE http_active_connections gauge\n';
    output += `http_active_connections ${this.metrics.active_connections}\n`;

    // Error metrics
    output += '# HELP http_errors_total Total number of HTTP errors\n';
    output += '# TYPE http_errors_total counter\n';
    Object.entries(this.metrics.errors_total).forEach(([key, value]) => {
      const [method, status] = key.split('_');
      output += `http_errors_total{method="${method}",status="${status}"} ${value}\n`;
    });

    // System metrics
    output += '# HELP process_memory_usage_bytes Process memory usage in bytes\n';
    output += '# TYPE process_memory_usage_bytes gauge\n';
    output += `process_memory_usage_bytes ${this.metrics.memory_usage_bytes}\n`;

    output += '# HELP process_cpu_usage_percent Process CPU usage percentage\n';
    output += '# TYPE process_cpu_usage_percent gauge\n';
    output += `process_cpu_usage_percent ${this.metrics.cpu_usage_percent}\n`;

    return output;
  };

  // Get metrics as JSON
  getMetrics = (): Metrics => {
    this.updateSystemMetrics();
    return { ...this.metrics };
  };
}

export const metricsCollector = new MetricsCollector();
export { MetricsCollector };