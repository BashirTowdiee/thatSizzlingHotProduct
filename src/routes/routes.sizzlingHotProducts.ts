import path from "node:path";
import { FastifyInstance } from "fastify";

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
}
