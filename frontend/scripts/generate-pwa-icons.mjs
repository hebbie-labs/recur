// One-off generator for placeholder PWA icons - stdlib only (zlib), no
// image library or system tool (ImageMagick/sharp) is available in this
// environment. Draws an "R" block glyph on the brand near-black square
// (matches SidebarBrand.tsx's TerminalIcon-on-sidebar-primary mark).
// Run manually: `node scripts/generate-pwa-icons.mjs`. Re-run whenever real
// brand artwork replaces this placeholder.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const BRAND = [0x1a, 0x1a, 0x1a]; // near-black, matches --sidebar-primary
const WHITE = [255, 255, 255];

// 5x7 block bitmap for "R", 1 = glyph pixel.
const GLYPH_R = [
  "11110",
  "10001",
  "10001",
  "11110",
  "10100",
  "10010",
  "10001",
];

function crc32(buf) {
  let crc = ~0;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// padding: fraction of the square left empty on each side around the glyph
// (maskable icons need a larger safe zone so the OS can crop to a circle).
function renderPng(size, padding) {
  const glyphH = GLYPH_R.length;
  const glyphW = GLYPH_R[0].length;
  const usable = size * (1 - padding * 2);
  const scale = Math.max(1, Math.floor(usable / Math.max(glyphW, glyphH)));
  const offX = Math.floor((size - glyphW * scale) / 2);
  const offY = Math.floor((size - glyphH * scale) / 2);

  const raw = Buffer.alloc(size * (1 + size * 3)); // filter byte + RGB per row
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const gx = Math.floor((x - offX) / scale);
      const gy = Math.floor((y - offY) / scale);
      const isGlyph =
        gx >= 0 && gx < glyphW && gy >= 0 && gy < glyphH && GLYPH_R[gy][gx] === "1";
      const color = isGlyph ? WHITE : BRAND;
      const px = rowStart + 1 + x * 3;
      raw[px] = color[0];
      raw[px + 1] = color[1];
      raw[px + 2] = color[2];
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", renderPng(192, 0.15));
writeFileSync("public/icons/icon-512.png", renderPng(512, 0.15));
writeFileSync("public/icons/icon-maskable-512.png", renderPng(512, 0.3));
writeFileSync("public/icons/apple-touch-icon.png", renderPng(180, 0.15));
console.log("Generated placeholder PWA icons in public/icons/");
