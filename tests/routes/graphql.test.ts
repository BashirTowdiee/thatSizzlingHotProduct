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

  it('returns the daily sizzling hot product for date "23/04/2026"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProduct(date: "23/04/2026") { date product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.sizzlingHotProduct?.date).toBe("23/04/2026");
    expect(body.data?.sizzlingHotProduct?.product).toEqual(
      expect.objectContaining({
        id: "P6",
        name: "Arlec 160W Crystalline Solar Foldable Charging Kit",
      })
    );
    expect(body.data?.sizzlingHotProduct?.salesCount).toEqual(
      expect.any(Number)
    );
  });

  it('returns the daily sizzling hot product for date "21/04/2026"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProduct(date: "21/04/2026") { date product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.sizzlingHotProduct?.date).toBe("21/04/2026");
    expect(body.data?.sizzlingHotProduct?.product).toEqual(
      expect.objectContaining({
        id: "P1",
        name: "Ezy Storage 37L Flexi Laundry Basket - White",
      })
    );
    expect(body.data?.sizzlingHotProduct?.salesCount).toEqual(
      expect.any(Number)
    );
  });
});
