import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("challenge expected outcomes", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it("returns the expected products for required daily dates and required period", async () => {
    app = await createServer();

    const daily21 = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily?date=21/04/2026",
    });
    const daily22 = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily?date=22/04/2026",
    });
    const daily23 = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/daily?date=23/04/2026",
    });
    const period = await app.inject({
      method: "GET",
      url: "/v1/sizzling-hot-products/period?from=21/04/2026&to=23/04/2026",
    });

    expect(daily21.statusCode).toBe(200);
    expect(daily22.statusCode).toBe(200);
    expect(daily23.statusCode).toBe(200);
    expect(period.statusCode).toBe(200);

    expect(daily21.json().product?.name).toBe(
      "Ezy Storage 37L Flexi Laundry Basket - White"
    );
    expect(daily22.json().product?.name).toBe(
      "Ezy Storage 37L Flexi Laundry Basket - White"
    );
    expect(daily23.json().product?.name).toBe(
      "Arlec 160W Crystalline Solar Foldable Charging Kit"
    );
    expect(period.json().product?.name).toBe(
      "Ezy Storage 37L Flexi Laundry Basket - White"
    );
  });
});
