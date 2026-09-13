/**
 * Draws the MAA showcase artwork into public/showcase.
 *
 * Flat illustration in the brand palette (see --ivory / --bronze / --gold in
 * src/app/globals.css), built from Indian furniture forms: carved teak, jali
 * lattice, brass, a jharokha arch behind every piece.
 *
 * Output is WEBP, not the SVG these scenes are composed as. next/image refuses
 * to optimise SVG unless `dangerouslyAllowSVG` is set in next.config.ts, and
 * that switch is not worth throwing for artwork: it would also let an SVG
 * uploaded through /admin pass the optimiser and be served from our own origin.
 * The SVG is rasterised here instead and never reaches /public.
 *
 *   node scripts/generate-showcase-art.mjs
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve(process.argv[2] || "public/showcase");
fs.mkdirSync(OUT, { recursive: true });

/** 2x the composed viewBox, so the art stays sharp on a retina hero. */
const SCALE = 2;

const C = {
  wallTop: "#F7F2E7",
  wallBot: "#EBE2D1",
  floorTop: "#E4DCCC",
  floorBot: "#D3C9B4",
  arch: "#F1E9D9",
  archLine: "#D8C6A4",
  jali: "#CDB88F",
  woodL: "#C08A55",
  woodM: "#98653A",
  woodD: "#6B4526",
  woodX: "#4A2E1A",
  gold: "#E0BB77",
  brass: "#C79A3E",
  maroon: "#7C2E3B",
  mustard: "#C99334",
  indigo: "#3D4A6B",
  cream: "#F3EEE2",
  ivory: "#FAF7F0",
  sage: "#6E8E68",
  sageD: "#4F6B4B",
  terracotta: "#B5603C",
  charcoal: "#3A332B",
  shadow: "#7A6A52",
};

const defs = `
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.wallTop}"/><stop offset="1" stop-color="${C.wallBot}"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.floorTop}"/><stop offset="1" stop-color="${C.floorBot}"/>
  </linearGradient>
  <linearGradient id="wood" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="${C.woodL}"/><stop offset="0.55" stop-color="${C.woodM}"/><stop offset="1" stop-color="${C.woodD}"/>
  </linearGradient>
  <linearGradient id="woodDark" x1="0" y1="0" x2="0.35" y2="1">
    <stop offset="0" stop-color="${C.woodM}"/><stop offset="1" stop-color="${C.woodX}"/>
  </linearGradient>
  <linearGradient id="woodLight" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0" stop-color="#D6A472"/><stop offset="1" stop-color="${C.woodM}"/>
  </linearGradient>
  <linearGradient id="cloth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#963D4B"/><stop offset="1" stop-color="${C.maroon}"/>
  </linearGradient>
  <linearGradient id="clothGold" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#DCA845"/><stop offset="1" stop-color="${C.mustard}"/>
  </linearGradient>
  <linearGradient id="linenCloth" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFFDF8"/><stop offset="1" stop-color="#E7DFCE"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="${C.gold}" stop-opacity="0.55"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/>
  </radialGradient>
  <pattern id="jali" width="44" height="44" patternUnits="userSpaceOnUse">
    <path d="M22 2 L42 22 L22 42 L2 22 Z" fill="none" stroke="${C.jali}" stroke-width="2.5"/>
    <circle cx="22" cy="22" r="6" fill="none" stroke="${C.jali}" stroke-width="2.5"/>
  </pattern>
  <pattern id="grain" width="70" height="14" patternUnits="userSpaceOnUse">
    <path d="M0 7 q17 -5 35 0 t35 0" fill="none" stroke="#2A190C" stroke-opacity="0.13" stroke-width="2"/>
  </pattern>
  <pattern id="cane" width="18" height="18" patternUnits="userSpaceOnUse">
    <path d="M0 0 L18 18 M18 0 L0 18" stroke="#8A6136" stroke-opacity="0.5" stroke-width="2"/>
  </pattern>
  <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="14"/>
  </filter>
</defs>`;

