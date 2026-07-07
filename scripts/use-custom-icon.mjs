/**
 * Turns a hand-made icon image into all the assets Expo needs.
 *
 * Usage: node scripts/use-custom-icon.mjs <path-to-icon.png>
 * Needs sharp: npm i -D sharp
 *
 * Handles icons with transparent rounded corners (like App Store screenshots):
 * iOS requires a full-bleed opaque square, so the artwork is composited over a
 * gradient sampled from its own top and bottom edges before export.
 */
import sharp from 'sharp';
import { existsSync } from 'node:fs';

const SRC = process.argv[2];
if (!SRC || !existsSync(SRC)) {
  console.error('Usage: node scripts/use-custom-icon.mjs <path-to-icon.png>');
  process.exit(1);
}
const OUT = new URL('../assets/images/', import.meta.url).pathname;

// --- Crop to the opaque artwork (drops soft shadow margins) --------------
const raw = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = raw.info;
let minX = W, minY = H, maxX = 0, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (C < 4 || raw.data[(y * W + x) * C + 3] > 230) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const cropped = await sharp(SRC)
  .extract({ left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 })
  .png()
  .toBuffer();
console.log(`cropped to opaque bounds: ${maxX - minX + 1}x${maxY - minY + 1}`);

// --- Pad to square on transparent ----------------------------------------
const meta = await sharp(cropped).metadata();
const size = Math.max(meta.width, meta.height);
const squared = await sharp(cropped)
  .extend({
    top: Math.floor((size - meta.height) / 2),
    bottom: Math.ceil((size - meta.height) / 2),
    left: Math.floor((size - meta.width) / 2),
    right: Math.ceil((size - meta.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

// --- Full-bleed opaque square (iOS icon, Android foreground, favicon) ----
// The artwork has its own rounded corners, so the backdrop is a blurred,
// zoomed copy of the artwork itself — the corners continue the vignette
// seamlessly instead of showing a frame.
const artwork1024 = await sharp(squared).resize(1024, 1024).png().toBuffer();
const zoom = 1400; // 137%: enough that the zoomed copy's corners fall outside the crop
const inset = Math.floor((zoom - 1024) / 2);
const backdrop = await sharp(squared)
  .resize(zoom, zoom)
  .extract({ left: inset, top: inset, width: 1024, height: 1024 })
  .blur(40)
  .removeAlpha()
  .toBuffer();
const flat = await sharp(backdrop)
  .composite([{ input: artwork1024 }])
  .png()
  .toBuffer();

const { dominant } = await sharp(artwork1024).stats();
const hex = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
console.log('dominant colour (use for splash/adaptive background):', hex);

await sharp(flat).toFile(`${OUT}icon.png`);
await sharp(flat).toFile(`${OUT}android-icon-foreground.png`);
await sharp(flat).resize(48, 48).toFile(`${OUT}favicon.png`);

// --- Splash: original artwork (transparency kept) ------------------------
await sharp(squared).resize(512, 512).toFile(`${OUT}splash-icon.png`);

console.log('wrote icon.png, android-icon-foreground.png, favicon.png, splash-icon.png');
