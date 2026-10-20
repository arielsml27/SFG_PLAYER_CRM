// Browser-only. Club headshots usually sit on a plain white studio background,
// which shows as a white box on the dark proposal sheet. This cuts away the
// near-white area connected to the top and side edges, removes the light
// fringe, and fades the bottom and sides so a photo cut at the shoulders
// dissolves into the page. Returns a PNG data URL, or null when the photo has
// no white background (it is then shown as is).

const MAX_SIDE = 900;
const MIN_SIDE = 600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export async function cutoutPortrait(src: string): Promise<string | null> {
  const img = await loadImage(src);
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (!longest) return null;
  const scale = longest > MAX_SIDE ? MAX_SIDE / longest : longest < MIN_SIDE ? MIN_SIDE / longest : 1;
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  const at = (x: number, y: number) => (y * w + x) * 4;
  const isWhiteCorner = (x: number, y: number) => {
    const i = at(x, y);
    return Math.min(px[i], px[i + 1], px[i + 2]) > 235;
  };
  if (!isWhiteCorner(1, 1) || !isWhiteCorner(w - 2, 1)) return null;

  // near-white pixels connected to the top, left or right edge = background
  const nearWhite = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const r = px[p * 4], g = px[p * 4 + 1], b = px[p * 4 + 2];
    const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
    nearWhite[p] = lo > 222 && hi - lo < 28 ? 1 : 0;
  }
  const bg = new Uint8Array(w * h);
  const stack: number[] = [];
  const seed = (p: number) => {
    if (nearWhite[p] && !bg[p]) {
      bg[p] = 1;
      stack.push(p);
    }
  };
  for (let x = 0; x < w; x++) seed(x);
  for (let y = 0; y < h; y++) {
    seed(y * w);
    seed(y * w + w - 1);
  }
  while (stack.length) {
    const p = stack.pop()!;
    const x = p % w, y = (p / w) | 0;
    if (x > 0) seed(p - 1);
    if (x < w - 1) seed(p + 1);
    if (y > 0) seed(p - w);
    if (y < h - 1) seed(p + w);
  }

  // grow the background by 2px to eat the light fringe around hair and shirt
  let grown = bg;
  for (let pass = 0; pass < 2; pass++) {
    const next = grown.slice();
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        if (grown[p]) continue;
        if ((x > 0 && grown[p - 1]) || (x < w - 1 && grown[p + 1]) || (y > 0 && grown[p - w]) || (y < h - 1 && grown[p + w])) next[p] = 1;
      }
    grown = next;
  }

  // soft edge: 3x3 box blur of the alpha, then the bottom/side fade
  const alpha = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) alpha[p] = grown[p] ? 0 : 1;
  const soft = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let sum = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          sum += alpha[yy * w + xx];
          n++;
        }
      soft[y * w + x] = sum / n;
    }
  for (let y = 0; y < h; y++) {
    const fy = Math.min(1, Math.max(0, (1 - y / (h - 1)) / 0.26));
    for (let x = 0; x < w; x++) {
      const u = x / (w - 1);
      const fx = Math.min(1, Math.max(0, Math.min(u, 1 - u) / 0.1));
      px[at(x, y) + 3] = Math.round(255 * soft[y * w + x] * fy * fx);
    }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL("image/png");
}