/* ── primitives ─────────────────────────────────────────────────────────── */
const rr = (x, y, w, h, fill = "url(#wood)", r = 6, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;

const grain = (x, y, w, h, r = 6) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="url(#grain)"/>`;

const panel = (x, y, w, h, r = 6) =>
  rr(x, y, w, h) + grain(x, y, w, h, r);

const shadow = (cx, cy, rx, ry = 22) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${C.shadow}" opacity="0.22" filter="url(#soft)"/>`;

/** Small carved floral motif — the repeated MAA ornament. */
const motif = (x, y, s = 1, color = C.gold, op = 0.85) => `
  <g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="2.6" opacity="${op}" stroke-linecap="round">
    <path d="M0 -14 C 9 -8 9 8 0 14 C -9 8 -9 -8 0 -14 Z"/>
    <path d="M-14 0 C -8 -9 8 -9 14 0 C 8 9 -8 9 -14 0 Z"/>
    <circle cx="0" cy="0" r="3.2" fill="${color}" stroke="none"/>
  </g>`;

/** Lattice window panel (jali). */
const jaliPanel = (x, y, w, h, r = 6) => `
  <g>
    ${rr(x, y, w, h, C.woodX, r)}
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${Math.max(0, r - 3)}" fill="url(#jali)" opacity="0.75"/>
    <rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="${Math.max(0, r - 3)}" fill="none" stroke="${C.gold}" stroke-width="2" opacity="0.6"/>
  </g>`;

const knob = (cx, cy, r = 7) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.brass}"/><circle cx="${cx - r / 3}" cy="${cy - r / 3}" r="${r / 3}" fill="#F0DFA8"/>`;

/** Turned/tapered leg. */
const leg = (x, y, w, h, fill = "url(#woodDark)") => `
  <path d="M${x} ${y} h${w} l${-w * 0.16} ${h} h${-w * 0.68} Z" fill="${fill}"/>`;

/* ── decor ──────────────────────────────────────────────────────────────── */
const plant = (x, baseY, s = 1) => `
  <g transform="translate(${x} ${baseY}) scale(${s * 1.95})">
    <path d="M0 -40 C -10 -90 -46 -104 -52 -150 C -18 -136 -6 -100 0 -60 C 8 -104 30 -140 62 -150 C 50 -102 16 -88 4 -40 Z" fill="${C.sage}"/>
    <path d="M0 -46 C -6 -84 -26 -98 -30 -128 C -8 -116 -2 -88 0 -62 Z" fill="${C.sageD}" opacity="0.7"/>
    <path d="M-34 -44 h68 l-9 52 a10 10 0 0 1 -10 8 h-30 a10 10 0 0 1 -10 -8 Z" fill="${C.terracotta}"/>
    <rect x="-38" y="-50" width="76" height="14" rx="5" fill="#C9714B"/>
  </g>`;

const brassPot = (x, baseY, s = 1) => `
  <g transform="translate(${x} ${baseY}) scale(${s * 1.9})">
    <path d="M-26 -18 C -34 -44 -24 -66 0 -66 C 24 -66 34 -44 26 -18 C 22 -4 -22 -4 -26 -18 Z" fill="${C.brass}"/>
    <path d="M-18 -58 C -8 -62 8 -62 18 -58" stroke="#F0DFA8" stroke-width="3" fill="none"/>
    <rect x="-14" y="-72" width="28" height="10" rx="4" fill="#A87F2E"/>
    <ellipse cx="0" cy="-6" rx="26" ry="7" fill="#A87F2E"/>
  </g>`;

const hangingLamp = (x, topY, s = 1) => `
  <g transform="translate(${x} ${topY}) scale(${s})">
    <path d="M0 0 v120" stroke="${C.woodX}" stroke-width="3"/>
    <path d="M-38 120 h76 l-14 46 h-48 Z" fill="${C.brass}"/>
    <ellipse cx="0" cy="166" rx="24" ry="6" fill="#F3E3B0"/>
    <ellipse cx="0" cy="184" rx="70" ry="40" fill="url(#glow)"/>
  </g>`;

const rug = (cx, cy, w, h) => `
  <g>
    <ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="#D8C7A4"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 16}" ry="${h / 2 - 8}" fill="none" stroke="${C.terracotta}" stroke-width="4" opacity="0.6"/>
    <ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 40}" ry="${h / 2 - 18}" fill="none" stroke="${C.maroon}" stroke-width="3" opacity="0.45"/>
  </g>`;

