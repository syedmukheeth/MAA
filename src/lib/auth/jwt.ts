import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "maa_session";

export type Role = "OWNER" | "ADMIN" | "MANAGER" | "CUSTOMER";

export type SessionPayload = {
  sub: string;
  email: string;
  role: Role;
  /** Token version at issue time — compared against User.tokenVersion to detect
   *  password changes and role revocations that should invalidate this JWT. */
  tv: number;
};

const EXPIRY = "7d";

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  if (process.env.NODE_ENV === "production" && (secret.length < 32 || secret.includes("dev-only"))) {
    throw new Error("CRITICAL SECURITY RISK: Insecure JWT_SECRET configured for production.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecretKey());
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      typeof payload.tv === "number"
    ) {
      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role as Role,
        tv: payload.tv,
      };
    }
    // Legacy tokens without `tv` — treat as version 0 for backward compat
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        sub: payload.sub,
        email: payload.email,
        role: payload.role as Role,
        tv: 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}
