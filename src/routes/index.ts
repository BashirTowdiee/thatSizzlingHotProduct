import { FastifyInstance } from "fastify";

import healthRoutes from "./routes.health.js";

export async function routes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: "/v1" });
}