/* ── scene frame ────────────────────────────────────────────────────────── */
function scene(w, h, body, opts = {}) {
  const floorY = opts.floorY ?? Math.round(h * 0.74);
  const cx = w / 2;
  const aw = opts.archW ?? Math.round(w * 0.26);
  const archTop = opts.archTop ?? Math.round(h * 0.14);
  const archPath = `M${cx - aw} ${floorY} V${archTop + aw} A${aw} ${aw} 0 0 1 ${cx + aw} ${archTop + aw} V${floorY} Z`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">
${defs}
  <rect width="${w}" height="${h}" fill="url(#wall)"/>
  <g opacity="0.95">
    <path d="${archPath}" fill="${C.arch}"/>
    <path d="${archPath}" fill="url(#jali)" opacity="0.28"/>
    <path d="${archPath}" fill="none" stroke="${C.archLine}" stroke-width="5"/>
  </g>
  ${opts.decorBack ?? ""}
  <rect x="0" y="${floorY}" width="${w}" height="${h - floorY}" fill="url(#floor)"/>
  <rect x="0" y="${floorY}" width="${w}" height="7" fill="#C3B59A"/>
${body}
  <rect width="${w}" height="${h}" fill="none"/>
</svg>
`;
}

/* ── pieces ─────────────────────────────────────────────────────────────── */

/** Three-seater carved teak sofa. Origin = bottom-centre. */
function sofa(cx, baseY, s = 1) {
  const w = 620, seatY = -190, backY = -330;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 330, 26)}
    <!-- back -->
    ${panel(-w / 2 + 30, backY, w - 60, 150, 16)}
    <rect x="${-w / 2 + 52}" y="${backY + 20}" width="${w - 104}" height="110" rx="10" fill="url(#cloth)"/>
    ${motif(-150, backY + 75, 1.1)} ${motif(0, backY + 75, 1.3)} ${motif(150, backY + 75, 1.1)}
    <!-- arms with scrolled elephant-trunk curl -->
    <g>
      <path d="M${-w / 2} ${seatY - 10} q0 -70 46 -70 q46 0 46 70 v110 h-92 Z" fill="url(#wood)"/>
      <path d="M${-w / 2 + 46} ${seatY - 62} a34 34 0 1 0 0.1 0" fill="none" stroke="${C.gold}" stroke-width="3.5" opacity="0.8"/>
      <path d="M${w / 2} ${seatY - 10} q0 -70 -46 -70 q-46 0 -46 70 v110 h92 Z" fill="url(#wood)"/>
      <path d="M${w / 2 - 46} ${seatY - 62} a34 34 0 1 0 0.1 0" fill="none" stroke="${C.gold}" stroke-width="3.5" opacity="0.8"/>
    </g>
    <!-- seat frame + cushions -->
    ${panel(-w / 2 + 20, seatY + 46, w - 40, 44, 12)}
    ${[-1, 0, 1]
      .map((i) => `<rect x="${i * 196 - 92}" y="${seatY - 6}" width="184" height="56" rx="16" fill="url(#clothGold)"/>
      <path d="M${i * 196 - 72} ${seatY + 20} h144" stroke="#A9772A" stroke-width="3" opacity="0.55"/>`)
      .join("")}
    <!-- apron carving -->
    ${rr(-w / 2 + 40, seatY + 92, w - 80, 26, "url(#woodDark)", 8)}
    <path d="M${-w / 2 + 60} ${seatY + 105} q40 -18 80 0 t80 0 t80 0 t80 0 t80 0 t80 0" fill="none" stroke="${C.gold}" stroke-width="2.6" opacity="0.7"/>
    <!-- legs -->
    ${leg(-w / 2 + 34, seatY + 118, 40, 74)}
    ${leg(w / 2 - 74, seatY + 118, 40, 74)}
    ${leg(-24, seatY + 118, 40, 74)}
  </g>`;
}

