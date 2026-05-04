import type { Order, Product, ProductWinner } from "./types.js";

export function calculateProductSalesCounts(
  orders: Order[],
  fromDate?: string,
  toDate?: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  const countedSales = new Set<string>();
  const cancelledOrderIds = new Set(
    orders.filter((order) => order.status === "cancelled").map((order) => order.orderId),
  );

  for (const order of orders) {
    if (
      order.status !== "completed" ||
      cancelledOrderIds.has(order.orderId) ||
      typeof order.customerId !== "string" ||
      !Array.isArray(order.entries)
    ) {
      continue;
    }

    if (!isDateInRange(order.date, fromDate, toDate)) {
      continue;
    }

    const uniqueProductIds = new Set(order.entries.map((entry) => entry.id));

    for (const productId of uniqueProductIds) {
      const saleKey = `${order.date}|${order.customerId}|${productId}`;

      if (countedSales.has(saleKey)) {
        continue;
      }

      countedSales.add(saleKey);
      counts.set(productId, (counts.get(productId) ?? 0) + 1);
    }
  }

  return counts;
}

export function pickTopProductFromOrders(
  products: Product[],
  orders: Order[],
  fromDate?: string,
  toDate?: string,
): ProductWinner {
  return pickTopProduct(products, calculateProductSalesCounts(orders, fromDate, toDate));
}

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

function isDateInRange(date: string, fromDate?: string, toDate?: string): boolean {
  if (!fromDate) {
    return true;
  }

  const startDate = fromDate;
  const endDate = toDate ?? fromDate;
  const dateKey = toDateKey(date);
  const startKey = toDateKey(startDate);
  const endKey = toDateKey(endDate);

  return dateKey >= startKey && dateKey <= endKey;
}

function toDateKey(date: string): number {
  const [day, month, year] = date.split("/");
  return Number(year) * 10000 + Number(month) * 100 + Number(day);
}
