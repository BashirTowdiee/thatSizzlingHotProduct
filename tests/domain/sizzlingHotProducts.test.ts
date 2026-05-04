import { describe, expect, it } from "vitest";

import { pickTopProduct } from "../../src/domain/sizzlingHotProducts.js";
import type { Product } from "../../src/domain/types.js";

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
