"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportMyData } from "@/actions/privacy";

/**
 * Downloads the data export.
 *
 * The JSON comes back through the server action and is turned into a Blob in
 * the browser. Deliberately not a link to a generated file: a URL would be a
 * second copy of everything, reachable by anyone who got hold of the link and
 * outliving the session that authorised it.
 */
export function DataExportCard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setBusy(true);
    setError(null);
    try {
      const result = await exportMyData();
      if ("error" in result) {
        setError(result.error);
        return;
      }

      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      // Release immediately — the object URL is a live handle to a full copy of
      // the person's data sitting in browser memory.
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        onClick={download}
        disabled={busy}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        <Download size={16} className="mr-2" />
        {busy ? "Preparing…" : "Download my data (JSON)"}
      </Button>
      <p className="text-xs text-graphite/50">
        Includes your account details, addresses, orders, custom enquiries and
        consent history. Your password is never included — we only store a
        one-way hash of it and cannot read it.
      </p>
      {error && (
        <p role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      )}
    </div>
  );
}
