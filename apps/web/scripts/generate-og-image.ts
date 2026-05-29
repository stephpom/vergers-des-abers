/**
 * Génère l'image Open Graph (1200×630) pour le partage social.
 * Usage : cd apps/web && bun scripts/generate-og-image.ts
 *
 * Base : photo de verger (verger-pommiers.webp), assombrie par un dégradé,
 * surmontée du branding Pom'Pom. Sortie : public/og-image.jpg (qualité 82).
 */
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/assets/verger-pommiers.webp");
const DST = path.join(ROOT, "public/og-image.jpg");

const WIDTH = 1200;
const HEIGHT = 630;

// Vert primaire Pom'Pom (--primary: 144 100% 28% → hsl) pour l'accent.
const ACCENT = "#008f3a";

const overlaySvg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(8,20,12,0.88)" />
      <stop offset="60%" stop-color="rgba(8,20,12,0.55)" />
      <stop offset="100%" stop-color="rgba(8,20,12,0.20)" />
    </linearGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)" />
  <rect x="80" y="250" width="64" height="6" rx="3" fill="${ACCENT}" />
  <text x="80" y="360" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="700" fill="#ffffff">Pom'Pom</text>
  <text x="80" y="420" font-family="Arial, Helvetica, sans-serif" font-size="34" fill="#e8f5ec">Vergers des Abers</text>
  <text x="80" y="500" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#cfe6d6">Pur jus de pomme artisanal · 100% breton</text>
</svg>`;

async function main(): Promise<void> {
  const base = await sharp(SRC)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .toBuffer();

  await sharp(base)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 82, progressive: true })
    .toFile(DST);

  const meta = await sharp(DST).metadata();
  console.log(`OK → public/og-image.jpg (${meta.width}×${meta.height})`);
}

await main();
