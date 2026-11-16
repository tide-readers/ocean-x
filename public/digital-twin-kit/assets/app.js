// Digital twin kit, v1 step 1: page shell and static model.
// Three.js r170, vendored in assets/vendor/three (MIT, see LICENSE there).
// The model is built from primitives. Each module is its own Group so later
// steps can lift, pull apart and swap them.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------------------------------------------------------------------------
// Text from the deck "OceanX KAI Kit Orientation" (Modules and Camera slides).
// Used by the label panel in step 2. Do not reword.
// ---------------------------------------------------------------------------
export const LABELS = {
  notes:  { name: 'Notes',  line: 'Write and draw what you learn.' },
  chat:   { name: 'Chat',   line: 'Video calls with Kai on the ship.' },
  map:    { name: 'Map',    line: "Your class's patch of ocean." },
  sound:  { name: 'Sound',  line: 'Live sound from the deep.' },
  camera: { name: 'Camera', line: 'It only wakes up for the ocean.' },
};

// ---------------------------------------------------------------------------
// Colors sampled from the reference renders, plus the deck palette.
// ---------------------------------------------------------------------------
const C = {
  cream:      0xE9E1D4,
  creamDark:  0xD9CFC0,
  orange:     0xEF7A1F,
  orangeDeep: 0xD9682B,
  ink:        0x1B1C1A,
  screen:     0x101210,
  silver:     0xC9CACC,
  steel:      0x8E9094,
  grey:       0x8A8C90,
  greyDark:   0x5F6165,
  yellow:     0xF4B800,
  blue:       0x1E7BE8,
  skyBlue:    0x86CBEA,
  green:      0x3E9B4F,
  greenDark:  0x2E7A3C,
  white:      0xF4F2EE,
  strap:      0xF07A1A,
  aqua:       0x9FE6D2,
  gold:       0xD9A83A,
};

const DEVICE = { w: 1.30, h: 1.28, d: 0.32 }; // 130 x 128 x 32 mm, ratios only
const GAP = 0.02;
const MOD = { w: (DEVICE.w - GAP) / 2, h: (DEVICE.h - GAP) / 2, d: DEVICE.d };
const SLOT_X = (MOD.w + GAP) / 2;
const SLOT_Y = (MOD.h + GAP) / 2;
const FRONT = MOD.d / 2;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
}
const M = {
  cream:  mat(C.cream, { roughness: 0.55 }),
  creamDark: mat(C.creamDark, { roughness: 0.6 }),
  orange: mat(C.orange, { roughness: 0.5 }),
  ink:    mat(C.ink, { roughness: 0.7 }),
  bezel:  mat(C.ink, { roughness: 0.4 }),
  silver: mat(C.silver, { roughness: 0.35, metalness: 0.85 }),
  steel:  mat(C.steel, { roughness: 0.45, metalness: 0.7 }),
  grey:   mat(C.grey, { roughness: 0.6 }),
  greyDark: mat(C.greyDark, { roughness: 0.6 }),
  yellow: mat(C.yellow, { roughness: 0.45 }),
  blue:   mat(C.blue, { roughness: 0.4 }),
  skyBlue: mat(C.skyBlue, { roughness: 0.4 }),
  green:  mat(C.green, { roughness: 0.5 }),
  greenDark: mat(C.greenDark, { roughness: 0.5 }),
  white:  mat(C.white, { roughness: 0.4 }),
  strap:  mat(C.strap, { roughness: 0.9 }),
  glass:  mat(0x0B1A2E, { roughness: 0.1, metalness: 0.2 }),
};

function roundedBox(w, h, d, r = 0.03, seg = 3) {
  return new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
}

function box(w, h, d, material, r) {
  return new THREE.Mesh(roundedBox(w, h, d, r), material);
}

function cylinder(r, h, material, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
  m.rotation.x = Math.PI / 2; // axis along z, facing the viewer
  return m;
}

