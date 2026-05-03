import { FastifyInstance } from 'fastify';

import healthRoutes from './health/routes.health.js';

export async function routes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: '/v1' });
}
