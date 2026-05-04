import path from "node:path";
import { FastifyInstance } from "fastify";
import { z } from "zod";

import { loadInputData, type InputData } from "../data/inputData.js";
import { pickTopProductFromOrders } from "../domain/sizzlingHotProducts.js";

const CHALLENGE_TODAY = "23/04/2026";
const DEFAULT_FROM = "21/04/2026";
const DEFAULT_TO = CHALLENGE_TODAY;

const productSchema = {
  type: "object",
  required: ["id", "name"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
} as const;

const dailyDateQuerySchema = z.object({
  date: z
    .string()
    .refine(isValidDate, { message: 'Invalid query parameter "date". Expected DD/MM/YYYY.' }),
});

export default async function sizzlingHotProductsRoutes(app: FastifyInstance) {
  const inputDirectory = path.resolve(process.cwd(), "inputs");
  let dataset: InputData | null = null;

  app.get(
    "/sizzling-hot-products",
    {
      schema: {
        response: {
          200: {
            type: "object",
            required: ["today", "period"],
            properties: {
              today: { type: "string" },
              period: {
                type: "object",
                required: ["from", "to", "product", "salesCount"],
                properties: {
                  from: { type: "string" },
                  to: { type: "string" },
                  product: {
                    anyOf: [productSchema, { type: "null" }],
                  },
                  salesCount: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      dataset ??= await loadInputData(inputDirectory);

      return {
        today: CHALLENGE_TODAY,
        period: {
          from: DEFAULT_FROM,
          to: DEFAULT_TO,
          ...pickTopProductFromOrders(dataset.products, dataset.orders, DEFAULT_FROM, DEFAULT_TO),
        },
      };
    },
  );

  app.get(
    "/sizzling-hot-products/daily",
    {
      schema: {
        response: {
          200: {
            type: "object",
            required: ["date", "product", "salesCount"],
            properties: {
              date: { type: "string" },
              product: {
                anyOf: [productSchema, { type: "null" }],
              },
              salesCount: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = dailyDateQuerySchema.safeParse(request.query);

      if (!parsed.success) {
        return reply.status(400).send({
          error: "Bad Request",
          message: 'Invalid query parameter "date". Expected DD/MM/YYYY.',
        });
      }

      dataset ??= await loadInputData(inputDirectory);

      return {
        date: parsed.data.date,
        ...pickTopProductFromOrders(
          dataset.products,
          dataset.orders,
          parsed.data.date,
          parsed.data.date,
        ),
      };
    },
  );
}

function isValidDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}