function at(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// A screen: dark bezel plus a lit plane with a canvas texture.
// The plane's material is stored on the group so step 2 can light it up.
function screen(w, h, texture, bezel = 0.025) {
  const g = new THREE.Group();
  g.add(at(box(w + bezel * 2, h + bezel * 2, 0.02, M.bezel, 0.02), 0, 0, FRONT - 0.002));
  const material = new THREE.MeshStandardMaterial({
    map: texture, emissiveMap: texture, emissive: 0xffffff, emissiveIntensity: 0.55,
    roughness: 0.25, metalness: 0,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  plane.position.z = FRONT + 0.0085;
  g.add(plane);
  g.userData.screenMaterial = material;
  return g;
}

function screws(group, w, h, inset = 0.045, z = FRONT) {
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const head = cylinder(0.017, 0.008, M.silver, 20);
    at(head, sx * (w / 2 - inset), sy * (h / 2 - inset), z + 0.003);
    // Head is rotated to face +z, so its local y points at the viewer.
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.003, 0.004), M.ink);
    slot.position.y = 0.0045;
    slot.rotation.y = 0.6 * sx * sy;
    head.add(slot);
    group.add(head);
  }
}

// Flat decal plane (transparent canvas texture) on the front face.
function decal(w, h, texture, z = FRONT + 0.0015) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: texture, transparent: true, alphaTest: 0.1, roughness: 0.7 })
  );
  m.position.z = z;
  return m;
}

// ---------------------------------------------------------------------------
// Canvas textures for the screens and marks
// ---------------------------------------------------------------------------
const TEX = {};

// Notes screen. Content follows kit-reference.jpg (code-style notes).
TEX.notes = canvasTexture(512, 464, (ctx, w, h) => {
  ctx.fillStyle = '#141614';
  ctx.fillRect(0, 0, w, h);
  const lines = [
    [['c', '// sea turtle notes']],
    [['k', 'const '], ['p', 'turtle = {']],
    [['p', '  habitat: '], ['s', '"ocean"'], ['p', ',']],
    [['p', '  diet: '], ['s', '"seagrass"'], ['p', ',']],
    [['p', '  lifespan: '], ['n', '80'], ['p', ',']],
    [['p', '};']],
    [],
    [['c', '// reminder']],
    [['k', 'if '], ['p', '(conservation) {']],
    [['p', '  observe();']],
    [['p', '  protect();']],
    [['p', '}']],
  ];
  const colors = { c: '#7c8c7e', k: '#e8873a', p: '#e9dfd8', s: '#9fe6d2', n: '#f2c14e' };
  ctx.font = '22px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';
  lines.forEach((parts, i) => {
    const y = 26 + i * 34;
    ctx.fillStyle = '#4e5652';
    ctx.textAlign = 'right';
    ctx.fillText(String(i + 1), 44, y);
    ctx.textAlign = 'left';
    let x = 64;
    for (const [kind, text] of parts) {
      ctx.fillStyle = colors[kind];
      ctx.fillText(text, x, y);
      x += ctx.measureText(text).width;
    }
  });
});

