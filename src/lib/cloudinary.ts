import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function generateUploadSignature(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  // Sign allowed_formats and max_file_size to prevent upload abuse
  // (PDFs, executables, multi-GB files). Both MUST be in the signature
  // or a caller can override them by omitting the constraint from the
  // upload POST — Cloudinary only enforces signed parameters.
  const paramsToSign = {
    timestamp,
    folder,
    allowed_formats: "jpg,jpeg,png,webp",
    max_file_size: 5_000_000, // 5 MB
  };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    folder,
    allowedFormats: "jpg,jpeg,png,webp",
    maxFileSize: 5_000_000,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
  };
}

/**
 * Recovers the Cloudinary public_id from a delivery URL.
 *
 * Needed because the database stores the full secure URL, but the destroy API
 * takes the public_id — which is the path after the `/upload/` segment, minus
 * the optional `v<digits>` version component and minus the file extension, with
 * folders retained. Erasing a customer's uploaded photo depends entirely on
 * getting this right, so it is pure and unit-tested rather than inlined.
 *
 * Returns null for anything that is not a Cloudinary upload URL (Unsplash seed
 * images, hand-entered links), so callers can skip them instead of throwing.
 */
export function parsePublicId(secureUrl: string): string | null {
  if (!secureUrl) return null;

  let pathname: string;
  try {
    const parsed = new URL(secureUrl);
    if (!parsed.hostname.endsWith("cloudinary.com")) return null;
    pathname = parsed.pathname;
  } catch {
    return null;
  }

  const marker = "/upload/";
  const at = pathname.indexOf(marker);
  if (at === -1) return null;

  const segments = pathname.slice(at + marker.length).split("/").filter(Boolean);
  if (segments.length === 0) return null;

  // Transformation and version segments both sit between /upload/ and the id.
  // Drop a leading version marker; transformations are not used on these
  // uploads, so anything else is part of the folder path.
  if (/^v\d+$/.test(segments[0])) segments.shift();
  if (segments.length === 0) return null;

  const last = segments[segments.length - 1];
  const dot = last.lastIndexOf(".");
  segments[segments.length - 1] = dot > 0 ? last.slice(0, dot) : last;

  return segments.join("/");
}

/**
 * Permanently deletes an uploaded asset.
 *
 * Returns false rather than throwing: this runs after the erasure transaction
 * has already committed, and a Cloudinary outage must not be reported to the
 * data principal as a failed erasure when their database records are gone. The
 * caller records the failure so /admin/privacy can offer a retry.
 */
export async function destroyUpload(secureUrl: string): Promise<boolean> {
  const publicId = parsePublicId(secureUrl);
  if (!publicId) return false;
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    // "not found" means it is already gone, which is the outcome we wanted.
    return result.result === "ok" || result.result === "not found";
  } catch {
    return false;
  }
}
