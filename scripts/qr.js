// Zero-dep QR (byte mode, versions 1-10, ECC-L) → SVG. Enough for a LAN URL.
const fs = require('fs'), os = require('os');
const port = process.env.PORT || 3000;
const lan = Object.values(os.networkInterfaces()).flat().find(n => n && n.family === 'IPv4' && !n.internal);
const url = process.argv[2] || `http://${lan ? lan.address : 'localhost'}:${port}`;

// --- minimal QR encoder ---
function qr(text) {
  const data = [...Buffer.from(text, 'utf8')];
  // pick smallest version (ECC-L) that fits byte mode
  const CAP_L = [0,17,32,53,78,106,134,154,192,230,271]; // v1..v10 byte capacity, ECC-L
  let ver = 1; while (ver < 10 && data.length > CAP_L[ver]) ver++;
  const size = 17 + ver * 4;
  // ECC codeword counts (L): total codewords and ec per block for v1..v10, 1 block (v<=5) simplified
  const ECC = {1:[19,7],2:[34,10],3:[55,15],4:[80,20],5:[108,26],6:[136,18],7:[156,20],8:[194,24],9:[232,30],10:[274,18]};
  const [totalCW, ecCW] = ECC[ver]; const dataCW = totalCW - ecCW;
  // build bit stream: mode(0100) + length(8 bits v<=9) + data + terminator
  let bits = '0100' + data.length.toString(2).padStart(8, '0');
  for (const b of data) bits += b.toString(2).padStart(8, '0');
  bits += '0000'; bits = bits.slice(0, dataCW * 8);
  while (bits.length % 8) bits += '0';
  let bytes = bits.match(/.{8}/g).map(b => parseInt(b, 2));
  const pad = [0xEC, 0x11]; let pi = 0;
  while (bytes.length < dataCW) bytes.push(pad[pi++ % 2]);
  // Reed-Solomon
  const exp = new Array(512), log = new Array(256); let x = 1;
  for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a, b) => (a && b) ? exp[log[a] + log[b]] : 0;
  let gen = [1];
  for (let i = 0; i < ecCW; i++) { const ng = new Array(gen.length + 1).fill(0); for (let j = 0; j < gen.length; j++) { ng[j] ^= mul(gen[j], exp[i]); ng[j + 1] ^= gen[j]; } gen = ng; }
  const msg = bytes.concat(new Array(ecCW).fill(0));
  for (let i = 0; i < dataCW; i++) { const c = msg[i]; if (c) for (let j = 0; j < gen.length; j++) msg[i + j] ^= mul(gen[j], c); }
  const ecc = msg.slice(dataCW);
  const all = bytes.concat(ecc);
  let allBits = ''; for (const b of all) allBits += b.toString(2).padStart(8, '0');

  // matrix
  const m = Array.from({ length: size }, () => new Array(size).fill(null));
  const rsv = Array.from({ length: size }, () => new Array(size).fill(false));
  function finder(r, c) { for (let i = -1; i <= 7; i++) for (let j = -1; j <= 7; j++) { const rr = r + i, cc = c + j; if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue; const on = (i >= 0 && i <= 6 && (j === 0 || j === 6)) || (j >= 0 && j <= 6 && (i === 0 || i === 6)) || (i >= 2 && i <= 4 && j >= 2 && j <= 4); m[rr][cc] = on ? 1 : 0; rsv[rr][cc] = true; } }
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  // timing
  for (let i = 8; i < size - 8; i++) { m[6][i] = m[6][i] === null ? (i % 2 === 0 ? 1 : 0) : m[6][i]; rsv[6][i] = true; m[i][6] = i % 2 === 0 ? 1 : 0; rsv[i][6] = true; }
  // alignment (v2+): single center pattern
  const AL = {2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50]};
  if (ver >= 2) { const pos = AL[ver]; for (const pr of pos) for (const pc of pos) { if (rsv[pr][pc]) continue; for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const on = Math.max(Math.abs(i), Math.abs(j)) !== 1; m[pr + i][pc + j] = on ? 1 : 0; rsv[pr + i][pc + j] = true; } } }
  // dark module + format reserve
  m[size - 8][8] = 1; rsv[size - 8][8] = true;
  for (let i = 0; i < 9; i++) { if (!rsv[8][i]) rsv[8][i] = true; if (!rsv[i][8]) rsv[i][8] = true; }
  for (let i = 0; i < 8; i++) { rsv[8][size - 1 - i] = true; rsv[size - 1 - i][8] = true; }

  // place data with mask 0 ((r+c)%2==0)
  let bi = 0;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let t = 0; t < size; t++) {
      const row = ((size - 1 - col) & 2) ? t : size - 1 - t; // zigzag by column pair
      for (const c of [col, col - 1]) {
        if (rsv[row][c]) continue;
        let bit = bi < allBits.length ? +allBits[bi] : 0; bi++;
        if ((row + c) % 2 === 0) bit ^= 1; // mask 0
        m[row][c] = bit;
      }
    }
  }
  // format info for ECC-L + mask 0 = bits 111011111000100
  const fmt = '111011111000100';
  for (let i = 0; i < 15; i++) {
    const b = +fmt[i];
    // around top-left
    if (i < 6) m[8][i] = b; else if (i === 6) m[8][7] = b; else if (i === 7) m[8][8] = b; else if (i === 8) m[7][8] = b; else m[14 - i][8] = b;
    if (i < 8) m[size - 1 - i][8] = b; else m[8][size - 15 + i] = b;
  }
  return m;
}
const m = qr(url), n = m.length, q = 4, scale = 8, dim = (n + q * 2) * scale;
let rects = '';
for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (m[r][c]) rects += `<rect x="${(c + q) * scale}" y="${(r + q) * scale}" width="${scale}" height="${scale}"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim}" height="${dim}" viewBox="0 0 ${dim} ${dim}"><rect width="${dim}" height="${dim}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
fs.writeFileSync(__dirname + '/../demo/qr.svg', svg);
fs.writeFileSync(__dirname + '/../public/qr.svg', svg);
console.log('QR → demo/qr.svg  for', url);
