import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("GET /v1/sizzling-hot-products/period", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the winner for a valid inclusive period", async () => {
    app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/period?from=21/04/2026&to=23/04/2026",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        from: "21/04/2026",
        to: "23/04/2026",
        product: expect.objectContaining({
          id: "P1",
          name: "Ezy Storage 37L Flexi Laundry Basket - White",
        }),
        salesCount: 6,
      })
    );
  });

  it("returns 400 for missing or invalid query parameters", async () => {
    app = await createServer();

    const missingQueryResponse = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/period",
    });
    const invalidQueryResponse = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/period?from=2026-04-21&to=23/04/2026",
    });

    expect(missingQueryResponse.statusCode).toBe(400);
    expect(missingQueryResponse.json()).toEqual(
      expect.objectContaining({
        error: "Bad Request",
      })
    );

    expect(invalidQueryResponse.statusCode).toBe(400);
    expect(invalidQueryResponse.json()).toEqual(
      expect.objectContaining({
        error: "Bad Request",
      })
    );
  });

  it("returns 400 when from is after to", async () => {
    app = await createServer();

    const response = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/period?from=23/04/2026&to=21/04/2026",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: "Bad Request",
      })
    );
  });
});
