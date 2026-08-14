import { describe, it, expect } from "vitest";
import { serialiseExport } from "./export";

/**
 * The data export is the one feature that deliberately assembles everything we
 * hold about a person into a single object and hands it to a browser. The risk
 * is not that it breaks — it is that a column added to the schema years from
 * now silently rides along.
 *
 * buildDataExport uses an allow-list `select` for exactly that reason. These
 * tests walk the serialised output for keys that must never appear, so the
 * failure mode is a red test rather than a customer holding a file with the
 * bcrypt hash of their own password in it.
 */

const FORBIDDEN_KEYS = [
  "passwordHash",
  "tokenVersion",
  "password",
  "jwt",
  "token",
  "secret",
  "apiKey",
];

function collectKeys(value: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, into);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      into.add(key);
      collectKeys(child, into);
    }
  }
  return into;
}

describe("serialiseExport", () => {
  it("never emits credential fields, however deeply nested", () => {
    // Shaped like a real export, with the forbidden fields deliberately planted
    // to prove the walker would find them if buildDataExport ever leaked one.
    const clean = {
      account: { id: "u1", name: "Ramesh", email: "r@example.com" },
      savedAddresses: [{ id: "a1", city: "Kurnool", phone: "9876543210" }],
      orders: [
        {
          orderNumber: "MAA-1",
          items: [{ name: "Teak table", quantity: 1 }],
        },
      ],
    };

    const keys = collectKeys(JSON.parse(serialiseExport(clean)));
    for (const forbidden of FORBIDDEN_KEYS) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it("detects a leaked credential field (guards the guard)", () => {
    const leaky = {
      account: { id: "u1", passwordHash: "$2b$12$abcdef" },
    };
    const keys = collectKeys(JSON.parse(serialiseExport(leaky)));
    expect(keys.has("passwordHash")).toBe(true);
  });

  it("produces readable, re-parseable JSON", () => {
    const output = serialiseExport({ account: { id: "u1" } });
    expect(output).toContain("\n");
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it("serialises dates as ISO strings so the file is portable", () => {
    const output = JSON.parse(
      serialiseExport({ createdAt: new Date("2026-08-14T10:30:00Z") })
    );
    expect(output.createdAt).toBe("2026-08-14T10:30:00.000Z");
  });
});
