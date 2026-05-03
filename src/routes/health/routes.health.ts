import { FastifyInstance } from 'fastify';

export default async function healthRoutes(app: FastifyInstance) {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: {
            type: "object",
            required: ["status"],
            properties: {
              status: { type: "string" }
            }
          }
        }
      }
    },
    async () => ({ status: "ok" })
  );
}
