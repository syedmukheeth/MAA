import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./validations/auth";
import { STAFF_ROLES, ADMIN_ROLES, USER_MANAGE_ROLES } from "./auth/roles";

describe("Auth Validation Schemas", () => {
  it("validates password strength rules correctly", () => {
    // Too short
    expect(registerSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "Pass1" }).success).toBe(false);
    // Missing uppercase
    expect(registerSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "password123" }).success).toBe(false);
    // Missing lowercase
    expect(registerSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "PASSWORD123" }).success).toBe(false);
    // Missing number
    expect(registerSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "Password" }).success).toBe(false);
    // Valid strong password
    expect(registerSchema.safeParse({ name: "Alice", email: "alice@example.com", password: "Password123" }).success).toBe(true);
  });

  it("validates login inputs", () => {
    expect(loginSchema.safeParse({ email: "invalid-email", password: "123" }).success).toBe(false);
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
