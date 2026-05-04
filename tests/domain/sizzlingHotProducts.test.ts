import { describe, expect, it } from "vitest";

import {
  calculateProductSalesCounts,
  pickTopProduct,
  pickTopProductFromOrders,
} from "../../src/domain/sizzlingHotProducts.js";
import type { Order, Product } from "../../src/domain/types.js";

const products: Product[] = [
  { id: "P1", name: "Hammer" },
  { id: "P2", name: "BBQ" },
  { id: "P3", name: "Solar Kit" },
];

describe("pickTopProduct", () => {
  it("returns the product with the highest sales count", () => {
    const counts = new Map<string, number>([
      ["P1", 2],
      ["P2", 5],
      ["P3", 3],
    ]);

    const result = pickTopProduct(products, counts);

    expect(result).toEqual({
      product: { id: "P2", name: "BBQ" },
      salesCount: 5,
    });
  });

  it("breaks ties by product name alphabetically", () => {
    const counts = new Map<string, number>([
      ["P1", 4],
      ["P2", 4],
    ]);

    const result = pickTopProduct(products, counts);

    expect(result).toEqual({
      product: { id: "P2", name: "BBQ" },
      salesCount: 4,
    });
  });

  it("uses product id as deterministic fallback when names are equal (assumption)", () => {
    const sameNameProducts: Product[] = [
      { id: "P2", name: "Drill" },
      { id: "P1", name: "Drill" },
    ];
    const counts = new Map<string, number>([
      ["P1", 1],
      ["P2", 1],
    ]);

    const result = pickTopProduct(sameNameProducts, counts);

    expect(result).toEqual({
      product: { id: "P1", name: "Drill" },
      salesCount: 1,
    });
  });
});

describe("calculateProductSalesCounts", () => {
  it("counts each product at most once per order", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [
          { id: "P1", quantity: 1 },
          { id: "P1", quantity: 3 },
          { id: "P2", quantity: 2 },
        ],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C2",
        entries: [{ id: "P1", quantity: 9 }],
        date: "21/04/2026",
        status: "completed",
      },
    ];

    const counts = calculateProductSalesCounts(orders);

    expect(counts.get("P1")).toBe(2);
    expect(counts.get("P2")).toBe(1);
  });

  it("excludes same-customer same-product purchases on the same day across completed orders", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 9 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O3",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 2 }],
        date: "22/04/2026",
        status: "completed",
      },
    ];

    const counts = calculateProductSalesCounts(orders);

    expect(counts.get("P1")).toBe(2);
  });

  it("removes the contribution of a completed order when a matching cancellation exists", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 4 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C2",
        entries: [{ id: "P2", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O1",
        date: "22/04/2026",
        status: "cancelled",
      },
    ];

    const counts = calculateProductSalesCounts(orders);

    expect(counts.get("P1")).toBeUndefined();
    expect(counts.get("P2")).toBe(1);
  });

  it("keeps one same-day duplicate sale when only one duplicate order is cancelled", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 3 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O1",
        date: "22/04/2026",
        status: "cancelled",
      },
    ];

    const counts = calculateProductSalesCounts(orders);

    expect(counts.get("P1")).toBe(1);
  });

  it("filters sales to a single calendar date", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C2",
        entries: [{ id: "P2", quantity: 1 }],
        date: "22/04/2026",
        status: "completed",
      },
    ];

    const counts = calculateProductSalesCounts(orders, "22/04/2026");

    expect(counts.get("P1")).toBeUndefined();
    expect(counts.get("P2")).toBe(1);
  });

  it("filters sales to an inclusive calendar date range", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C2",
        entries: [{ id: "P2", quantity: 1 }],
        date: "22/04/2026",
        status: "completed",
      },
      {
        orderId: "O3",
        customerId: "C3",
        entries: [{ id: "P3", quantity: 1 }],
        date: "23/04/2026",
        status: "completed",
      },
    ];

    const counts = calculateProductSalesCounts(orders, "21/04/2026", "22/04/2026");

    expect(counts.get("P1")).toBe(1);
    expect(counts.get("P2")).toBe(1);
    expect(counts.get("P3")).toBeUndefined();
  });

  it("throws for invalid date format in filter input", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
    ];

    expect(() => calculateProductSalesCounts(orders, "2026-04-21")).toThrow(
      'Invalid date "2026-04-21". Expected DD/MM/YYYY.',
    );
  });

  it("throws for invalid date range when from is after to", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [{ id: "P1", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
    ];

    expect(() => calculateProductSalesCounts(orders, "23/04/2026", "21/04/2026")).toThrow(
      "Invalid date range: from 23/04/2026 must be before or equal to 21/04/2026.",
    );
  });
});

describe("pickTopProductFromOrders", () => {
  it("feeds per-order counts into the winner selector", () => {
    const orders: Order[] = [
      {
        orderId: "O1",
        customerId: "C1",
        entries: [
          { id: "P1", quantity: 2 },
          { id: "P1", quantity: 4 },
        ],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O2",
        customerId: "C2",
        entries: [{ id: "P2", quantity: 1 }],
        date: "21/04/2026",
        status: "completed",
      },
      {
        orderId: "O3",
        customerId: "C3",
        entries: [{ id: "P2", quantity: 7 }],
        date: "21/04/2026",
        status: "completed",
      },
    ];

    const result = pickTopProductFromOrders(products, orders);

    expect(result).toEqual({
      product: { id: "P2", name: "BBQ" },
      salesCount: 2,
    });
  });
});
