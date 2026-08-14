import { describe, it, expect } from "vitest";
import {
  scrubText,
  scrubMessage,
  scrubRoute,
  scrubStack,
  fingerprint,
} from "./scrub";

/**
 * These guard the load-bearing property of error monitoring: the error store
 * must not become a personal data store.
 *
 * The realistic leak is not exotic. It is a Prisma error from placeOrder, whose
 * message interpolates the failing query's parameters — which for that query
 * are a customer's name, phone number and street address.
 */

describe("scrubText", () => {
  it("removes email addresses", () => {
    const out = scrubText("Unique constraint failed for ramesh.kumar@gmail.com");
    expect(out).not.toContain("ramesh.kumar@gmail.com");
    expect(out).toContain("[email]");
  });

  it("removes Indian mobile numbers in the formats that actually appear", () => {
    // Deliberately in prose, not as `phone: <value>` — that would be caught by
    // the field-aware rule instead, and this asserts the pattern rule works on
    // a number appearing anywhere, including in a hand-written throw.
    for (const phone of ["9876543210", "+919876543210", "09876543210"]) {
      const out = scrubText(`could not reach customer on ${phone} today`);
      expect(out, phone).not.toContain("9876543210");
      expect(out, phone).toContain("[phone]");
    }
  });

  it("removes a phone number given as a field value as well", () => {
    // Same number, structured. Caught by the field rule rather than the
    // pattern, so the marker differs — what matters is that it is gone.
    const out = scrubText("shippingPhone: 9876543210");
    expect(out).not.toContain("9876543210");
    expect(out).toContain("shippingPhone");
  });

  it("removes cuid identifiers", () => {
    const out = scrubText("User cku1x2y3z4a5b6c7d8e9f0g1h not found");
    expect(out).not.toContain("cku1x2y3z4a5b6c7d8e9f0g1h");
    expect(out).toContain("[id]");
  });

  it("removes delivery pincodes without eating unrelated six-digit numbers", () => {
    // 518002 is a real Kurnool pincode; 123456 is not in the delivery ranges
    // and is far more likely to be an amount or an id.
    expect(scrubText("pincode 518002")).toContain("[pincode]");
    expect(scrubText("total 123456")).toContain("123456");
  });

  it("removes tokens, JWTs and password hashes", () => {
    expect(
      scrubText("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.abc123")
    ).not.toContain("eyJzdWIiOiJ4In0");

    const bcrypt = "$2b$12$" + "a".repeat(53);
    expect(scrubText(`passwordHash ${bcrypt}`)).not.toContain(bcrypt);

    expect(scrubText("token=sk_live_abc123")).not.toContain("sk_live_abc123");
  });

  it("removes database connection strings", () => {
    const out = scrubText(
      "connect ECONNREFUSED postgresql://user:pass@db.example.com:5432/postgres"
    );
    expect(out).not.toContain("pass@db.example.com");
    expect(out).toContain("[database-url]");
  });

  it("redacts the VALUE of a sensitive field while keeping the field name", () => {
    // Regression test for a real leak. A live probe against the running app
    // showed phone, pincode and email correctly redacted while the customer's
    // NAME passed straight through into the database — there is no regex for
    // "is this a human name", so names need field-aware redaction instead.
    const out = scrubText('shippingName: "Ramesh Kumar"');
    expect(out).not.toContain("Ramesh Kumar");
    // The field name survives: knowing WHICH column failed is the entire
    // diagnostic value of the message.
    expect(out).toContain("shippingName");
  });

  it("redacts each field separately rather than swallowing the line", () => {
    const out = scrubText('name: "Priya", city: "Kurnool", total: 4500');
    expect(out).not.toContain("Priya");
    expect(out).not.toContain("Kurnool");
    // Non-sensitive fields are untouched, or the message becomes useless.
    expect(out).toContain("4500");
  });

  it("redacts unquoted values too", () => {
    const out = scrubText("phone: 9876543210, quantity: 2");
    expect(out).not.toContain("9876543210");
    expect(out).toContain("quantity: 2");
  });

  it("scrubs a realistic Prisma error end to end", () => {
    // The exact shape that made placeOrder's original `console.error(err)` a
    // privacy problem, and the exact string used in the live probe.
    const prismaError =
      'Invalid `prisma.order.create()` invocation: ' +
      'shippingName: "Ramesh Kumar", shippingPhone: "9876543210", ' +
      'shippingLine1: "12 Revenue Colony", shippingPincode: "518002", ' +
      'email: "ramesh@gmail.com"';

    const out = scrubText(prismaError);
    expect(out).not.toContain("Ramesh Kumar");
    expect(out).not.toContain("9876543210");
    expect(out).not.toContain("12 Revenue Colony");
    expect(out).not.toContain("518002");
    expect(out).not.toContain("ramesh@gmail.com");
    // The structural part survives, which is what makes the error diagnosable.
    expect(out).toContain("prisma.order.create()");
    expect(out).toContain("shippingName");
  });
});

