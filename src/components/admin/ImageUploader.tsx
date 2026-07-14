"use client";

import { useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";

type SignatureResult = {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
};

type SignatureAction = () => Promise<SignatureResult | { error: string }>;

export function ImageUploader({
  multiple = false,
  value,
  onChange,
  getSignature,
}: {
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
  getSignature: SignatureAction;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string> {
    const sig = await getSignature();
    if ("error" in sig) {
      throw new Error(sig.error);
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sig.apiKey);
    formData.append("timestamp", String(sig.timestamp));
    formData.append("signature", sig.signature);
    formData.append("folder", sig.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    if (!res.ok) {
      throw new Error("Image upload failed");
    }

    const data = await res.json();
    return data.secure_url as string;
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    try {
      const list = multiple ? Array.from(files) : [files[0]];
      const uploaded = await Promise.all(list.map(uploadOne));
      onChange(multiple ? [...value, ...uploaded] : uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {value.map((url, i) => (
            <div
              key={url}
              className="relative size-20 overflow-hidden rounded-lg border border-border"
            >
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-full bg-charcoal/70 p-0.5 text-ivory"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-graphite/30 px-4 py-6 text-sm text-graphite/70 transition-colors hover:border-bronze hover:text-bronze">
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <UploadCloud size={18} />
            {multiple ? "Upload images" : "Upload image"}
          </>
        )}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          disabled={uploading}
          onChange={(e) => onFilesSelected(e.target.files)}
        />
      </label>

      {error && <p className="text-sm text-brand-red">{error}</p>}
    </div>
  );
}
