import type { Role } from "./jwt";

/** Staff roles that can access back-office inventory, orders, products, etc. */
export const STAFF_ROLES: readonly Role[] = ["OWNER", "ADMIN", "MANAGER"] as const;

/** Admin-level roles that can modify site settings, testimonials, etc. */
export const ADMIN_ROLES: readonly Role[] = ["OWNER", "ADMIN"] as const;

/** User management roles that can change roles / suspend staff. */
export const USER_MANAGE_ROLES: readonly Role[] = ["OWNER", "ADMIN"] as const;