// Chat screen. Kai's face area, drawn as a soft video-call frame (no photo).
TEX.chat = canvasTexture(512, 352, (ctx, w, h) => {
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#2b3a44');
  bg.addColorStop(1, '#16222a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // warm window light behind Kai
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 20, w * 0.5, h * 0.42, 260);
  glow.addColorStop(0, 'rgba(233, 223, 216, 0.35)');
  glow.addColorStop(1, 'rgba(233, 223, 216, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  // shoulders and head, as a quiet silhouette in paper tone
  ctx.fillStyle = '#d9cfc2';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 1.02, 190, 150, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e9dfd8';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.42, 78, 96, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#131312';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.27, 84, 52, 0, Math.PI, 0);
  ctx.fill();
  // smile
  ctx.strokeStyle = '#131312';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.5, 26, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  ctx.fillStyle = '#131312';
  for (const dx of [-26, 26]) {
    ctx.beginPath();
    ctx.arc(w * 0.5 + dx, h * 0.4, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  // live dot
  ctx.fillStyle = '#e8873a';
  ctx.beginPath();
  ctx.arc(w - 28, 28, 8, 0, Math.PI * 2);
  ctx.fill();
});

// Map screen. Gold contour map with a turtle, following kit-reference.jpg.
TEX.map = canvasTexture(512, 420, (ctx, w, h) => {
  ctx.fillStyle = '#0f120f';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(217, 168, 58, 0.18)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  // contours
  ctx.strokeStyle = '#d9a83a';
  ctx.lineWidth = 1.5;
  const cx = w * 0.62, cy = h * 0.55;
  for (let k = 1; k <= 7; k++) {
    ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.08) {
      const r = k * 42 + 14 * Math.sin(a * 3 + k) + 9 * Math.cos(a * 5 - k * 0.7);
      const x = cx + Math.cos(a) * r * 1.25;
      const y = cy + Math.sin(a) * r * 0.85;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // turtle outline
  ctx.save();
  ctx.translate(w * 0.42, h * 0.52);
  ctx.rotate(-0.35);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#e6b94a';
  ctx.fillStyle = 'rgba(15, 18, 15, 0.9)';
  const flipper = (x, y, rot) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.ellipse(0, 0, 42, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  };
  flipper(-62, -40, -0.7); flipper(62, -40, 0.7); flipper(-58, 44, 0.9); flipper(58, 44, -0.9);
  ctx.beginPath(); ctx.ellipse(0, 72, 10, 16, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // tail
  ctx.beginPath(); ctx.ellipse(0, -88, 22, 28, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // head
  ctx.beginPath(); ctx.ellipse(0, 0, 70, 66, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // shell
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 42, 0, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 46, Math.sin(a) * 42);
    ctx.lineTo(Math.cos(a) * 70, Math.sin(a) * 66);
    ctx.stroke();
  }
  ctx.restore();
  // readouts, approximated from the render
  ctx.fillStyle = '#e6b94a';
  ctx.font = '16px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';
  ['LAT 16.71° N', 'LON 60.01° W', 'DEP 0.57 m'].forEach((t, i) => ctx.fillText(t, 18, 16 + i * 22));
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < 3 ? '#e6b94a' : 'rgba(230, 185, 74, 0.3)';
    ctx.fillRect(18 + i * 18, h - 30, 13, 13);
  }
});

// Sound module speaker grille: dark disc with cream slot bars.
TEX.grille = canvasTexture(256, 256, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#1b1c1a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#e9e1d4';
  for (let y = 18; y < h; y += 22) {
    roundRect(ctx, 10, y, w - 20, 10, 5); ctx.fill();
  }
  ctx.restore();
});

// Knurled dial: vertical stripes wrapped around the cylinder.
TEX.knurl = canvasTexture(256, 32, (ctx, w, h) => {
  for (let x = 0; x < w; x += 8) {
    ctx.fillStyle = (x / 8) % 2 ? '#d7d8da' : '#8d8f93';
    ctx.fillRect(x, 0, 8, h);
  }
});
TEX.knurl.wrapS = THREE.RepeatWrapping;
TEX.knurl.repeat.set(3, 1);

function arrowTexture(dir) {
  return canvasTexture(96, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#131312';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const s = dir === 'up' ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(w / 2, h / 2 + 30 * s);
    ctx.lineTo(w / 2, h / 2 - 30 * s);
    ctx.moveTo(w / 2 - 22, h / 2 - 8 * s);
    ctx.lineTo(w / 2, h / 2 - 30 * s);
    ctx.lineTo(w / 2 + 22, h / 2 - 8 * s);
    ctx.stroke();
  });
}
TEX.arrowUp = arrowTexture('up');
TEX.arrowDown = arrowTexture('down');

TEX.rocker = canvasTexture(128, 128, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = '#131312';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const arrow = (cy, s) => {
    ctx.beginPath();
    ctx.moveTo(w / 2, cy + 20 * s);
    ctx.lineTo(w / 2, cy - 20 * s);
    ctx.moveTo(w / 2 - 14, cy - 6 * s);
    ctx.lineTo(w / 2, cy - 20 * s);
    ctx.lineTo(w / 2 + 14, cy - 6 * s);
    ctx.stroke();
  };
  arrow(h * 0.3, 1);
  arrow(h * 0.72, -1);
});

