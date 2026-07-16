"use client";

import { useEffect } from "react";

/**
 * Last resort: catches failures in the root layout itself, where the normal
 * error boundary can't render because the layout that wraps it is what broke.
 * Must ship its own <html>/<body>.
 *
 * The hex literals below are deliberate and must NOT become tokens. This
 * component replaces the root layout, so it cannot assume globals.css loaded —
 * if the stylesheet is the thing that failed, `bg-background` renders an
 * unstyled white page with black serif text. Inline literals are the only way
 * this screen is guaranteed to look intentional. Same class of exception as
 * email templates. (token-lint: allowlisted.)
 *
 * Values mirror --ivory / --charcoal / --graphite at the time of writing.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#fbfaf7",
          color: "#2a2420",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Something went badly wrong</h1>
        <p style={{ maxWidth: "24rem", fontSize: "0.9rem", color: "#6b635b" }}>
          MAA FURNITURE couldn&apos;t load. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "0.5rem",
            border: 0,
            borderRadius: "999px",
            padding: "0.7rem 1.5rem",
            fontSize: "0.85rem",
            background: "#2a2420",
            color: "#fbfaf7",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        {error.digest && (
          <p style={{ fontSize: "0.7rem", color: "#9a938b", fontFamily: "monospace" }}>
            Reference: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
