// Regenerate all Kareo-kun (mint-green bean) static assets from CareoKun.tsx design.
// Run with: node scripts/generate-kareo-assets.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const eyes = (mood) => {
  const mk = (cx) => {
    if (mood === "celebrate")
      return `<path d="M${cx - 4} 38 L${cx + 4} 46 M${cx - 4} 46 L${cx + 4} 38" stroke="#0D0B21" stroke-width="2" stroke-linecap="round" fill="none"/>`;
    if (mood === "think") return `<circle cx="${cx}" cy="42" r="2" fill="#0D0B21"/>`;
    if (mood === "sleep")
      return `<path d="M${cx - 4} 42 Q${cx} 45 ${cx + 4} 42" stroke="#0D0B21" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="42" rx="2.4" ry="3" fill="#0D0B21"/>`;
  };
  return mk(40) + mk(60);
};

const mouth = (mood) => {
  if (mood === "cheer")
    return `<path d="M42 54 Q50 62 58 54" stroke="#0D0B21" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (mood === "celebrate")
    return `<path d="M40 52 Q50 64 60 52 L58 52 Q50 58 42 52 Z" stroke="#0D0B21" stroke-width="1.5" fill="#fff5b4" stroke-linejoin="round"/>`;
  if (mood === "think")
    return `<path d="M44 56 L56 56" stroke="#0D0B21" stroke-width="2" stroke-linecap="round" fill="none"/>`;
  if (mood === "sleep")
    return `<ellipse cx="50" cy="55" rx="3" ry="2" fill="#0D0B21"/>`;
  return `<path d="M43 53 Q50 58 57 53" stroke="#0D0B21" stroke-width="2" fill="none" stroke-linecap="round"/>`;
};

// Base character without background (transparent).
function characterSvg(mood, { withShadow = true, withLeaf = true } = {}) {
  return [
    withShadow ? `<ellipse cx="50" cy="92" rx="28" ry="3" fill="rgba(0,0,0,0.08)"/>` : "",
    `<path d="M25 55 Q20 30 42 22 Q50 18 58 22 Q80 30 75 55 Q80 82 50 85 Q20 82 25 55 Z" fill="#00c896" stroke="#0D0B21" stroke-width="2.2" stroke-linejoin="round"/>`,
    `<ellipse cx="33" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7"/>`,
    `<ellipse cx="67" cy="52" rx="3.5" ry="2.5" fill="#ff9b8a" opacity="0.7"/>`,
    eyes(mood),
    mouth(mood),
    withLeaf
      ? `<path d="M50 18 Q55 10 62 14 Q58 20 50 22 Z" fill="#00a87e" stroke="#0D0B21" stroke-width="1.8" stroke-linejoin="round"/>`
      : "",
  ].join("");
}

// Transparent SVG (for inline <img>).
function transparentSvg(mood) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-label="カレオくん" role="img">${characterSvg(mood)}</svg>`;
}

// Tight square avatar: zoom in a bit, no leaf, no shadow.
function avatarSvg(mood) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="18 22 64 64" aria-label="カレオくん" role="img">${characterSvg(mood, { withShadow: false, withLeaf: false })}</svg>`;
}

// Square icon with mint background — used for favicon / PWA / apple-touch.
// Character sits in the maskable safe area.
function iconSvg(mood) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-label="カレオくん" role="img">
  <rect width="100" height="100" rx="22" fill="#e6fff7"/>
  <g transform="translate(15 15) scale(0.7)">${characterSvg(mood)}</g>
</svg>`;
}

const moodFor = {
  default: "default",
  thinking: "think",
  celebrating: "celebrate",
  sad: "default",
  encouraging: "cheer",
  loading: "think",
  error: "default",
  waving: "cheer",
};

async function writeSvg(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
  console.log("svg", path);
}

async function writePng(path, svg, size) {
  await mkdir(dirname(path), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path);
  console.log("png", path, `${size}x${size}`);
}

async function main() {
  // Inline character (transparent) — also used as a stand-alone master.
  const masterSvg = transparentSvg("default");
  await writeSvg(join(root, "careo-kun.svg"), masterSvg);

  // Square icon with bg — PWA / favicon source.
  const iconSvgStr = iconSvg("default");
  await writeSvg(join(root, "careo-kun-icon.svg"), iconSvgStr);

  // Overwrite legacy mascot SVG.
  await writeSvg(join(root, "careo-mascot.svg"), masterSvg);

  // Per-expression files used by KareoAvatar / admin/kareo-generator.
  for (const [expr, mood] of Object.entries(moodFor)) {
    const svg = transparentSvg(mood);
    await writeSvg(join(root, "kareo", `kareo-${expr}.svg`), svg);
    await writePng(join(root, "kareo", `kareo-${expr}.png`), svg, 512);
  }
  // Avatar pair (square crop).
  const avSvg = avatarSvg("default");
  await writeSvg(join(root, "kareo", "kareo-avatar.svg"), avSvg);
  await writePng(join(root, "kareo", "kareo-avatar.png"), avSvg, 256);

  // Hero PNG.
  await writePng(join(root, "kareo.png"), masterSvg, 512);

  // Favicon / PWA / apple-touch — all from icon SVG.
  await writePng(join(root, "favicon-32.png"), iconSvgStr, 32);
  await writePng(join(root, "icon-192.png"), iconSvgStr, 192);
  await writePng(join(root, "icon-512.png"), iconSvgStr, 512);
  await writePng(join(root, "apple-touch-icon.png"), iconSvgStr, 180);

  console.log("done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