// "OCEANX" mark and headphone icon at the bottom of the Sound module.
TEX.soundMark = canvasTexture(512, 96, (ctx, w, h) => {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1f5fe0';
  ctx.font = '700 46px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('OCEANX', 36, h / 2 + 2);
  ctx.strokeStyle = '#131312';
  ctx.fillStyle = '#131312';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  const cx = w - 70, cy = h / 2 + 8;
  ctx.beginPath(); ctx.arc(cx, cy, 24, Math.PI, 0); ctx.stroke();
  roundRect(ctx, cx - 32, cy - 4, 14, 24, 5); ctx.fill();
  roundRect(ctx, cx + 18, cy - 4, 14, 24, 5); ctx.fill();
});

// Camera module speaker: dot grid.
TEX.dots = canvasTexture(256, 256, (ctx, w, h) => {
  ctx.fillStyle = '#9a9c9f';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2a2b2d';
  for (let y = 14; y < h; y += 18) for (let x = 14; x < w; x += 18) {
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  }
});

// Soft contact shadow.
TEX.shadow = canvasTexture(256, 256, (ctx, w, h) => {
  const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
  g.addColorStop(0.55, 'rgba(0, 0, 0, 0.14)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
});

// ---------------------------------------------------------------------------
// Modules
// ---------------------------------------------------------------------------
function housing(material) {
  const g = new THREE.Group();
  g.add(box(MOD.w, MOD.h, MOD.d, material, 0.04));
  screws(g, MOD.w, MOD.h);
  return g;
}

function notesModule() {
  const g = housing(M.cream);
  g.name = 'notes';
  g.add(screen(0.44, 0.40, TEX.notes));
  g.add(at(decal(0.07, 0.07, TEX.arrowUp), 0, 0.265, FRONT + 0.0015));
  g.add(at(decal(0.07, 0.07, TEX.arrowDown), 0, -0.265, FRONT + 0.0015));

  // Stylus clipped to the left side: silver body, yellow cap and clip.
  const stylus = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.46, 20), M.silver);
  stylus.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.023, 0.023, 0.12, 20), M.yellow);
  cap.position.y = 0.27;
  stylus.add(cap);
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.023, 16, 12), M.yellow);
  capTop.position.y = 0.33;
  stylus.add(capTop);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 20), M.steel);
  tip.rotation.x = Math.PI;
  tip.position.y = -0.255;
  stylus.add(tip);
  const clip = box(0.012, 0.11, 0.03, M.yellow, 0.005);
  clip.position.set(0.028, 0.2, 0);
  stylus.add(clip);
  stylus.position.set(-MOD.w / 2 - 0.028, 0.03, 0.08);
  g.add(stylus);
  return g;
}

