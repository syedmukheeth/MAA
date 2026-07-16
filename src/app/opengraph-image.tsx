import { ImageResponse } from "next/og";

/**
 * Default link preview for any page that doesn't supply its own image.
 *
 * Generated rather than a static file so it stays in sync with the brand and
 * needs no design asset to ship. Product pages override this with the actual
 * product photograph, which is always better — this is the fallback for the
 * homepage and editorial routes.
 *
 * Colours are literal here: this renders in an isolated Satori runtime that
 * has no access to globals.css or CSS custom properties. Values mirror
 * --charcoal / --ivory / --gold.
 */
export const runtime = "edge";
export const alt = "MAA FURNITURE — Crafted For Homes, Built For Generations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#231f1c",
          padding: "72px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#e6c280",
            }}
          >
            Handcrafted in Kurnool
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: "#fbfaf7" }}>
            Crafted For Homes.
          </div>
          <div style={{ fontSize: 76, lineHeight: 1.05, color: "#e6c280" }}>
            Built For Generations.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(251,250,247,0.15)",
            paddingTop: "28px",
          }}
        >
          <div style={{ fontSize: 30, letterSpacing: "0.2em", color: "#fbfaf7" }}>
            MAA FURNITURE
          </div>
          <div style={{ fontSize: 22, color: "rgba(251,250,247,0.6)" }}>
            Pan-India Delivery
          </div>
        </div>
      </div>
    ),
    size
  );
}
