import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./validations/auth";
import { STAFF_ROLES, ADMIN_ROLES, USER_MANAGE_ROLES } from "./auth/roles";

describe("Auth Validation Schemas", () => {
  // marketingConsent is required (never defaulted) so a caller cannot register
  // by omitting it and have silence read as agreement. The consent rules
  // themselves are covered in validations/privacy.test.ts; here it is just the
  // field every registration has to carry.
  const base = { name: "Alice", email: "alice@example.com", marketingConsent: false };

  it("validates password strength rules correctly", () => {
    // Too short
    expect(registerSchema.safeParse({ ...base, password: "Pass1" }).success).toBe(false);
    // Missing uppercase
    expect(registerSchema.safeParse({ ...base, password: "password123" }).success).toBe(false);
    // Missing lowercase
    expect(registerSchema.safeParse({ ...base, password: "PASSWORD123" }).success).toBe(false);
    // Missing number
    expect(registerSchema.safeParse({ ...base, password: "Password" }).success).toBe(false);
    // Valid strong password
    expect(registerSchema.safeParse({ ...base, password: "Password123" }).success).toBe(true);
  });

  it("validates login inputs", () => {
    expect(loginSchema.safeParse({ email: "", password: "123" }).success).toBe(false);
    // Bare usernames are rejected: loginAction no longer expands them to a
    // domain, so accepting one here would only produce a confusing
    // "invalid email or password" for input that could never match a row.
    expect(loginSchema.safeParse({ email: "maa-owner", password: "Password123" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "owner@example.com", password: "Password123" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "test@example.com", password: "Password123" }).success).toBe(true);
  });
});

describe("Role Hierarchies and Permission Sets", () => {
  it("ensures STAFF_ROLES includes OWNER, ADMIN, and MANAGER", () => {
    expect(STAFF_ROLES).toContain("OWNER");
    expect(STAFF_ROLES).toContain("ADMIN");
    expect(STAFF_ROLES).toContain("MANAGER");
    expect(STAFF_ROLES).not.toContain("CUSTOMER");
  });

  it("ensures ADMIN_ROLES excludes MANAGER and CUSTOMER", () => {
    expect(ADMIN_ROLES).toContain("OWNER");
    expect(ADMIN_ROLES).toContain("ADMIN");
    expect(ADMIN_ROLES).not.toContain("MANAGER");
    expect(ADMIN_ROLES).not.toContain("CUSTOMER");
  });
});
