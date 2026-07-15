import { describe, it, expect } from "vitest";
import { access } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OG_PATH = path.resolve(import.meta.dirname, "../../public/og-image.jpg");

describe("og-image (P5)", () => {
  it("public/og-image.jpg existe", async () => {
    await access(OG_PATH);
  });

  it("a les dimensions Open Graph 1200×630", async () => {
    const meta = await sharp(OG_PATH).metadata();
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
  });
});
