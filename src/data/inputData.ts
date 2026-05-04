import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import type { Order, Product } from "../domain/types.js";

export interface InputData {
  products: Product[];
  orders: Order[];
}

const validDateMessage = "Expected DD/MM/YYYY.";
const nonEmptyString = z.string().trim().min(1);

const dateSchema = z.string().refine(isValidDate, {
  message: validDateMessage,
});

const productSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
});

const orderEntrySchema = z.object({
  id: nonEmptyString,
  quantity: z.number().finite().positive(),
});

const completedOrderSchema = z.object({
  orderId: nonEmptyString,
  customerId: nonEmptyString,
  entries: z.array(orderEntrySchema),
  date: dateSchema,
  status: z.literal("completed"),
});

const cancelledOrderSchema = z.object({
  orderId: nonEmptyString,
  customerId: nonEmptyString.optional(),
  entries: z.array(orderEntrySchema).optional(),
  date: dateSchema,
  status: z.literal("cancelled"),
});

const productsSchema = z.array(productSchema);
const ordersSchema = z.array(z.union([completedOrderSchema, cancelledOrderSchema]));

export async function loadInputData(inputDirectory: string): Promise<InputData> {
  const [productsRaw, ordersRaw] = await Promise.all([
    readJsonArray(path.join(inputDirectory, "products.json")),
    readJsonArray(path.join(inputDirectory, "orders.json")),
  ]);

  const products = productsSchema.parse(productsRaw);
  const orders = ordersSchema.parse(ordersRaw);

  ensureUniqueProductIds(products);
  ensureKnownProductReferences(orders, new Set(products.map((product) => product.id)));

  return { products, orders };
}

async function readJsonArray(filePath: string): Promise<unknown[]> {
  const json = await readFile(filePath, "utf8");
  const parsed = JSON.parse(json) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain a JSON array.`);
  }

  return parsed;
}

function ensureUniqueProductIds(products: Product[]): void {
  const seen = new Set<string>();

  for (const product of products) {
    if (seen.has(product.id)) {
      throw new Error(`products.json contains duplicate product id ${product.id}.`);
    }

    seen.add(product.id);
  }
}

function ensureKnownProductReferences(orders: Order[], productIds: Set<string>): void {
  for (const order of orders) {
    if (!Array.isArray(order.entries)) {
      continue;
    }

    for (const entry of order.entries) {
      if (!productIds.has(entry.id)) {
        throw new Error(
          `Order ${order.orderId} references unknown product ${entry.id}.`,
        );
      }
    }
  }
}

function isValidDate(value: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const utcDate = new Date(Date.UTC(year, month - 1, day));

  return (
    utcDate.getUTCFullYear() === year &&
    utcDate.getUTCMonth() === month - 1 &&
    utcDate.getUTCDate() === day
  );
}