/** Carved jhoola swing on brass chains. Origin = seat bottom-centre. */
function jhoola(cx, seatBaseY, topY, s = 1) {
  const w = 440;
  return `<g transform="translate(${cx} ${seatBaseY}) scale(${s})">
    ${shadow(0, 130, 230, 20)}
    <!-- chains -->
    ${[-1, 1]
      .map(
        (i) => `<path d="M${i * (w / 2 - 14)} ${topY} V-96" stroke="${C.brass}" stroke-width="7"/>
        <path d="M${i * (w / 2 - 14)} ${topY} V-96" stroke="#F0DFA8" stroke-width="2.5" stroke-dasharray="8 10"/>`
      )
      .join("")}
    <!-- back rest -->
    ${panel(-w / 2 + 16, -262, w - 32, 156, 14)}
    ${jaliPanel(-w / 2 + 40, -244, w - 80, 120, 10)}
    <path d="M${-w / 2 + 16} -286 q${w / 2 - 16} -60 ${w - 32} 0" fill="url(#woodLight)"/>
    ${motif(0, -280, 1.3)}
    <!-- seat -->
    ${panel(-w / 2, -96, w, 40, 12)}
    <rect x="${-w / 2 + 20}" y="-142" width="${w - 40}" height="52" rx="16" fill="url(#cloth)"/>
    ${motif(-110, -116, 0.8)} ${motif(0, -116, 0.8)} ${motif(110, -116, 0.8)}
    <!-- arm rails -->
    ${[-1, 1]
      .map(
        (i) => `${rr(i * (w / 2 - 26) - 13, -200, 26, 106, "url(#woodDark)", 8)}
        ${rr(i * (w / 2 - 62) - 42, -212, 84, 22, "url(#wood)", 8)}`
      )
      .join("")}
    <!-- carved apron -->
    ${rr(-w / 2 + 10, -58, w - 20, 22, "url(#woodDark)", 8)}
    <path d="M${-w / 2 + 30} -47 q32 -16 64 0 t64 0 t64 0 t64 0 t64 0" fill="none" stroke="${C.gold}" stroke-width="2.4" opacity="0.7"/>
  </g>`;
}

/** Sheesham dining table with cane-back chairs. Origin = bottom-centre. */
function diningSet(cx, baseY, s = 1) {
  const tw = 660;
  const chair = (x, flip) => `
    <g transform="translate(${x} 0) scale(${flip} 1)">
      ${panel(-62, -370, 124, 168, 12)}
      <rect x="-44" y="-352" width="88" height="132" rx="8" fill="url(#cane)"/>
      <rect x="-44" y="-352" width="88" height="132" rx="8" fill="none" stroke="${C.woodX}" stroke-width="4"/>
      ${motif(0, -386, 0.8)}
      ${panel(-72, -212, 144, 26, 8)}
      ${leg(-66, -186, 24, 186)}
      ${leg(44, -186, 24, 186)}
    </g>`;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 400, 26)}
    ${chair(-352, 1)}
    ${chair(352, -1)}
    <!-- table top -->
    ${panel(-tw / 2 - 18, -258, tw + 36, 46, 10)}
    ${rr(-tw / 2 + 8, -212, tw - 16, 22, "url(#woodDark)", 6)}
    <path d="M${-tw / 2 + 30} -201 q36 -16 72 0 t72 0 t72 0 t72 0 t72 0 t72 0 t72 0" fill="none" stroke="${C.gold}" stroke-width="2.4" opacity="0.65"/>
    <!-- legs -->
    ${leg(-tw / 2 + 40, -190, 52, 190)}
    ${leg(tw / 2 - 92, -190, 52, 190)}
    ${rr(-tw / 2 + 56, -100, tw - 112, 18, "url(#woodDark)", 6)}
    <!-- brass jug on table -->
    ${brassPot(0, -258, 0.55)}
  </g>`;
}

/** Carved almirah / wardrobe. Origin = bottom-centre. */
function almirah(cx, baseY, s = 1) {
  const w = 420, h = 620;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 240, 22)}
    ${panel(-w / 2, -h, w, h, 14)}
    <!-- cornice -->
    ${rr(-w / 2 - 22, -h - 34, w + 44, 40, "url(#woodLight)", 10)}
    <path d="M${-w / 2 - 10} ${-h - 34} q${w / 2 + 10} -46 ${w + 20} 0" fill="url(#woodLight)"/>
    ${motif(0, -h - 42, 1.2)}
    <!-- two doors -->
    ${jaliPanel(-w / 2 + 26, -h + 40, w / 2 - 40, 300, 10)}
    ${jaliPanel(14, -h + 40, w / 2 - 40, 300, 10)}
    ${rr(-w / 2 + 26, -h + 364, w / 2 - 40, 150, "url(#woodDark)", 10)}
    ${rr(14, -h + 364, w / 2 - 40, 150, "url(#woodDark)", 10)}
    ${motif(-w / 4 + 4, -h + 439, 1.1)} ${motif(w / 4 - 4, -h + 439, 1.1)}
    <!-- handles + lock plate -->
    ${knob(-16, -h + 200, 9)} ${knob(16, -h + 200, 9)}
    ${rr(-14, -h + 176, 28, 52, C.brass, 6)}
    <!-- base -->
    ${rr(-w / 2 - 12, -70, w + 24, 32, "url(#woodDark)", 8)}
    ${leg(-w / 2 + 6, -38, 40, 38)}
    ${leg(w / 2 - 46, -38, 40, 38)}
  </g>`;
}

