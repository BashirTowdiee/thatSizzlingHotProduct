import { FastifyInstance } from "fastify";
import mercurius from "mercurius";

const schema = `
  type Query {
    graphqlHealth: String!
  }
`;

const resolvers = {
  Query: {
    graphqlHealth: async () => "ok",
  },
};

export default async function graphqlRoutes(app: FastifyInstance) {
  await app.register(mercurius, {
    schema,
    resolvers,
    path: "/graphql",
  });
}
