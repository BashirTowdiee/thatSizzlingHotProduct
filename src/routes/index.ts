import { FastifyInstance } from "fastify";

import healthRoutes from "./routes.health.js";
import sizzlingHotProductsRoutes from "./routes.sizzlingHotProducts.js";

export async function routes(app: FastifyInstance) {
  await app.register(healthRoutes, { prefix: "/v1" });
  await app.register(sizzlingHotProductsRoutes, { prefix: "/v1" });
}
