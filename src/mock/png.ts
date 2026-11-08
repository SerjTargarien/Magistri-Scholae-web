// A tiny PNG encoder for the demo's generated images (R3.3): a diagonal
// two-colour gradient. Pure TypeScript with uncompressed deflate
// blocks, so it runs in the browser and in tests without dependencies.

type RGB = readonly [number, number, number];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1, b = 0;
  for (const byte of bytes) { a = (a + byte) % 65521; b = (b + a) % 65521; }
  return ((b << 16) | a) >>> 0;
}

const u32 = (n: number) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];

function chunk(type: string, data: Uint8Array): number[] {
  const body = new Uint8Array(4 + data.length);
  for (let i = 0; i < 4; i++) body[i] = type.charCodeAt(i);
  body.set(data, 4);
  const out = u32(data.length);
  for (const byte of body) out.push(byte);
  out.push(...u32(crc32(body)));
  return out;
}

/** zlib stream made of stored (uncompressed) deflate blocks. */
function zlibStored(raw: Uint8Array): Uint8Array {
  const out: number[] = [0x78, 0x01];
  let offset = 0;
  do {
    const block = raw.subarray(offset, offset + 65535);
    offset += 65535;
    out.push(offset >= raw.length ? 1 : 0, block.length & 255, block.length >>> 8, ~block.length & 255, (~block.length >>> 8) & 255);
    for (const byte of block) out.push(byte);
  } while (offset < raw.length);
  out.push(...u32(adler32(raw)));
  return new Uint8Array(out);
}

export function gradientPng(width: number, height: number, from: RGB, to: RGB): string {
  const raw = new Uint8Array(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    for (let x = 0; x < width; x++) {
      const k = (x / width + y / height) / 2;
      for (let c = 0; c < 3; c++) raw[row + 1 + x * 3 + c] = Math.round(from[c] + (to[c] - from[c]) * k);
    }
  }
  const header = new Uint8Array([...u32(width), ...u32(height), 8, 2, 0, 0, 0]);
  const bytes: number[] = [137, 80, 78, 71, 13, 10, 26, 10];
  for (const part of [chunk("IHDR", header), chunk("IDAT", zlibStored(raw)), chunk("IEND", new Uint8Array())]) for (const byte of part) bytes.push(byte);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:image/png;base64,${btoa(binary)}`;
}