function chatModule() {
  const g = housing(M.cream);
  g.name = 'chat';
  g.add(at(screen(0.46, 0.30, TEX.chat), 0, 0.12, 0));

  // Control strip: blue square button, up/down rocker, yellow ring with a knurled dial.
  const stripY = -0.19;
  g.add(at(box(0.13, 0.13, 0.035, M.blue, 0.02), -0.19, stripY, FRONT + 0.012));
  g.add(at(box(0.15, 0.14, 0.03, M.cream, 0.015), 0, stripY, FRONT + 0.01));
  g.add(at(decal(0.1, 0.1, TEX.rocker), 0, stripY, FRONT + 0.0265));
  const ring = cylinder(0.08, 0.03, M.yellow, 40);
  at(ring, 0.195, stripY, FRONT + 0.012);
  g.add(ring);
  const dial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.05, 40),
    [new THREE.MeshStandardMaterial({ map: TEX.knurl, roughness: 0.35, metalness: 0.7 }), M.silver, M.silver]
  );
  dial.rotation.x = Math.PI / 2;
  at(dial, 0.195, stripY, FRONT + 0.03);
  g.add(dial);

  // Side details on the device's right edge: green lever and a vent grille.
  const lever = box(0.035, 0.48, 0.06, M.green, 0.017);
  lever.position.set(MOD.w / 2 + 0.012, -0.12, 0.02);
  g.add(lever);
  for (const dy of [-0.19, 0.19]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.04, 16), M.silver);
    pin.rotation.z = Math.PI / 2;
    pin.position.set(MOD.w / 2 + 0.025, -0.12 + dy, 0.02);
    g.add(pin);
  }
  for (let i = 0; i < 4; i++) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.16), M.ink);
    slot.position.set(MOD.w / 2 + 0.002, 0.27 - i * 0.03, 0);
    g.add(slot);
  }
  return g;
}

function mapModule() {
  const g = housing(M.orange);
  g.name = 'map';
  g.add(at(screen(0.46, 0.36, TEX.map), 0, 0.04, 0));
  // USB-C port on the bottom strip.
  const port = box(0.075, 0.026, 0.02, M.ink, 0.012);
  port.position.set(0, -0.265, FRONT);
  g.add(port);
  return g;
}

function soundModule() {
  const g = housing(M.cream);
  g.name = 'sound';
  // Speaker grille, slightly recessed.
  const recess = cylinder(0.145, 0.012, M.creamDark, 48);
  at(recess, -0.09, 0.06, FRONT - 0.004);
  g.add(recess);
  const grille = new THREE.Mesh(
    new THREE.CircleGeometry(0.135, 48),
    new THREE.MeshStandardMaterial({ map: TEX.grille, transparent: true, alphaTest: 0.2, roughness: 0.6 })
  );
  grille.position.set(-0.09, 0.06, FRONT + 0.003);
  g.add(grille);
  g.userData.grille = grille;

  // Four round buttons: orange, green, white, white.
  const buttonColors = [M.orange, M.green, M.white, M.white];
  buttonColors.forEach((m, i) => {
    const y = 0.2 - i * 0.12;
    const recess = cylinder(0.036, 0.01, M.creamDark, 28);
    at(recess, 0.16, y, FRONT - 0.003);
    g.add(recess);
    const b = cylinder(0.03, 0.03, m, 28);
    at(b, 0.16, y, FRONT + 0.01);
    g.add(b);
  });
  // Green vertical slider.
  g.add(at(box(0.04, 0.38, 0.03, M.green, 0.018), 0.255, 0.02, FRONT + 0.01));
  const knob = cylinder(0.016, 0.02, M.greenDark, 20);
  at(knob, 0.255, 0.14, FRONT + 0.032);
  g.add(knob);
  // "OCEANX" mark and headphone icon.
  g.add(at(decal(0.5, 0.094, TEX.soundMark), -0.02, -0.255, FRONT + 0.0015));
  return g;
}

// The whole device: four modules in their slots plus a dark spine behind the seams.
function buildDevice() {
  const device = new THREE.Group();
  device.name = 'device';
  const slots = {
    notes: [-SLOT_X,  SLOT_Y],
    chat:  [ SLOT_X,  SLOT_Y],
    map:   [-SLOT_X, -SLOT_Y],
    sound: [ SLOT_X, -SLOT_Y],
  };
  const modules = { notes: notesModule(), chat: chatModule(), map: mapModule(), sound: soundModule() };
  for (const [key, m] of Object.entries(modules)) {
    m.position.set(slots[key][0], slots[key][1], 0);
    m.userData.slot = key;
    device.add(m);
  }
  const spine = box(DEVICE.w - 0.06, DEVICE.h - 0.06, DEVICE.d - 0.06, M.ink, 0.03);
  spine.position.z = -0.005;
  device.add(spine);
  device.userData.modules = modules;
  device.userData.slots = slots;
  return device;
}

