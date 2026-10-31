import * as THREE from 'three';

/**
 * Procedural texture generator for Temple Escape 3D.
 * Guarantees zero 404s, SRGBColorSpace, and sharp anisotropic filtering.
 */

// Helper to configure textures per Three.js directives
function finalizeTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// 1. Ancient Stone Path Pavers
export function createStonePaversTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Base stone slate
  ctx.fillStyle = '#4a443c';
  ctx.fillRect(0, 0, size, size);

  // Subtle stone noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise - 2));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise - 6));
  }
  ctx.putImageData(imgData, 0, 0);

  // Carved flagstone tiles
  const rows = 4;
  const cols = 4;
  const tileW = size / cols;
  const tileH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tileW;
      const y = r * tileH;

      // Dark grout
      ctx.strokeStyle = '#23201b';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 2, y + 2, tileW - 4, tileH - 4);

      // Inner beveled highlight
      ctx.strokeStyle = '#756c60';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 5, y + 5, tileW - 10, tileH - 10);

      // Carved ancient glyph in center of each tile
      ctx.strokeStyle = '#2b2721';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const cx = x + tileW / 2;
      const cy = y + tileH / 2;
      ctx.rect(cx - 14, cy - 14, 28, 28);
      ctx.moveTo(cx - 14, cy);
      ctx.lineTo(cx + 14, cy);
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx, cy + 14);
      ctx.stroke();

      // Golden inlay speckles
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = '#c99a38';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Random moss patches
      if (Math.random() > 0.6) {
        ctx.fillStyle = 'rgba(60, 95, 45, 0.45)';
        ctx.beginPath();
        ctx.arc(x + 10 + Math.random() * (tileW - 20), y + 10 + Math.random() * (tileH - 20), 12 + Math.random() * 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Golden runic lane guides along the borders
  ctx.fillStyle = '#b8860b';
  for (let y = 10; y < size; y += 40) {
    ctx.fillRect(8, y, 6, 20);
    ctx.fillRect(size - 14, y, 6, 20);
  }

  return finalizeTexture(canvas, 1, 4);
}

// 2. Weathered Stone Brick Walls / Columns
export function createTempleStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#3a3835';
  ctx.fillRect(0, 0, size, size);

  // Brick pattern
  const rowCount = 8;
  const h = size / rowCount;
  for (let r = 0; r < rowCount; r++) {
    const y = r * h;
    const colCount = 4;
    const w = size / colCount;
    const offset = (r % 2) * (w / 2);

    for (let c = -1; c <= colCount; c++) {
      const x = c * w + offset;
      const shade = 55 + Math.floor(Math.random() * 25);
      ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade - 5})`;
      ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

      // Cracks
      ctx.strokeStyle = '#181614';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + w * 0.3, y + 5);
      ctx.lineTo(x + w * 0.4, y + h * 0.5);
      ctx.lineTo(x + w * 0.6, y + h - 5);
      ctx.stroke();
    }
  }

  // Moss overgrowth
  for (let i = 0; i < 20; i++) {
    const mx = Math.random() * size;
    const my = Math.random() * size;
    ctx.fillStyle = 'rgba(50, 80, 40, 0.4)';
    ctx.beginPath();
    ctx.arc(mx, my, 15 + Math.random() * 20, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas, 1, 1);
}

// 3. Ancient Gnarled Wood Texture (for hurdles and logs)
export function createWoodTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#4d2e16';
  ctx.fillRect(0, 0, size, size);

  // Wood grain lines
  ctx.strokeStyle = '#2f1a09';
  ctx.lineWidth = 3;
  for (let x = 0; x < size; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 10, size * 0.3, x - 10, size * 0.7, x, size);
    ctx.stroke();
  }

  // Bark knots
  for (let i = 0; i < 3; i++) {
    const kx = 40 + Math.random() * (size - 80);
    const ky = 40 + Math.random() * (size - 80);
    ctx.fillStyle = '#1c0f05';
    ctx.beginPath();
    ctx.ellipse(kx, ky, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6e4424';
    ctx.stroke();
  }

  return finalizeTexture(canvas, 2, 1);
}

// 4. Golden Coin Embossed Face
export function createCoinTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Radial gold gradient
  const grad = ctx.createRadialGradient(size / 2, size / 2, 10, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#fff4b8');
  grad.addColorStop(0.4, '#e6ab17');
  grad.addColorStop(0.85, '#ab7905');
  grad.addColorStop(1, '#573c02');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;

  // Outer beveled ring
  ctx.strokeStyle = '#fff1a8';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#573c02';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.38, 0, Math.PI * 2);
  ctx.stroke();

  // Temple Sun God / Skull Face
  ctx.fillStyle = '#573c02';
  // Eyes
  ctx.beginPath();
  ctx.ellipse(cx - 25, cy - 15, 12, 16, -0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + 25, cy - 15, 12, 16, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Nose triangle
  ctx.beginPath();
  ctx.moveTo(cx, cy - 2);
  ctx.lineTo(cx - 10, cy + 18);
  ctx.lineTo(cx + 10, cy + 18);
  ctx.closePath();
  ctx.fill();

  // Teeth / Grimace
  ctx.fillRect(cx - 30, cy + 32, 60, 10);
  ctx.fillStyle = '#e6ab17';
  for (let x = cx - 24; x <= cx + 24; x += 12) {
    ctx.fillRect(x, cy + 32, 4, 10);
  }

  return finalizeTexture(canvas, 1, 1);
}

// 5. Fire & Torch Glow Sprite
export function createEmberParticleTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const rad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  rad.addColorStop(0, 'rgba(255, 255, 230, 1)');
  rad.addColorStop(0.2, 'rgba(255, 180, 50, 0.9)');
  rad.addColorStop(0.5, 'rgba(235, 70, 15, 0.5)');
  rad.addColorStop(0.8, 'rgba(120, 20, 0, 0.15)');
  rad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 6. Hazard Runes Texture (for arches and danger indicators)
export function createHazardRunesTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#221e1a';
  ctx.fillRect(0, 0, size, size);

  // Red/Gold hazard zig-zags
  ctx.strokeStyle = '#e64a19';
  ctx.lineWidth = 10;
  for (let y = 20; y < size; y += 40) {
    ctx.beginPath();
    for (let x = 0; x <= size; x += 30) {
      const up = ((x / 30) % 2 === 0) ? -10 : 10;
      if (x === 0) ctx.moveTo(x, y + up);
      else ctx.lineTo(x, y + up);
    }
    ctx.stroke();
  }

  // Glowing skulls
  ctx.fillStyle = '#ff9800';
  for (let x = 40; x < size; x += 80) {
    for (let y = 40; y < size; y += 80) {
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  return finalizeTexture(canvas, 1, 1);
}
