import type { Order, Product, ProductWinner } from "./types.js";

export function calculateProductSalesCounts(
  orders: Order[],
  fromDate?: string,
  toDate?: string
): Map<string, number> {
  const counts = new Map<string, number>();
  const countedSales = new Set<string>();
  const dateRange = resolveDateRange(fromDate, toDate);
  const cancelledOrderIds = new Set(
    orders
      .filter((order) => order.status === "cancelled")
      .map((order) => order.orderId)
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

    if (
      dateRange &&
      !isDateInRange(order.date, dateRange.startKey, dateRange.endKey)
    ) {
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
  toDate?: string
): ProductWinner {
  return pickTopProduct(
    products,
    calculateProductSalesCounts(orders, fromDate, toDate)
  );
}

export function pickTopProduct(
  products: Product[],
  counts: Map<string, number>
): ProductWinner {
  const productsById = new Map(
    products.map((product) => [product.id, product])
  );
  const candidates = [...counts.entries()]
    .filter(([, salesCount]) => Number.isFinite(salesCount) && salesCount > 0)
    .map(([productId, salesCount]) => {
      const product = productsById.get(productId);

      if (!product) {
        return null;
      }

      return { product, salesCount };
    })
    .filter(
      (candidate): candidate is { product: Product; salesCount: number } =>
        candidate !== null
    )
    .sort((left, right) => {
      const salesDifference = right.salesCount - left.salesCount;

      if (salesDifference !== 0) {
        return salesDifference;
      }

      const nameDifference = left.product.name.localeCompare(
        right.product.name,
        "en-AU",
        {
          sensitivity: "base",
        }
      );

      if (nameDifference !== 0) {
        return nameDifference;
      }

      // Assumption for deterministic output when names are equal.
      return left.product.id.localeCompare(right.product.id);
    });

  return candidates[0] ?? { product: null, salesCount: 0 };
}

function isDateInRange(
  date: string,
  startKey: number,
  endKey: number
): boolean {
  const dateKey = toDateKey(date);

  return dateKey >= startKey && dateKey <= endKey;
}

function resolveDateRange(
  fromDate?: string,
  toDate?: string
): { startKey: number; endKey: number } | null {
  if (!fromDate && !toDate) {
    return null;
  }

  if (!fromDate) {
    throw new Error(
      "Invalid date range: fromDate is required when toDate is provided."
    );
  }

  const startKey = toDateKey(fromDate);
  const endKey = toDateKey(toDate ?? fromDate);

  if (startKey > endKey) {
    throw new Error(
      `Invalid date range: from ${fromDate} must be before or equal to ${toDate}.`
    );
  }

  return { startKey, endKey };
}

function toDateKey(date: string): number {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(date);

  if (!match) {
    throw new Error(`Invalid date "${date}". Expected DD/MM/YYYY.`);
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    throw new Error(`Invalid date "${date}". Expected DD/MM/YYYY.`);
  }

  return year * 10000 + month * 100 + day;
}
