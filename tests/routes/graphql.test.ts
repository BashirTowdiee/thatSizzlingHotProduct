import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("POST /v1/graphql", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns graphql health query response", async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query: "{ graphqlHealth }",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual(
      expect.objectContaining({
        data: {
          graphqlHealth: "ok",
        },
      })
    );
  });
});
