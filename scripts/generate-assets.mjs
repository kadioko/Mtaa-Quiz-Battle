import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

const crc32 = (buffer) => {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const name = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
};

const png = (width, height, pixels) => {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const hex = (value) => value.match(/\w\w/g).map((part) => parseInt(part, 16));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const set = (pixels, width, height, x, y, color) => {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const i = (Math.floor(y) * width + Math.floor(x)) * 4;
  pixels[i] = color[0];
  pixels[i + 1] = color[1];
  pixels[i + 2] = color[2];
  pixels[i + 3] = color[3] ?? 255;
};
const rect = (pixels, width, height, x, y, w, h, color) => {
  for (let yy = Math.max(0, y); yy < Math.min(height, y + h); yy += 1) {
    for (let xx = Math.max(0, x); xx < Math.min(width, x + w); xx += 1) set(pixels, width, height, xx, yy, color);
  }
};
const circle = (pixels, width, height, cx, cy, r, color) => {
  const r2 = r * r;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) {
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) set(pixels, width, height, x, y, color);
    }
  }
};
const line = (pixels, width, height, x1, y1, x2, y2, thickness, color) => {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    circle(pixels, width, height, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, thickness / 2, color);
  }
};

const drawMark = (pixels, width, height, scale = 1, ox = 0, oy = 0) => {
  const s = scale;
  const gold = [245, 166, 35, 255];
  const green = [29, 185, 84, 255];
  const white = [255, 255, 255, 255];
  const black = [10, 14, 28, 255];
  circle(pixels, width, height, ox + 512 * s, oy + 512 * s, 304 * s, gold);
  circle(pixels, width, height, ox + 512 * s, oy + 512 * s, 252 * s, black);
  line(pixels, width, height, ox + 282 * s, oy + 720 * s, ox + 738 * s, oy + 304 * s, 64 * s, green);
  line(pixels, width, height, ox + 302 * s, oy + 758 * s, ox + 776 * s, oy + 326 * s, 24 * s, gold);
  rect(pixels, width, height, ox + 320 * s, oy + 340 * s, 96 * s, 340 * s, white);
  rect(pixels, width, height, ox + 608 * s, oy + 340 * s, 96 * s, 340 * s, white);
  line(pixels, width, height, ox + 360 * s, oy + 354 * s, ox + 512 * s, oy + 540 * s, 74 * s, white);
  line(pixels, width, height, ox + 664 * s, oy + 354 * s, ox + 512 * s, oy + 540 * s, 74 * s, white);
  circle(pixels, width, height, ox + 512 * s, oy + 694 * s, 34 * s, gold);
};

const makeCanvas = (width, height) => {
  const pixels = Buffer.alloc(width * height * 4);
  const top = hex('0F0F23');
  const bottom = hex('1A1A35');
  for (let y = 0; y < height; y += 1) {
    const color = mix(top, bottom, y / Math.max(1, height - 1));
    for (let x = 0; x < width; x += 1) set(pixels, width, height, x, y, [...color, 255]);
  }
  return pixels;
};

const saveIcon = (path, size) => {
  const pixels = makeCanvas(size, size);
  drawMark(pixels, size, size, size / 1024, 0, 0);
  writeFileSync(path, png(size, size, pixels));
};

const saveSplash = () => {
  const width = 1242;
  const height = 2436;
  const pixels = makeCanvas(width, height);
  drawMark(pixels, width, height, 0.72, 254, 610);
  rect(pixels, width, height, 356, 1450, 530, 22, [245, 166, 35, 255]);
  rect(pixels, width, height, 424, 1510, 394, 16, [29, 185, 84, 255]);
  writeFileSync('assets/splash.png', png(width, height, pixels));
};

saveIcon('assets/icon.png', 1024);
saveIcon('assets/adaptive-icon.png', 1024);
saveIcon('assets/favicon.png', 196);
saveSplash();

console.log('Generated production PNG assets.');
