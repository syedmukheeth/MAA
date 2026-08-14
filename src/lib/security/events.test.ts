import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { hashIp, isAlertable, compareSeverity, EVENT_SEVERITY } from "./events";

/**
 * The two properties that must not silently regress:
 *
 *  1. IP addresses are never stored. hashIp is the only thing standing between
 *     "we detect password spraying" and "we built an IP address database".
 *  2. Only genuinely serious events wake someone up. If routine failed logins
 *     ever became alertable, the alerts would be ignored within a day and the
 *     detection would be worthless.
 */

const ORIGINAL_SECRET = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "test-secret-at-least-32-characters-long!!";
});

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = ORIGINAL_SECRET;
});

describe("hashIp", () => {
  it("is deterministic, so the same source correlates across events", () => {
    expect(hashIp("203.0.113.7")).toBe(hashIp("203.0.113.7"));
  });

  it("gives different sources different hashes", () => {
    expect(hashIp("203.0.113.7")).not.toBe(hashIp("203.0.113.8"));
  });

  it("never returns the address itself", () => {
    const ip = "203.0.113.7";
    const hashed = hashIp(ip);
    expect(hashed).not.toBeNull();
    expect(hashed).not.toContain(ip);
    expect(hashed).not.toContain("203");
    expect(hashed).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is keyed, not a bare digest of the address", () => {
    // The IPv4 space is small enough to enumerate exhaustively, so an unkeyed
    // hash of an IP is reversible in seconds and would still be personal data.
    // Changing the key must change the output.
    const withFirstKey = hashIp("203.0.113.7");
    process.env.JWT_SECRET = "a-completely-different-secret-value-here!!";
    expect(hashIp("203.0.113.7")).not.toBe(withFirstKey);
  });

  it("returns null rather than falling back to an unkeyed hash", () => {
    // Failing closed matters: a fallback would silently start storing
    // reversible addresses the moment the secret went missing.
    delete process.env.JWT_SECRET;
    expect(hashIp("203.0.113.7")).toBeNull();
  });

  it("returns null for absent or unknown sources", () => {
    expect(hashIp(null)).toBeNull();
    expect(hashIp(undefined)).toBeNull();
    expect(hashIp("")).toBeNull();
    // clientIp() yields this string when no forwarding header is present.
    expect(hashIp("unknown")).toBeNull();
  });
});

describe("isAlertable", () => {
  it("alerts on HIGH and CRITICAL only", () => {
    expect(isAlertable("CRITICAL")).toBe(true);
    expect(isAlertable("HIGH")).toBe(true);
    expect(isAlertable("MEDIUM")).toBe(false);
    expect(isAlertable("LOW")).toBe(false);
    expect(isAlertable("INFO")).toBe(false);
  });
});

describe("compareSeverity", () => {
  it("orders severities so a dashboard can sort by urgency", () => {
    expect(compareSeverity("CRITICAL", "HIGH")).toBeGreaterThan(0);
    expect(compareSeverity("INFO", "LOW")).toBeLessThan(0);
    expect(compareSeverity("MEDIUM", "MEDIUM")).toBe(0);
  });
});

describe("EVENT_SEVERITY", () => {
  it("keeps routine failed logins non-alertable", () => {
    // One person mistyping a password must never send an email. The signal is
    // the aggregate, which the detectors raise as a separate event.
    expect(EVENT_SEVERITY.LOGIN_FAILED).toBe("INFO");
    expect(isAlertable(EVENT_SEVERITY.LOGIN_FAILED)).toBe(false);
  });

  it("treats a success after repeated failures as the most serious signal", () => {
    expect(EVENT_SEVERITY.LOGIN_SUCCESS_AFTER_FAILURES).toBe("CRITICAL");
  });

  it("alerts on the patterns that indicate an attack in progress", () => {
    for (const type of [
      "CREDENTIAL_STUFFING_SUSPECTED",
      "PASSWORD_SPRAYING_SUSPECTED",
      "PRIVILEGE_ESCALATION",
      "CRON_AUTH_FAILED",
    ] as const) {
      expect(isAlertable(EVENT_SEVERITY[type])).toBe(true);
    }
  });

  it("assigns a severity to every event type", () => {
    // Guards against a new enum member being added without a severity, which
    // would make recordSecurityEvent write undefined and fail at the database.
    for (const [type, severity] of Object.entries(EVENT_SEVERITY)) {
      expect(severity, `${type} has no severity`).toBeDefined();
      expect(["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]).toContain(severity);
    }
  });
});
