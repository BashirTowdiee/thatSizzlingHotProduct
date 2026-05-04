import type { Product, ProductWinner } from "./types.js";

export function pickTopProduct(products: Product[], counts: Map<string, number>): ProductWinner {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const candidates = [...counts.entries()]
    .filter(([, salesCount]) => Number.isFinite(salesCount) && salesCount > 0)
    .map(([productId, salesCount]) => {
      const product = productsById.get(productId);

      if (!product) {
        return null;
      }

      return { product, salesCount };
    })
    .filter((candidate): candidate is { product: Product; salesCount: number } => candidate !== null)
    .sort((left, right) => {
      const salesDifference = right.salesCount - left.salesCount;

      if (salesDifference !== 0) {
        return salesDifference;
      }

      const nameDifference = left.product.name.localeCompare(right.product.name, "en-AU", {
        sensitivity: "base",
      });

      if (nameDifference !== 0) {
        return nameDifference;
      }

      // Assumption for deterministic output when names are equal.
      return left.product.id.localeCompare(right.product.id);
    });

  return candidates[0] ?? { product: null, salesCount: 0 };
}