/** Teak puja mandir with dome. Origin = bottom-centre. */
function mandir(cx, baseY, s = 1) {
  const w = 400;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 230, 22)}
    <!-- dome -->
    <path d="M0 -640 l16 34 a120 120 0 0 1 104 116 h-240 a120 120 0 0 1 104 -116 Z" fill="url(#woodLight)"/>
    <path d="M0 -672 v34" stroke="${C.brass}" stroke-width="7"/>
    <circle cx="0" cy="-678" r="11" fill="${C.brass}"/>
    ${rr(-w / 2 - 16, -492, w + 32, 34, "url(#wood)", 10)}
    <!-- pillars + jali back -->
    ${panel(-w / 2, -458, 38, 250, 8)}
    ${panel(w / 2 - 38, -458, 38, 250, 8)}
    ${jaliPanel(-w / 2 + 44, -458, w - 88, 250, 8)}
    <!-- inner glow + diya -->
    <ellipse cx="0" cy="-300" rx="120" ry="90" fill="url(#glow)"/>
    <path d="M-26 -232 q26 -18 52 0 q-10 16 -26 16 t-26 -16 Z" fill="${C.brass}"/>
    <path d="M22 -244 q6 -16 -2 -26 q16 8 12 26 Z" fill="#F6D98A"/>
    <!-- hanging bells -->
    ${[-1, 1]
      .map(
        (i) => `<path d="M${i * 132} -452 v34" stroke="${C.brass}" stroke-width="3"/>
        <path d="M${i * 132 - 14} -394 a14 22 0 0 1 28 0 Z" fill="${C.brass}"/>
        <circle cx="${i * 132}" cy="-390" r="4" fill="#A87F2E"/>`
      )
      .join("")}
    <!-- base with drawers -->
    ${panel(-w / 2 - 16, -208, w + 32, 150, 12)}
    ${rr(-w / 2 + 6, -190, w - 12, 52, "url(#woodDark)", 8)}
    ${rr(-w / 2 + 6, -126, w - 12, 52, "url(#woodDark)", 8)}
    ${knob(0, -164)} ${knob(0, -100)}
    ${motif(-130, -164, 0.8)} ${motif(130, -164, 0.8)}
    ${leg(-w / 2 + 4, -58, 40, 58)}
    ${leg(w / 2 - 44, -58, 40, 58)}
  </g>`;
}

/** Carved teak double bed. Origin = bottom-centre. */
function cot(cx, baseY, s = 1) {
  const w = 760;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 420, 26)}
    <!-- headboard -->
    ${panel(-w / 2, -420, w * 0.34, 300, 14)}
    <path d="M${-w / 2} -420 q${w * 0.17} -74 ${w * 0.34} 0" fill="url(#woodLight)"/>
    ${jaliPanel(-w / 2 + 26, -392, w * 0.34 - 52, 150, 10)}
    ${motif(-w / 2 + w * 0.17, -438, 1.3)}
    <!-- footboard, drawn before the mattress so the bedding overlaps it -->
    ${panel(w / 2 - 96, -318, 96, 206, 12)}
    <path d="M${w / 2 - 96} -318 q48 -50 96 0" fill="url(#woodLight)"/>
    <!-- mattress + bedding -->
    ${rr(-w / 2 + w * 0.335, -282, w * 0.583, 74, "url(#linenCloth)", 16)}
    ${rr(-w / 2 + w * 0.335, -216, w * 0.583, 42, "url(#wood)", 10)}
    <rect x="${-w / 2 + w * 0.6}" y="-288" width="190" height="84" rx="14" fill="url(#cloth)"/>
    <path d="M${-w / 2 + w * 0.62} -246 h150" stroke="${C.gold}" stroke-width="3.5" opacity="0.75"/>
    <!-- pillows -->
    ${[0, 1]
      .map((i) => `<rect x="${-w / 2 + w * 0.36 + i * 116}" y="-344" width="108" height="60" rx="24" fill="url(#linenCloth)" stroke="${C.archLine}" stroke-width="2"/>`)
      .join("")}
    <!-- rail + legs -->
    ${rr(-w / 2 + w * 0.335, -176, w * 0.583, 28, "url(#woodDark)", 8)}
    <path d="M${-w / 2 + w * 0.36} -163 q34 -18 68 0 t68 0 t68 0 t68 0 t68 0 t68 0" fill="none" stroke="${C.gold}" stroke-width="2.4" opacity="0.65"/>
    ${leg(-w / 2 + 10, -148, 50, 148)}
    ${leg(w / 2 - 60, -148, 50, 148)}
  </g>`;
}

