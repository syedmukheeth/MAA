import { createHash } from "node:crypto";

/**
 * Removing personal data from error text before it is stored.
 *
 * This is the load-bearing part of error monitoring in this application. An
 * unfiltered error store would quietly become one of the largest collections of
 * personal data we hold, because the errors most worth capturing are exactly
 * the ones carrying it:
 *
 *  - `PrismaClientKnownRequestError` interpolates the failing query's
 *    parameters into its message. For `placeOrder` those parameters are the
 *    customer's name, phone number and street address.
 *  - Zod validation errors quote the value that failed, which is usually the
 *    email or phone someone just typed.
 *  - Any `throw new Error(\`... ${user.email}\`)` a future contributor writes.
 *
 * The approach is redaction by pattern, not an allow-list, because error text
 * is unstructured and there is no schema to validate against. That means it is
 * best-effort: it will catch the shapes that actually occur here (Indian phone
 * numbers, emails, pincodes, cuids) and cannot promise to catch every possible
 * leak. It is paired with truncation and with never storing query strings.
 *
 * Everything here is pure so the redaction rules are unit-testable without a
 * database or a thrown error.
 */

/** Longest message we keep. Beyond this it is noise, and noise may hide PII. */
const MAX_MESSAGE_LENGTH = 500;

/** Stack frames worth keeping. The top few identify the bug; the rest is framework. */
const MAX_STACK_FRAMES = 6;
const MAX_STACK_LENGTH = 1200;

type Redaction = { pattern: RegExp; replacement: string };

/**
 * Columns whose VALUES are personal data, redacted by field name.
 *
 * Pattern-matching alone cannot catch a name: there is no regex for "is this a
 * human name", and one that tried would either miss most names or destroy every
 * error message. A live probe confirmed this — a Prisma error carrying
 * `shippingName: "Ramesh Kumar"` had its phone, pincode and email redacted
 * correctly while the name passed straight through into the database.
 *
 * The structural property that saves us is that the errors which carry personal
 * data are machine-generated and quote their parameters as `field: "value"`.
 * Redacting by field name is exact where pattern-matching is hopeless.
 *
 * Add to this list whenever a personal-data column is added to the schema.
 */
const SENSITIVE_FIELDS = [
  "name",
  "shippingName",
  "shippingPhone",
  "shippingLine1",
  "shippingLine2",
  "shippingCity",
  "shippingPincode",
  "line1",
  "line2",
  "city",
  "pincode",
  "phone",
  "email",
  "contactEmail",
  "label",
  "location",
  "quote",
  "description",
  "cancelReason",
  "refundNotes",
  "summary",
  "note",
  "resolution",
  "passwordHash",
  "inspirationUrl",
  "imageUrl",
] as const;

/**
 * Order matters. Email must run before the generic phone rule, or the digits
 * inside an address like `9876543210@x.com` get partially rewritten first and
 * the email pattern then fails to match the mangled result.
 */
const REDACTIONS: Redaction[] = [
  // Email addresses.
  {
    pattern: /[\w.+-]+@[\w-]+\.[\w.-]+/g,
    replacement: "[email]",
  },
  // Indian mobile numbers, with or without +91 / 0 prefix. Deliberately before
  // the pincode rule, which would otherwise eat the first six digits.
  {
    pattern: /(?:\+?91[-\s]?|0)?[6-9]\d{9}\b/g,
    replacement: "[phone]",
  },
  // cuid / cuid2 identifiers. Not personal data on their own, but they are
  // direct handles to a person's record and there is no reason to keep them in
  // a table staff browse casually.
  {
    pattern: /\bc[a-z0-9]{24}\b/g,
    replacement: "[id]",
  },
  // Indian pincodes, restricted to the ranges this shop actually delivers to
  // so ordinary six-digit numbers (amounts in paise, timestamps) survive.
  {
    pattern: /\b5[123]\d{4}\b/g,
    replacement: "[pincode]",
  },
  // Bearer tokens, JWTs and anything that looks like a secret. These are not
  // personal data but they are far worse to store.
  {
    pattern: /\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g,
    replacement: "[jwt]",
  },
  {
    pattern: /\b(bearer|token|secret|password|passwordHash|api[_-]?key)\b\s*[:=]\s*\S+/gi,
    replacement: "$1=[redacted]",
  },
  // bcrypt hashes, which appear in errors that echo a User row.
  {
    pattern: /\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}/g,
    replacement: "[hash]",
  },
  // Postgres connection strings, if a driver error quotes one.
  {
    pattern: /postgres(?:ql)?:\/\/[^\s"']+/gi,
    replacement: "[database-url]",
  },
];

