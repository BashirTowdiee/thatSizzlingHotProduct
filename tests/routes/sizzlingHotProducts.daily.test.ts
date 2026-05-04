import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("GET /v1/sizzling-hot-products/daily", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the winner for a valid date", async () => {
    app = await createServer();
    const response = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily?date=23/04/2026",
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        date: "23/04/2026",
        product: expect.objectContaining({
          id: "P6",
          name: "Arlec 160W Crystalline Solar Foldable Charging Kit",
        }),
        salesCount: 1,
      }),
    );
  });

  it("returns 400 for missing or invalid date query", async () => {
    app = await createServer();

    const missingDateResponse = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily",
    });
    const invalidDateResponse = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily?date=2026-04-23",
    });

    expect(missingDateResponse.statusCode).toBe(400);
    expect(missingDateResponse.json()).toEqual(
      expect.objectContaining({
        error: "Bad Request",
      }),
    );

    expect(invalidDateResponse.statusCode).toBe(400);
    expect(invalidDateResponse.json()).toEqual(
      expect.objectContaining({
        error: "Bad Request",
      }),
    );
  });
});
