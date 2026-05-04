import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadInputData } from "../../src/data/inputData.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dirPath) => rm(dirPath, { recursive: true, force: true })),
  );
});

describe("loadInputData", () => {
  it("loads and validates the supplied input files", async () => {
    const inputDirectory = path.resolve(process.cwd(), "inputs");

    const result = await loadInputData(inputDirectory);

    expect(result.products.length).toBeGreaterThan(0);
    expect(result.orders.length).toBeGreaterThan(0);
    expect(result.products[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
      }),
    );
  });

  it("rejects invalid date formats in orders", async () => {
    const inputDirectory = await createTempInputDirectory(
      [{ id: "P1", name: "Hammer" }],
      [
        {
          orderId: "O1",
          customerId: "C1",
          entries: [{ id: "P1", quantity: 1 }],
          date: "2026-04-21",
          status: "completed",
        },
      ],
    );

    await expect(loadInputData(inputDirectory)).rejects.toThrow(validDateErrorSnippet);
  });

  it("rejects unknown product references", async () => {
    const inputDirectory = await createTempInputDirectory(
      [{ id: "P1", name: "Hammer" }],
      [
        {
          orderId: "O1",
          customerId: "C1",
          entries: [{ id: "P9", quantity: 1 }],
          date: "21/04/2026",
          status: "completed",
        },
      ],
    );

    await expect(loadInputData(inputDirectory)).rejects.toThrow(
      "Order O1 references unknown product P9.",
    );
  });
});

async function createTempInputDirectory(products: unknown[], orders: unknown[]): Promise<string> {
  const dirPath = await mkdtemp(path.join(os.tmpdir(), "that-sizzling-hot-product-"));
  tempDirs.push(dirPath);

  await Promise.all([
    writeFile(path.join(dirPath, "products.json"), JSON.stringify(products), "utf8"),
    writeFile(path.join(dirPath, "orders.json"), JSON.stringify(orders), "utf8"),
  ]);

  return dirPath;
}

const validDateErrorSnippet = "Expected DD/MM/YYYY.";