// ---------------------------------------------------------------------------
// Camera module: separate unit on an orange lanyard.
// ---------------------------------------------------------------------------
function buildCamera() {
  const g = new THREE.Group();
  g.name = 'camera';
  const W = 0.52, H = 0.74, D = 0.16, F = D / 2;

  g.add(box(W, H, D, M.grey, 0.035));
  // Yellow top band and dark bottom band.
  g.add(at(box(W, 0.13, D + 0.006, M.yellow, 0.035), 0, H / 2 - 0.065, 0));
  g.add(at(box(W, 0.11, D + 0.004, M.greyDark, 0.035), 0, -H / 2 + 0.055, 0));
  // Knobs on the bands.
  for (const [x, y] of [[-0.14, H / 2 - 0.06], [0.14, H / 2 - 0.06], [-0.12, -H / 2 + 0.055], [0.12, -H / 2 + 0.055]]) {
    const k = cylinder(0.034, 0.035, M.yellow, 24);
    at(k, x, y, F + 0.015);
    g.add(k);
    const kTop = cylinder(0.02, 0.02, M.silver, 20);
    at(kTop, x, y, F + 0.04);
    g.add(kTop);
  }
  // Faceplate.
  g.add(at(box(W - 0.06, 0.42, 0.012, M.silver, 0.015), 0, 0.03, F));
  // Speaker dots.
  const dots = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.15), new THREE.MeshStandardMaterial({ map: TEX.dots, roughness: 0.7 }));
  dots.position.set(-0.13, 0.14, F + 0.007);
  g.add(dots);
  // Lens: silver ring, dark barrel, glass.
  const lensX = 0.1, lensY = 0.13;
  g.add(at(cylinder(0.105, 0.03, M.silver, 48), lensX, lensY, F + 0.012));
  g.add(at(cylinder(0.09, 0.05, M.ink, 48), lensX, lensY, F + 0.03));
  g.add(at(cylinder(0.07, 0.01, M.glass, 48), lensX, lensY, F + 0.054));
  g.add(at(cylinder(0.03, 0.004, mat(0x27446B, { roughness: 0.1, metalness: 0.3 }), 32), lensX, lensY, F + 0.06));
  // Small controls: yellow knob, blue button, X and O marks, blue and orange sliders.
  g.add(at(box(0.08, 0.15, 0.02, M.ink, 0.03), -0.16, -0.08, F + 0.008));
  g.add(at(cylinder(0.03, 0.025, M.yellow, 24), -0.16, -0.045, F + 0.02));
  g.add(at(cylinder(0.028, 0.02, M.skyBlue, 24), -0.16, -0.115, F + 0.02));
  g.add(at(cylinder(0.018, 0.02, M.white, 24), -0.07, -0.115, F + 0.016));
  g.add(at(box(0.14, 0.05, 0.03, M.skyBlue, 0.024), 0.1, -0.05, F + 0.012));
  g.add(at(box(0.05, 0.034, 0.02, mat(0x5FAFD6, { roughness: 0.5 }), 0.012), 0.1, -0.05, F + 0.035));
  g.add(at(box(0.14, 0.05, 0.03, M.orange, 0.024), 0.1, -0.13, F + 0.012));
  g.add(at(box(0.05, 0.034, 0.02, mat(C.orangeDeep, { roughness: 0.5 }), 0.012), 0.08, -0.13, F + 0.035));
  // Orange light on the left edge. Off until it "wakes up" (step 2).
  const light = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), mat(C.orange, { roughness: 0.4, emissive: C.orange, emissiveIntensity: 0 }));
  light.position.set(-W / 2 - 0.01, 0.17, 0);
  light.scale.set(0.6, 1, 1);
  g.add(light);
  g.userData.light = light.material;
  // Lanyard lugs and strap.
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) {
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.007, 10, 20), M.silver);
    lug.position.set(x, H / 2 + 0.01, 0);
    g.add(lug);
  }
  const strap = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(-W / 2 + 0.05, H / 2 + 0.03, 0),
    new THREE.Vector3(-W / 2 - 0.08, H / 2 + 0.3, -0.04),
    new THREE.Vector3(-0.12, H / 2 + 0.52, -0.08),
    new THREE.Vector3(0.12, H / 2 + 0.52, -0.08),
    new THREE.Vector3(W / 2 + 0.08, H / 2 + 0.3, -0.04),
    new THREE.Vector3(W / 2 - 0.05, H / 2 + 0.03, 0),
  ]), 48, 0.014, 8, false), M.strap);
  g.add(strap);
  g.userData.strap = strap;
  g.userData.size = { W, H, D };
  return g;
}