describe("scrubMessage", () => {
  it("collapses multi-line messages to one line", () => {
    expect(scrubMessage("line one\n  line two\n\nline three")).toBe(
      "line one line two line three"
    );
  });

  it("truncates very long messages", () => {
    const out = scrubMessage("x".repeat(1000));
    expect(out.length).toBeLessThanOrEqual(501);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("scrubRoute", () => {
  it("drops the query string, where identifiers live", () => {
    expect(scrubRoute("/reset-password?token=abc123secret")).toBe(
      "/reset-password"
    );
    expect(scrubRoute("/login?next=/account")).toBe("/login");
  });

  it("drops the fragment", () => {
    expect(scrubRoute("/showroom#contact")).toBe("/showroom");
  });

  it("redacts ids embedded in the path so siblings group together", () => {
    const out = scrubRoute("/account/orders/cku1x2y3z4a5b6c7d8e9f0g1h");
    expect(out).toBe("/account/orders/[id]");
  });

  it("handles absent input", () => {
    expect(scrubRoute(null)).toBeNull();
    expect(scrubRoute(undefined)).toBeNull();
  });
});

describe("scrubStack", () => {
  it("keeps only frame lines, capped", () => {
    const stack = [
      "Error: boom",
      "    at foo (/app/src/a.ts:1:1)",
      "    at bar (/app/src/b.ts:2:2)",
      ...Array.from({ length: 20 }, (_, i) => `    at f${i} (/app/x.ts:${i}:1)`),
    ].join("\n");

    const out = scrubStack(stack);
    expect(out).not.toContain("Error: boom");
    expect(out).toContain("at foo");
    expect(out!.split("\n").length).toBeLessThanOrEqual(6);
  });

  it("returns null for an absent stack", () => {
    expect(scrubStack(null)).toBeNull();
    expect(scrubStack(undefined)).toBeNull();
  });
});

describe("fingerprint", () => {
  const base = {
    name: "PrismaClientKnownRequestError",
    message: "Unique constraint failed on email",
    stack: "Error\n    at placeOrder (/app/src/actions/orders.ts:1:1)",
  };

  it("is stable for the same error", () => {
    expect(fingerprint(base)).toBe(fingerprint({ ...base }));
  });

  it("groups the SAME bug affecting DIFFERENT customers", () => {
    // The whole point of fingerprinting on scrubbed text. Without this, one bug
    // hitting a hundred customers would create a hundred rows and the count —
    // the thing that tells you how bad it is — would always read 1.
    const forRamesh = fingerprint({
      ...base,
      message: "Unique constraint failed for ramesh@gmail.com",
    });
    const forPriya = fingerprint({
      ...base,
      message: "Unique constraint failed for priya@gmail.com",
    });
    expect(forRamesh).toBe(forPriya);
  });

  it("separates different messages", () => {
    expect(fingerprint({ ...base, message: "Something else" })).not.toBe(
      fingerprint(base)
    );
  });

  it("separates the same message thrown from different places", () => {
    expect(
      fingerprint({
        ...base,
        stack: "Error\n    at cancelOrder (/app/src/actions/orders.ts:9:9)",
      })
    ).not.toBe(fingerprint(base));
  });

  it("produces a short hex id, not the message itself", () => {
    const fp = fingerprint(base);
    expect(fp).toMatch(/^[0-9a-f]{32}$/);
    expect(fp).not.toContain("Unique");
  });
});