/**
 * Redacts the value of any sensitive field, keeping the field name.
 *
 * Handles `field: "value"`, `field = "value"` and unquoted `field: value`.
 * Keeping the name matters: `shippingName: "[redacted]"` still tells you which
 * column the constraint failed on, which is the whole diagnostic value of the
 * message. Case-insensitive on the field name, because error text is not
 * consistent about casing.
 */
function redactSensitiveFields(input: string): string {
  const names = SENSITIVE_FIELDS.join("|");
  return input
    // Quoted values, single or double. Non-greedy so adjacent pairs on one
    // line are redacted individually rather than swallowed as one match.
    .replace(
      new RegExp(`\\b(${names})\\b(\\s*[:=]\\s*)(["'])(?:(?!\\3).)*\\3`, "gi"),
      "$1$2$3[redacted]$3"
    )
    // Unquoted values, stopping at a comma, closing brace or newline.
    .replace(
      new RegExp(`\\b(${names})\\b(\\s*[:=]\\s*)(?!["'])([^,}\\n\\r]+)`, "gi"),
      "$1$2[redacted]"
    );
}

/**
 * Applies every redaction rule. Pure.
 *
 * Field-aware redaction runs FIRST, so a name is removed before the generic
 * patterns get a chance to only partially rewrite the surrounding text.
 */
export function scrubText(input: string): string {
  let out = redactSensitiveFields(input);
  for (const { pattern, replacement } of REDACTIONS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

/**
 * Scrubs and truncates an error message.
 *
 * Prisma's messages are multi-line and reproduce the whole failing query, so
 * they are collapsed to a single line first — otherwise the useful part scrolls
 * off and the parameters do not.
 */
export function scrubMessage(message: string): string {
  const collapsed = scrubText(message).replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_MESSAGE_LENGTH
    ? `${collapsed.slice(0, MAX_MESSAGE_LENGTH)}…`
    : collapsed;
}

/** Keeps the top frames of a stack, scrubbed. */
export function scrubStack(stack: string | undefined | null): string | null {
  if (!stack) return null;
  const frames = stack
    .split("\n")
    .filter((line) => line.trim().startsWith("at "))
    .slice(0, MAX_STACK_FRAMES)
    .join("\n");
  const scrubbed = scrubText(frames);
  return scrubbed.slice(0, MAX_STACK_LENGTH) || null;
}

/**
 * Strips a URL down to its path.
 *
 * Query strings are where identifiers end up — `?token=`, `?next=`, `?orderId=`
 * — and a route is only useful for grouping anyway.
 */
export function scrubRoute(route: string | undefined | null): string | null {
  if (!route) return null;
  const path = route.split("?")[0].split("#")[0];
  // Replace embedded ids so /account/orders/ckxyz… groups with its siblings
  // instead of creating a distinct fingerprint per order.
  return scrubText(path).slice(0, 200) || null;
}

/**
 * Stable identity for an error, so occurrences group instead of accumulating.
 *
 * Built from the error name, the scrubbed message and the first stack frame.
 * The message is included because two different failures of the same class at
 * the same call site are usually different bugs; the frame is included because
 * the same message thrown from two places usually is not.
 *
 * Computed from SCRUBBED input on purpose: otherwise two occurrences of one bug
 * affecting two customers would produce different fingerprints and never group.
 */
export function fingerprint(input: {
  name?: string | null;
  message: string;
  stack?: string | null;
}): string {
  const topFrame =
    input.stack
      ?.split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("at ")) ?? "";

  const basis = [
    input.name ?? "Error",
    scrubMessage(input.message),
    scrubText(topFrame),
  ].join("|");

  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}