/** Sheesham study desk with chair. Origin = bottom-centre. */
function desk(cx, baseY, s = 1) {
  const w = 560;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 340, 24)}
    <!-- matching chair, pulled out to the side of the desk -->
    <g transform="translate(${w / 2 + 118} 0)">
      ${panel(-74, -364, 148, 156, 12)}
      <rect x="-56" y="-346" width="112" height="120" rx="8" fill="url(#cane)"/>
      <rect x="-56" y="-346" width="112" height="120" rx="8" fill="none" stroke="${C.woodX}" stroke-width="4"/>
      ${motif(0, -380, 0.75)}
      ${panel(-84, -212, 168, 26, 8)}
      ${leg(-78, -186, 24, 186)}
      ${leg(56, -186, 24, 186)}
    </g>
    <!-- desk top -->
    ${panel(-w / 2, -300, w, 30, 10)}
    <!-- drawer bank -->
    ${panel(-w / 2 + 20, -270, 200, 200, 10)}
    ${rr(-w / 2 + 36, -254, 168, 52, "url(#woodDark)", 8)}
    ${rr(-w / 2 + 36, -192, 168, 52, "url(#woodDark)", 8)}
    ${rr(-w / 2 + 36, -130, 168, 52, "url(#woodDark)", 8)}
    ${knob(-w / 2 + 120, -228)} ${knob(-w / 2 + 120, -166)} ${knob(-w / 2 + 120, -104)}
    ${rr(w / 2 - 76, -270, 54, 200, "url(#wood)", 8)}
    ${rr(-w / 2 + 20, -70, w - 40, 18, "url(#woodDark)", 6)}
    <!-- books + brass lamp -->
    <g>
      ${rr(-120, -336, 26, 36, C.maroon, 3)}
      ${rr(-92, -330, 22, 30, C.indigo, 3)}
      ${rr(-68, -338, 28, 38, C.sageD, 3)}
      <ellipse cx="150" cy="-300" rx="40" ry="10" fill="#A87F2E"/>
      <path d="M150 -306 v-70" stroke="${C.brass}" stroke-width="8"/>
      <path d="M128 -378 h44 l32 48 h-108 Z" fill="${C.brass}"/>
      <path d="M132 -372 h36" stroke="#F0DFA8" stroke-width="3"/>
      <ellipse cx="150" cy="-322" rx="66" ry="40" fill="url(#glow)"/>
    </g>
  </g>`;
}

/** Cane + teak outdoor seating. Origin = bottom-centre. */
function caneSet(cx, baseY, s = 1) {
  const armchair = (x) => `
    <g transform="translate(${x} 0)">
      ${panel(-110, -300, 220, 130, 18)}
      <rect x="-92" y="-286" width="184" height="102" rx="12" fill="url(#cane)"/>
      <rect x="-92" y="-286" width="184" height="102" rx="12" fill="none" stroke="${C.woodX}" stroke-width="4"/>
      ${rr(-120, -176, 240, 26, "url(#wood)", 10)}
      <rect x="-98" y="-204" width="196" height="34" rx="14" fill="${C.terracotta}"/>
      ${rr(-126, -230, 22, 82, "url(#woodDark)", 8)}
      ${rr(104, -230, 22, 82, "url(#woodDark)", 8)}
      ${leg(-116, -150, 26, 150)}
      ${leg(90, -150, 26, 150)}
    </g>`;
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 420, 24)}
    ${armchair(-300)}
    ${armchair(300)}
    <!-- low table -->
    ${panel(-150, -190, 300, 24, 8)}
    <rect x="-132" y="-166" width="264" height="26" rx="8" fill="url(#cane)"/>
    ${leg(-140, -140, 26, 140)}
    ${leg(114, -140, 26, 140)}
    ${brassPot(0, -190, 0.6)}
  </g>`;
}

