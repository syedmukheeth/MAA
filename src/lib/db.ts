import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase requires TLS, so SSL stays on by default — production behaviour is
 * unchanged. But `pg` hard-fails ("server does not support SSL connections")
 * against a plain local Postgres, which made local development impossible
 * without editing this file. `DATABASE_SSL=false` opts out, for localhost only.
 */
const useSsl = process.env.DATABASE_SSL !== "false";

/**
 * Certificate verification is opt-IN, via `DATABASE_CA_CERT`, and deliberately
 * not keyed off NODE_ENV.
 *
 * Supabase's pooler serves a chain rooted in Supabase's own CA, which is not in
 * Node's trust store. Turning verification on without also supplying that root
 * makes every single query die with SELF_SIGNED_CERT_IN_CHAIN — and because it
 * only turns on in production, it passes every local check and takes the whole
 * live site down (every DB-backed page → error boundary). That is exactly what
 * `ssl: { rejectUnauthorized: NODE_ENV === "production" }` did here.
 *
 * So: set `DATABASE_CA_CERT` to Supabase's root certificate (Dashboard →
 * Settings → Database → SSL certificate; paste the PEM, or base64 it) and the
 * chain is genuinely verified. Leave it unset and the connection is still
 * encrypted, just unauthenticated — the same posture as `sslmode=require`.
 */
function sslConfig(): pg.PoolConfig["ssl"] {
  if (!useSsl) return false;

  const raw = process.env.DATABASE_CA_CERT?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  DATABASE_CA_CERT is not set. " +
          "The database connection is encrypted but the server certificate is NOT verified. " +
          "Set DATABASE_CA_CERT to the Supabase root CA PEM (Dashboard → Settings → Database → SSL certificate) " +
          "to enable full TLS verification in production."
      );
    }
    return { rejectUnauthorized: false };
  }

  const ca = raw.includes("-----BEGIN CERTIFICATE-----")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");

  return { ca, rejectUnauthorized: true };
}

function createPrismaClient() {
  // Transaction-mode pooler (port 6543) is the correct target for serverless.
  // We keep pool max at 2 so each serverless worker holds at most 2 connections
  // and we never exceed Supabase's 15-connection session-mode limit even if the
  // old URL is still in use during a migration window.
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig(),
    max: 2,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Always cache on globalThis so that hot-reload in dev and module re-evaluation
// in production (across bundler boundaries) reuse the same pool rather than
// creating a new one per invocation.
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createPrismaClient();
}
export const prisma = globalForPrisma.prisma;
