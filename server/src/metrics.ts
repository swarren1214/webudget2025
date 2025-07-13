// src/metrics.ts
import client from 'prom-client';

// Create a Registry to register the metrics
const register = new client.Registry();

// Add a default label (service_name) to all metrics
register.setDefaultLabels({
    service_name: 'webudget-api'
});

// Enable default metrics collection (memory, CPU, etc.)
client.collectDefaultMetrics({ register });

// Create a histogram to measure HTTP request durations in seconds
export const httpRequestDurationSeconds = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Buckets in seconds
});
register.registerMetric(httpRequestDurationSeconds); // Register the histogram

// Create a counter for total HTTP requests
export const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'code']
});
register.registerMetric(httpRequestsTotal); // Register the counter

export default register;