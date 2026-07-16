import { describe, it, expect } from "vitest";
import {
  money,
  sum,
  toPaise,
  taxWithin,
  deliveryFeeFor,
  formatINR,
  ZERO,
} from "./money";

describe("float math is why this module exists", () => {
  it("reproduces the error Decimal avoids", () => {
    // The bug the old `Number(price) + Number(priceDelta)` code was exposed to.
    expect(0.1 + 0.2).not.toBe(0.3);
    expect(money("0.1").plus(money("0.2")).equals(money("0.3"))).toBe(true);
  });

  it("keeps a realistic order total exact where floats drift", () => {
    // 3 × ₹68,500.10 — floats land on ...29999999 and round wrong at the DB.
    const float = 68500.1 * 3;
    expect(float).not.toBe(205500.3);
    expect(toPaise(money("68500.10").times(3)).toString()).toBe("205500.3");
  });
});

describe("taxWithin — GST is extracted, never added", () => {
  it("pulls 18% out of a GST-inclusive sofa price", () => {
    // 68500 × 18/118 = 10449.152542...  -> 10449.15
    expect(taxWithin(money("68500"), money("18")).toString()).toBe("10449.15");
  });

  it("never increases what the customer pays", () => {
    const gross = money("68500");
    const tax = taxWithin(gross, money("18"));
    expect(tax.lessThan(gross)).toBe(true);
    // The defining property of inclusive tax: base + tax === gross.
    const base = gross.minus(tax);
    expect(toPaise(base.plus(tax)).toString()).toBe("68500");
  });

  it("returns zero at a zero rate", () => {
    expect(taxWithin(money("68500"), ZERO()).toString()).toBe("0");
  });

  it("handles a -100 rate without dividing by zero", () => {
    expect(taxWithin(money("100"), money("-100")).toString()).toBe("0");
  });

  it("rounds half-up to paise", () => {
    // 100 × 5/105 = 4.7619...
    expect(taxWithin(money("100"), money("5")).toString()).toBe("4.76");
  });
});

describe("deliveryFeeFor", () => {
  const FEE = money("1500");
  const THRESHOLD = money("50000");

  it("charges below the free-delivery threshold", () => {
    expect(deliveryFeeFor(money("20000"), FEE, THRESHOLD).toString()).toBe("1500");
  });

  it("waives exactly at the threshold", () => {
    expect(deliveryFeeFor(money("50000"), FEE, THRESHOLD).toString()).toBe("0");
  });

  it("waives above the threshold", () => {
    expect(deliveryFeeFor(money("68500"), FEE, THRESHOLD).toString()).toBe("0");
  });

  it("always charges when no threshold is configured", () => {
    expect(deliveryFeeFor(money("999999"), FEE, null).toString()).toBe("1500");
  });

  it("charges nothing when the fee is zero", () => {
    expect(deliveryFeeFor(money("100"), ZERO(), THRESHOLD).toString()).toBe("0");
  });
});

describe("sum", () => {
  it("is zero for an empty cart", () => {
    expect(sum([]).toString()).toBe("0");
  });

  it("adds line totals without drift", () => {
    const lines = [money("68500.10"), money("42000.20"), money("38900.30")];
    expect(sum(lines).toString()).toBe("149400.6");
  });
});

describe("formatINR", () => {
  it("formats whole rupees in the Indian grouping system", () => {
    // Lakh grouping: 68,500 not 68.500 — en-IN groups 2,2,3.
    expect(formatINR("68500")).toContain("68,500");
    expect(formatINR("150000")).toContain("1,50,000");
  });

  it("shows paise only when asked", () => {
    expect(formatINR("10449.15", { paise: true })).toContain("10,449.15");
  });

  it("renders an em dash for absent values rather than NaN or ₹0", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(undefined)).toBe("—");
  });
});

describe("end-to-end order arithmetic", () => {
  it("matches the invoice a customer would receive", () => {
    const lines = [money("68500").times(1), money("42000").times(2)];
    const subtotal = toPaise(sum(lines));
    const delivery = deliveryFeeFor(subtotal, money("1500"), money("50000"));
    const total = toPaise(subtotal.plus(delivery));
    const tax = taxWithin(total, money("18"));

    expect(subtotal.toString()).toBe("152500");
    expect(delivery.toString()).toBe("0"); // over the free threshold
    expect(total.toString()).toBe("152500");
    // 152500 × 18/118 = 23262.711864...
    expect(tax.toString()).toBe("23262.71");
    // Tax is contained within the total, not stacked on top of it.
    expect(total.greaterThanOrEqualTo(tax)).toBe(true);
  });
});
