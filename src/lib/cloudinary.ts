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
