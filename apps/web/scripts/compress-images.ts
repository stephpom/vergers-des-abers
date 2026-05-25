/**
 * Convertit les images JPG > 1 Mo en WebP optimisé.
 * Usage : cd apps/web && bun scripts/compress-images.ts
 *
 * Cible : 6 images du verger qui pèsent entre 1.0 et 1.5 Mo en JPG.
 * Sortie : <nom>.webp à côté du source, qualité 80, max width 1920px.
 * Les .jpg source ne sont PAS supprimés (à faire manuellement après vérif visuelle).
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ASSETS_DIR = path.resolve(import.meta.dirname, "../src/assets");
const SIZE_THRESHOLD_BYTES = 800 * 1024; // 800 Ko (capture aussi les images proches du seuil)
const MAX_WIDTH = 1440;
const QUALITY = 72;

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(0)} Ko`;
}

async function main(): Promise<void> {
  const entries = await readdir(ASSETS_DIR);
  const jpgFiles = entries.filter((f) => f.toLowerCase().endsWith(".jpg"));

  const candidates: { name: string; size: number }[] = [];
  for (const file of jpgFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    const st = await stat(filePath);
    if (st.size > SIZE_THRESHOLD_BYTES) {
      candidates.push({ name: file, size: st.size });
    }
  }

  if (candidates.length === 0) {
    console.log("Aucune image à compresser (toutes < 800 Ko).");
    return;
  }

  console.log(`Compression de ${candidates.length} image(s) :`);
  for (const { name, size } of candidates) {
    const srcPath = path.join(ASSETS_DIR, name);
    const dstName = name.replace(/\.jpg$/i, ".webp");
    const dstPath = path.join(ASSETS_DIR, dstName);

    await sharp(srcPath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 6 })
      .toFile(dstPath);

    const newSize = (await stat(dstPath)).size;
    const ratio = ((1 - newSize / size) * 100).toFixed(0);
    console.log(`  ${name} (${formatKB(size)}) → ${dstName} (${formatKB(newSize)})  -${ratio}%`);
  }

  console.log(
    "\nOK. N'oublie pas de :\n" +
      "  1. mettre à jour les imports `.jpg` → `.webp` dans les composants\n" +
      "  2. supprimer les .jpg source quand la migration est vérifiée visuellement",
  );
}

await main();
