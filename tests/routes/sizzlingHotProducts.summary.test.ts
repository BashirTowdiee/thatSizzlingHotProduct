import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("GET /v1/sizzling-hot-products", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the default summary winner", async () => {
    app = await createServer();
    const response = await app.inject({ method: "GET", url: "/v1/sizzling-hot-products" });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({
        today: "23/04/2026",
        period: expect.objectContaining({
          from: "21/04/2026",
          to: "23/04/2026",
          product: expect.objectContaining({
            id: "P1",
            name: "Ezy Storage 37L Flexi Laundry Basket - White",
          }),
          salesCount: 6,
        }),
      }),
    );
  });
});
