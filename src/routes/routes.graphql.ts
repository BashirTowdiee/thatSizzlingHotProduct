import path from "node:path";
import { FastifyInstance } from "fastify";
import mercurius from "mercurius";

import { loadInputData, type InputData } from "../data/inputData.js";
import { pickTopProductFromOrders } from "../domain/sizzlingHotProducts.js";

const schema = `
  type Product {
    id: ID!
    name: String!
  }

  type DailySizzlingHotProductResult {
    date: String!
    product: Product
    salesCount: Int!
  }

  type PeriodSizzlingHotProductResult {
    from: String!
    to: String!
    product: Product
    salesCount: Int!
  }

  type Query {
    sizzlingHotProduct(date: String!): DailySizzlingHotProductResult!
    sizzlingHotProductForPeriod(from: String!, to: String!): PeriodSizzlingHotProductResult!
  }
`;

export default async function graphqlRoutes(app: FastifyInstance) {
  const inputDirectory = path.resolve(process.cwd(), "inputs");
  let dataset: InputData | null = null;
  const resolvers = {
    Query: {
      sizzlingHotProduct: async (_: unknown, args: { date: string }) => {
        dataset ??= await loadInputData(inputDirectory);

        return {
          date: args.date,
          ...pickTopProductFromOrders(
            dataset.products,
            dataset.orders,
            args.date,
            args.date
          ),
        };
      },
      sizzlingHotProductForPeriod: async (
        _: unknown,
        args: { from: string; to: string }
      ) => {
        dataset ??= await loadInputData(inputDirectory);

        return {
          from: args.from,
          to: args.to,
          ...pickTopProductFromOrders(
            dataset.products,
            dataset.orders,
            args.from,
            args.to
          ),
        };
      },
    },
  };

  await app.register(mercurius, {
    schema,
    resolvers,
    path: "/graphql",
  });
}