function shadowPlane(w, h) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const stage = document.getElementById('stage');
const canvasEl = document.getElementById('view');

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

function showFallback() {
  document.getElementById('loading').hidden = true;
  document.getElementById('fallback').hidden = false;
  canvasEl.hidden = true;
  window.__kitReady = true; // stop the timeout from toggling again
}

let renderer;
try {
  if (!webglAvailable()) throw new Error('no webgl');
  renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (e) {
  showFallback();
}

if (renderer) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xffffff, 1);
  renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c8, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(1.5, 2.5, 3);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xfff4e8, 0.5);
  fill.position.set(-2, 0.5, 2);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  const world = new THREE.Group();
  scene.add(world);

  const device = buildDevice();
  device.rotation.x = -0.08; // lean back a touch
  world.add(device);
  const deviceShadow = shadowPlane(2.0, 0.9);
  deviceShadow.position.set(0, -DEVICE.h / 2 - 0.03, 0.05);
  world.add(deviceShadow);

  const cam = buildCamera();
  world.add(cam);
  const camShadow = shadowPlane(1.1, 0.6);
  world.add(camShadow);

  // Portrait puts the camera module below the device, landscape beside it.
  function layout(aspect) {
    if (aspect < 0.9) {
      cam.position.set(0.2, -DEVICE.h / 2 - 0.5, 0.12);
      cam.rotation.set(-0.05, -0.3, 0.1);
    } else {
      cam.position.set(DEVICE.w / 2 + 0.5, -0.1, 0.05);
      cam.rotation.set(-0.05, -0.45, 0.08);
    }
    camShadow.position.set(cam.position.x, cam.position.y - cam.userData.size.H / 2 - 0.03, cam.position.z + 0.05);
  }

  // Fit the camera so the whole model is in view.
  const bounds = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  function frame(aspect) {
    cam.userData.strap.visible = false; // strap loop shouldn't push the device smaller
    bounds.setFromObject(world);
    cam.userData.strap.visible = true;
    bounds.getSize(size);
    bounds.getCenter(center);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const portrait = aspect < 0.9;
    const dist = Math.max(size.y / 2 / Math.tan(vfov / 2), size.x / 2 / Math.tan(hfov / 2)) * (portrait ? 1.06 : 1.12) + size.z / 2;
    const el = 0.18, az = portrait ? 0.2 : 0.3;
    camera.position.set(
      center.x + dist * Math.sin(az) * Math.cos(el),
      center.y + dist * Math.sin(el),
      center.z + dist * Math.cos(az) * Math.cos(el)
    );
    camera.lookAt(center);
    camera.userData.home = { position: camera.position.clone(), target: center.clone() };
  }

  let needsRender = true;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    layout(camera.aspect);
    frame(camera.aspect);
    needsRender = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  function tick() {
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.getElementById('loading').hidden = true;
  window.__kitReady = true;

  // Exposed for the next steps and for poking at in the console.
  window.kit = { THREE, scene, camera, renderer, world, device, cam, LABELS, reducedMotion, requestRender: () => { needsRender = true; } };
}