/** Centre table with brass inlay. Origin = bottom-centre. */
function centreTable(cx, baseY, s = 1) {
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 180, 16)}
    ${panel(-170, -150, 340, 26, 8)}
    <path d="M-140 -137 h280" stroke="${C.brass}" stroke-width="3" opacity="0.8"/>
    ${rr(-150, -124, 300, 18, "url(#woodDark)", 6)}
    ${motif(0, -115, 0.6)}
    ${leg(-150, -106, 30, 106)}
    ${leg(120, -106, 30, 106)}
  </g>`;
}

/** Bedside table. Origin = bottom-centre. */
function bedside(cx, baseY, s = 1) {
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 100, 14)}
    ${panel(-92, -230, 184, 26, 8)}
    ${panel(-80, -204, 160, 150, 8)}
    ${rr(-64, -188, 128, 52, "url(#woodDark)", 6)}
    ${rr(-64, -126, 128, 52, "url(#woodDark)", 6)}
    ${knob(0, -162)} ${knob(0, -100)}
    ${leg(-76, -54, 26, 54)}
    ${leg(50, -54, 26, 54)}
  </g>`;
}

/** TV console. Origin = bottom-centre. */
function console_(cx, baseY, s = 1) {
  return `<g transform="translate(${cx} ${baseY}) scale(${s})">
    ${shadow(0, 6, 200, 16)}
    ${panel(-210, -190, 420, 130, 10)}
    ${jaliPanel(-192, -172, 180, 94, 8)}
    ${jaliPanel(14, -172, 180, 94, 8)}
    ${knob(-102, -125)} ${knob(104, -125)}
    ${leg(-196, -60, 28, 60)}
    ${leg(168, -60, 28, 60)}
  </g>`;
}

/* ── compositions ───────────────────────────────────────────────────────── */
const W = 1200, H = 900, BASE = 730;

