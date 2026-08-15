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
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET environment variable is missing or too short (minimum 32 characters). " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
    );
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
    // A token with no `tv` claim predates revocation tracking. It used to be
    // accepted as version 0, which is the same version every account that has
    // never changed its password or role still carries — so the compatibility
    // branch was a standing hole in revocation for no remaining benefit. Every
    // such token expired long ago; anything still presenting one is refused.
    return null;
  } catch {
    return null;
  }
}
