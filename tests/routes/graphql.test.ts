import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";

import { createServer } from "../../src/app.js";

describe("POST /v1/graphql", () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
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
    expect(body.data?.sizzlingHotProduct?.salesCount).toBe(1);
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
    expect(body.data?.sizzlingHotProduct?.salesCount).toBe(3);
  });

  it('returns the daily sizzling hot product for date "22/04/2026"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProduct(date: "22/04/2026") { date product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.sizzlingHotProduct?.date).toBe("22/04/2026");
    expect(body.data?.sizzlingHotProduct?.product).toEqual(
      expect.objectContaining({
        id: "P1",
        name: "Ezy Storage 37L Flexi Laundry Basket - White",
      })
    );
    expect(body.data?.sizzlingHotProduct?.salesCount).toBe(2);
  });

  it('returns GraphQL errors for invalid date "2026-04-23"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProduct(date: "2026-04-23") { date product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toEqual(expect.any(Array));
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.errors[0]?.message).toContain("Invalid date");

    const dailyResult = body.data?.sizzlingHotProduct;
    expect(dailyResult == null).toBe(true);
  });

  it('returns the period sizzling hot product for from "21/04/2026" to "23/04/2026"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProductForPeriod(from: "21/04/2026", to: "23/04/2026") { from to product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toBeUndefined();
    expect(body.data?.sizzlingHotProductForPeriod?.from).toBe("21/04/2026");
    expect(body.data?.sizzlingHotProductForPeriod?.to).toBe("23/04/2026");
    expect(body.data?.sizzlingHotProductForPeriod?.product).toEqual(
      expect.objectContaining({
        id: "P1",
        name: "Ezy Storage 37L Flexi Laundry Basket - White",
      })
    );
    expect(body.data?.sizzlingHotProductForPeriod?.salesCount).toBe(6);
  });

  it('returns GraphQL errors for invalid period range from "23/04/2026" to "21/04/2026"', async () => {
    app = await createServer();

    const response = await app.inject({
      method: "POST",
      url: "/v1/graphql",
      payload: {
        query:
          '{ sizzlingHotProductForPeriod(from: "23/04/2026", to: "21/04/2026") { from to product { id name } salesCount } }',
      },
    });

    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.errors).toEqual(expect.any(Array));
    expect(body.errors.length).toBeGreaterThan(0);
    expect(body.errors[0]?.message).toContain("Invalid date range");

    const periodResult = body.data?.sizzlingHotProductForPeriod;
    expect(periodResult == null).toBe(true);
  });
});