const files = {
  // 16:9 hero — furnished Indian living room.
  "hero-living-room.svg": scene(
    1600,
    900,
    `
  ${hangingLamp(1280, 30, 1)}
  ${rug(820, 812, 980, 150)}
  ${console_(270, 800, 0.86)}
  ${plant(120, 806, 0.8)}
  ${sofa(860, 768, 0.94)}
  ${centreTable(860, 840, 0.92)}
  ${plant(1320, 806, 0.62)}
  ${brassPot(1480, 806, 0.9)}
  ${jaliPanel(180, 190, 200, 260, 10)}
`,
    { floorY: 660, archW: 300, archTop: 70 }
  ),

  // 16:9 — the custom studio workbench.
  "custom-studio-workshop.svg": scene(
    1600,
    900,
    `
  ${hangingLamp(900, 20, 0.95)}
  <!-- tool rack on the wall -->
  <g transform="translate(1330 250)">
    ${rr(-190, 0, 380, 20, "url(#woodDark)", 5)}
    ${[-135, -45, 45, 135]
      .map((x) => `<path d="M${x} 20 v104" stroke="#9AA3AC" stroke-width="10" stroke-linecap="round"/><rect x="${x - 12}" y="124" width="24" height="58" rx="7" fill="${C.woodM}"/>`)
      .join("")}
  </g>
  <!-- stacked timber -->
  <g transform="translate(215 820)">
    ${shadow(0, 8, 170, 16)}
    ${panel(-170, -46, 340, 42, 6)}
    ${panel(-150, -88, 300, 42, 6)}
    ${panel(-128, -130, 256, 42, 6)}
  </g>
  <!-- workbench -->
  <g transform="translate(900 790)">
    ${shadow(0, 10, 420, 26)}
    ${panel(-440, -260, 880, 46, 8)}
    ${rr(-420, -214, 840, 24, "url(#woodDark)", 6)}
    ${leg(-400, -190, 64, 190)}
    ${leg(336, -190, 64, 190)}
    ${rr(-380, -104, 760, 18, "url(#woodDark)", 5)}
    <!-- vise -->
    ${rr(-470, -212, 60, 44, C.charcoal, 6)}
    <path d="M-440 -168 v54" stroke="${C.charcoal}" stroke-width="10"/>
    <!-- the panel being carved -->
    ${rr(-300, -322, 470, 62, "url(#woodLight)", 8)}${grain(-300, -322, 470, 62, 8)}<rect x="-300" y="-322" width="470" height="62" rx="8" fill="none" stroke="${C.woodX}" stroke-width="3" opacity="0.55"/>
    ${motif(-210, -291, 1.3)} ${motif(-65, -291, 1.3)} ${motif(80, -291, 1.3)}
    <!-- chisels + mallet resting on the bench -->
    <g transform="translate(200 -286)">
      <path d="M0 12 h120" stroke="${C.woodX}" stroke-width="12" stroke-linecap="round"/>
      <path d="M120 12 h56" stroke="#9AA3AC" stroke-width="9" stroke-linecap="round"/>
      <path d="M4 34 h104" stroke="${C.woodM}" stroke-width="12" stroke-linecap="round"/>
      <path d="M108 34 h48" stroke="#9AA3AC" stroke-width="8" stroke-linecap="round"/>
    </g>
    <g transform="translate(-400 -318)">
      ${rr(0, 0, 52, 76, "url(#woodLight)", 8)}
      ${rr(19, 66, 15, 76, "url(#woodDark)", 5)}
    </g>
    <!-- shavings -->
    <g fill="none" stroke="${C.woodL}" stroke-width="4" opacity="0.9">
      <path d="M-360 -200 q22 -22 44 0 t44 0"/>
      <path d="M210 -200 q20 -20 40 0 t40 0"/>
      <path d="M330 -196 q18 -18 36 0"/>
    </g>
  </g>
  ${brassPot(1520, 830, 0.8)}
`,
    { floorY: 660, archW: 280, archTop: 80 }
  ),

  "teak-carved-sofa-set.svg": scene(
    W,
    H,
    `${rug(600, 800, 880, 150)}
  ${sofa(600, BASE, 1.02)}
  ${centreTable(600, 840, 0.8)}
  ${plant(120, 790, 0.78)}
  ${brassPot(1090, 800, 0.85)}`
  ),

  "wooden-jhoola-swing.svg": scene(
    W,
    H,
    `${rug(600, 810, 760, 130)}
  ${jhoola(600, 640, -510, 1.05)}
  ${plant(150, 800, 0.8)}
  ${brassPot(1060, 800, 0.8)}`,
    { archTop: 60 }
  ),

  "sheesham-dining-set.svg": scene(
    W,
    H,
    `${diningSet(600, BASE, 1.0)}
  ${plant(120, 800, 0.75)}
  ${brassPot(1100, 800, 0.75)}`
  ),

  "carved-almirah-wardrobe.svg": scene(
    W,
    H,
    `${almirah(600, BASE, 1.0)}
  ${plant(160, 800, 0.8)}
  ${brassPot(1060, 800, 0.85)}`,
    { archTop: 60 }
  ),

  "teak-puja-mandir.svg": scene(
    W,
    H,
    `${mandir(600, BASE, 0.95)}
  ${plant(150, 800, 0.72)}
  ${brassPot(1070, 800, 0.8)}`,
    { archW: 340, archTop: 40 }
  ),

  "carved-teak-cot.svg": scene(
    W,
    H,
    `${rug(600, 810, 920, 130)}
  ${cot(580, BASE, 0.98)}
  ${bedside(1080, BASE, 0.72)}
  ${plant(110, 800, 0.72)}`
  ),

  "sheesham-study-desk.svg": scene(
    W,
    H,
    `${desk(600, BASE, 1.05)}
  ${plant(140, 800, 0.75)}
  ${brassPot(1090, 800, 0.75)}`
  ),

  "cane-outdoor-set.svg": scene(
    W,
    H,
    `${caneSet(600, BASE, 0.92)}
  ${plant(120, 800, 0.9)}
  ${plant(1090, 800, 0.72)}`,
    { archW: 340, archTop: 50 }
  ),

  "combo-living-room.svg": scene(
    W,
    H,
    `${rug(600, 812, 980, 140)}
  ${console_(210, 770, 0.68)}
  ${sofa(660, 720, 0.84)}
  ${centreTable(660, 812, 0.76)}
  ${plant(105, 795, 0.72)}
  ${brassPot(1120, 800, 0.72)}`,
    { archW: 340 }
  ),

  "combo-bedroom.svg": scene(
    W,
    H,
    `${rug(600, 815, 940, 130)}
  ${almirah(210, 745, 0.66)}
  ${cot(680, 745, 0.82)}
  ${bedside(1090, 745, 0.6)}
  ${plant(1160, 800, 0.5)}`,
    { archW: 340 }
  ),
};

for (const [name, svg] of Object.entries(files)) {
  const [, w, h] = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const file = path.join(OUT, name.replace(/\.svg$/, ".webp"));
  await sharp(Buffer.from(svg), { density: 96 * SCALE })
    .resize(Number(w) * SCALE, Number(h) * SCALE)
    .webp({ quality: 84 })
    .toFile(file);
  console.log(`${path.basename(file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}
