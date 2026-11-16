// Digital twin kit, v1. Step 1: page shell and static model. Step 2: turn it,
// take it apart, point at a part. Step 3: talk to Kai, listen, swap modules.
// v2: the camera module gets its own screen (camera mode) with a point-of-view test (pov mode).
// Three.js r170 (minified build), vendored in assets/vendor/three (MIT, see LICENSE there).
// The model is built from primitives. Each module is its own Group so later
// steps can lift, pull apart and swap them.

import * as THREE from './vendor/three/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from './vendor/three/addons/controls/OrbitControls.js';

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

// Deck, "07:35 · Chat module" slide, as two turns. In each list the first entry is the deck's
// line; the second is an LLM-written alternative for the team to review.
export const CONVERSATION = [
  {
    lena: ['Why are you so tired?', 'What did you find today?'],
    kai:  ['Big haul today. Lots of wrappers like yours.', 'A net full of wrappers. One looked like yours.'],
  },
  {
    lena: ['What can I do?', 'Is it my fault?'],
    kai:  ["Try the lunchbox tomorrow. I'll show you the net after.", "Not only yours. Bring the lunchbox tomorrow and I'll show you the net."],
  },
];

// Deck, Modules slide.
export const MODULES_CONTEXT = 'Four modules click together into one device. Children add or swap modules as they grow. The housing is made from recovered ocean plastic.';

// Sound module clips, in button order. All National Park Service recordings from Glacier Bay,
// public domain (US federal government work); sources in index.html. Names are LLM-written.
export const SOUNDS = [
  { key: 'humpback', name: 'Humpback whales', file: '/digital-twin-kit/assets/humpback-glacier-bay.mp3' },
  { key: 'orca',     name: 'Killer whales',   file: '/digital-twin-kit/assets/killer-whales-glacier-bay.mp3' },
  { key: 'seals',    name: 'Harbor seals',    file: '/digital-twin-kit/assets/harbor-seals-glacier-bay.mp3' },
];

// Map module ("Radar") readouts. There is no public live feed for OceanXplorer: the oceanx.org
// position box calls a private function on their site, and commercial AIS feeds need paid keys and
// a server, which this project rules out. So the screen replays real, documented moments of the
// ship and its vehicles, in order, with the date shown. `approx` marks coordinates taken from the
// described location rather than a published fix. For dives, depth is the documented dive depth;
// for the 2025 legs it is the seabed depth at the waypoint from GEBCO 2020 (api.opentopodata.org,
// queried 16 Nov 2026). Place names are LLM-written.
export const RADAR_POINTS = [
  // Will Smith's dive in National Geographic's "Welcome to Earth" ("Descent into Darkness", 2021):
  // about 1,000 m (3,300 ft) in a Triton submersible along the shelf edge east of the Bahamas.
  // https://www.nationalgeographic.com/culture/article/how-a-global-odyssey-gave-will-smith-a-real-welcome-to-earth
  { place: 'Shelf edge, Bahamas', when: '2021', lat: 24.7, lon: -77.4, depth: 1000, approx: true },
  // NEOM brine pools, Gulf of Aqaba, found by ROV from OceanXplorer in 2020 at 1,770 m.
  // https://www.nature.com/articles/s43247-022-00482-x
  { place: 'Gulf of Aqaba, Red Sea', when: '2020', lat: 28.1, lon: 34.65, depth: 1770, approx: true },
  // Seychelles 2024: ROV Chimaera to 4,603 m in the Amirantes Trench.
  // https://www.oceanx.org/missions/seychelles-2024 and https://nation.sc/articles/21066/archive
  { place: 'Amirantes Trench, Seychelles', when: 'Jan 2024', lat: -6.0, lon: 53.5, depth: 4603, approx: true },
  // Indonesia 2024: deep-sea coral reefs; a 4,800 m dive reported by Indonesian officials.
  // https://indonesia.go.id/kategori/culture/8385/indonesia-s-ocean-exploration-mission?lang=2
  { place: 'Indonesia (reported)', when: 'Jul 2024', lat: -9.5, lon: 109.5, depth: 4800, approx: true },
  // Around Africa 2025, NASA/OceanX campaign: one waypoint per dated leg in SeaBASS OCEANX_2025,
  // https://seabass.gsfc.nasa.gov/experiment/OCEANX_2025/ (cruise pages OXR20250108 .. OXR20250403).
  { place: 'Seychelles plateau', when: '8–17 Jan 2025', lat: -5.2, lon: 56.0, depth: 54 },
  { place: 'Mozambique Channel', when: '18–26 Jan 2025', lat: -10.5, lon: 44.5, depth: 3519 },
  { place: 'Off the Cape', when: '31 Jan–20 Feb 2025', lat: -35.5, lon: 20.0, depth: 161 },
  { place: 'Gulf of Guinea', when: '1–22 Mar 2025', lat: -10.0, lon: -2.0, depth: 4871 },
  { place: 'Equatorial Atlantic', when: '7–23 Mar 2025', lat: 0.5, lon: -10.0, depth: 4729 },
  { place: 'Off Cabo Verde', when: '3–5 Apr 2025', lat: 18.5, lon: -24.0, depth: 3797 },
];

// LLM-written UI strings, for the team to review.
const UI = {
  modulesTitle: 'Modules',
  swapHint: 'Tap a module, then tap another to swap them.',
  swapNext: 'Now tap the module to swap it with.',
  chatHint: 'Tap the screen to talk to Kai.',
  chatNext: 'Tap the screen for the next line.',
  chatChoose: 'Pick what Lena says.',
  soundHint: 'Tap the speaker to listen.',
  soundStop: 'Tap the speaker to stop.',
  soundStep: 'Orange and green change the sound.',
  drawHint: 'Draw on the screen. The down arrow clears it. Tap the pen to put it back.',
  mapHint: 'Real OceanX dives and positions, replayed.',
  // v2 camera screen. Button labels live in index.html.
  povHint: 'Tap the bin where the wrapper goes.',
  binPlastic: 'Plastic',
  binGeneral: 'General waste',
  right: '−1 kg in Kai’s net tomorrow.',
  wrong: '+1 hour of work for Kai tomorrow.',
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
  plane.userData.hit = 'screen';
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
// Kept as a named function so the screen can be redrawn to clear the visitor's ink.
function drawNotes(ctx, w, h) {
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
}
TEX.notes = canvasTexture(512, 464, drawNotes);

// Chat screen: Kai on a video call. Uses the deck's portrait (assets/kai.jpg) with a slow
// zoom, scanlines and captions; falls back to a drawn silhouette until the image loads.
const kaiImg = new Image();
let kaiReady = false;
kaiImg.onload = () => { kaiReady = true; };
kaiImg.src = '/digital-twin-kit/assets/kai.jpg';
function drawChat(ctx, w, h, caption, t = 0) {
  if (kaiReady) {
    const zoom = reducedMotion ? 1.04 : 1.04 + 0.035 * Math.sin(t / 1300);
    const dw = w * zoom, dh = h * zoom;
    ctx.drawImage(kaiImg, (w - dw) / 2, (h - dh) / 2 - 6, dw, dh);
    const tint = ctx.createLinearGradient(0, 0, 0, h);
    tint.addColorStop(0, 'rgba(22, 34, 42, 0.18)');
    tint.addColorStop(1, 'rgba(22, 34, 42, 0.38)');
    ctx.fillStyle = tint;
    ctx.fillRect(0, 0, w, h);
    drawChatOverlay(ctx, w, h, caption);
    return;
  }
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
  drawChatOverlay(ctx, w, h, caption);
}
function drawChatOverlay(ctx, w, h, caption) {
  // scanlines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  // live dot
  ctx.fillStyle = '#e8873a';
  ctx.beginPath();
  ctx.arc(w - 28, 28, 8, 0, Math.PI * 2);
  ctx.fill();
  if (caption && caption.typing) {
    ctx.fillStyle = 'rgba(19, 19, 18, 0.82)';
    ctx.fillRect(0, h - 96, w, 96);
    ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#e8873a';
    ctx.fillText(caption.who, 20, h - 84);
    ctx.fillStyle = '#e9dfd8';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(32 + i * 22, h - 36, 6, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  if (caption) {
    ctx.fillStyle = 'rgba(19, 19, 18, 0.82)';
    ctx.fillRect(0, h - 96, w, 96);
    ctx.font = '600 22px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillStyle = caption.who === 'Kai' ? '#e8873a' : '#9fe6d2';
    ctx.fillText(caption.who, 20, h - 84);
    ctx.font = '24px system-ui, -apple-system, "Segoe UI", sans-serif';
    ctx.fillStyle = '#e9dfd8';
    // simple word wrap, two lines max
    const lines = [];
    let line = '';
    for (const word of caption.text.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > w - 40 && line) { lines.push(line); line = word; } else line = next;
    }
    lines.push(line);
    lines.slice(0, 2).forEach((l, i) => ctx.fillText(l, 20, h - 56 + i * 28));
  }
}
TEX.chat = canvasTexture(512, 352, (ctx, w, h) => drawChat(ctx, w, h, null));
let chatCaption = null;
function setChatCaption(caption, t) {
  chatCaption = caption;
  const c = TEX.chat.image;
  drawChat(c.getContext('2d'), c.width, c.height, caption, t);
  TEX.chat.needsUpdate = true;
}

// Map screen. Gold contour map with a turtle, following kit-reference.jpg. The static part is
// drawn once; the readouts are redrawn on top as the replay runs (see drawMapReadout).
function drawMapBase(ctx, w, h) {
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
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i < 3 ? '#e6b94a' : 'rgba(230, 185, 74, 0.3)';
    ctx.fillRect(18 + i * 18, h - 30, 13, 13);
  }
}
const mapBase = document.createElement('canvas');
mapBase.width = 512; mapBase.height = 420;
drawMapBase(mapBase.getContext('2d'), mapBase.width, mapBase.height);
TEX.map = canvasTexture(512, 420, (ctx) => ctx.drawImage(mapBase, 0, 0));

function fmtCoord(v, pos, neg) {
  return Math.abs(v).toFixed(2) + '\u00b0 ' + (v >= 0 ? pos : neg);
}
function drawMapReadout(r) {
  const c = TEX.map.image;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.drawImage(mapBase, 0, 0);
  ctx.fillStyle = 'rgba(15, 18, 15, 0.7)';
  ctx.fillRect(10, 10, 190, 76);
  ctx.fillStyle = '#e6b94a';
  ctx.font = '16px ui-monospace, Menlo, Consolas, monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ['LAT ' + fmtCoord(r.lat, 'N', 'S'), 'LON ' + fmtCoord(r.lon, 'E', 'W'), 'DEP ' + Math.round(r.dep) + ' m']
    .forEach((t, i) => ctx.fillText(t, 18, 16 + i * 22));
  ctx.textAlign = 'right';
  ctx.font = '600 14px system-ui, -apple-system, "Segoe UI", sans-serif';
  const line = (r.point.approx ? '~ ' : '') + r.point.place;
  const wl = Math.max(ctx.measureText(line).width, ctx.measureText(r.point.when).width) + 20;
  ctx.fillStyle = 'rgba(15, 18, 15, 0.7)';
  ctx.fillRect(w - 18 - wl, h - 54, wl, 42);
  ctx.fillStyle = '#e6b94a';
  ctx.fillText(line, w - 28, h - 50);
  ctx.font = '13px ui-monospace, Menlo, Consolas, monospace';
  ctx.fillText(r.point.when, w - 28, h - 32);
  ctx.textAlign = 'left';
  TEX.map.needsUpdate = true;
}

// Where the replay is at a given time: travel between points, then the dive at each one.
const RADAR = { travel: 20000, down: 6000, hold: 6000, up: 3000, t0: performance.now() };
function radarState(now) {
  const legMs = RADAR.travel + RADAR.down + RADAR.hold + RADAR.up;
  const n = RADAR_POINTS.length;
  const cycle = legMs * n;
  // Frame timestamps can precede t0 on the first frame; keep the modulo positive.
  const total = (((now - RADAR.t0) % cycle) + cycle) % cycle;
  const i = Math.floor(total / legMs);
  const u = total - i * legMs;
  const from = RADAR_POINTS[(i - 1 + n) % n];
  const to = RADAR_POINTS[i];
  let lat = to.lat, lon = to.lon, dep = 0;
  if (u < RADAR.travel) {
    const k = ease.inOutCubic(u / RADAR.travel);
    lat = from.lat + (to.lat - from.lat) * k;
    lon = from.lon + (to.lon - from.lon) * k;
  } else if (u < RADAR.travel + RADAR.down) {
    dep = to.depth * ease.inOutCubic((u - RADAR.travel) / RADAR.down);
  } else if (u < RADAR.travel + RADAR.down + RADAR.hold) {
    dep = to.depth;
  } else {
    dep = to.depth * (1 - ease.inOutCubic((u - RADAR.travel - RADAR.down - RADAR.hold) / RADAR.up));
  }
  return { lat, lon, dep, point: to, moving: u < RADAR.travel };
}

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
  const arrowDown = at(decal(0.07, 0.07, TEX.arrowDown), 0, -0.265, FRONT + 0.0015);
  arrowDown.userData.hit = 'clear'; // clears the visitor's ink while drawing
  g.add(arrowDown);

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
  stylus.traverse((o) => { o.userData.hit = 'pen'; });
  g.add(stylus);
  g.userData.stylus = stylus;
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
  grille.userData.hit = 'speaker';
  recess.userData.hit = 'speaker';
  g.add(grille);
  g.userData.grille = grille;

  // Four round buttons: orange = up (previous sound), green = down (next sound), whites = play/stop.
  const buttons = [[M.orange, 'up'], [M.green, 'down'], [M.white, 'speaker'], [M.white, 'speaker']];
  buttons.forEach(([m, hit], i) => {
    const y = 0.2 - i * 0.12;
    const recess = cylinder(0.036, 0.01, M.creamDark, 28);
    at(recess, 0.16, y, FRONT - 0.003);
    g.add(recess);
    const b = cylinder(0.03, 0.03, m.clone(), 28);
    at(b, 0.16, y, FRONT + 0.01);
    b.userData.hit = hit;
    g.add(b);
    if (i === 2) g.userData.playLight = b.material; // first white button pulses while playing
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
  const holders = {};
  for (const [key, m] of Object.entries(modules)) {
    // The holder moves with the slot (take apart, swap); the module inside lifts on focus.
    const holder = new THREE.Group();
    holder.position.set(slots[key][0], slots[key][1], 0);
    holder.userData.slot = key;
    m.userData.part = key;
    holder.add(m);
    holders[key] = holder;
    device.add(holder);
  }
  const spine = box(DEVICE.w - 0.06, DEVICE.h - 0.06, DEVICE.d - 0.06, M.ink, 0.03);
  spine.position.z = -0.005;
  device.add(spine);
  device.userData.spine = spine;
  device.userData.modules = modules;
  device.userData.holders = holders;
  device.userData.slots = slots;
  return device;
}

// ---------------------------------------------------------------------------
// Camera module: separate unit on an orange lanyard.
// ---------------------------------------------------------------------------
function buildCamera() {
  const outer = new THREE.Group();
  outer.name = 'camera';
  const g = new THREE.Group(); // body: lifts on focus, outer handles placement
  g.userData.part = 'camera';
  outer.add(g);
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
  outer.add(strap); // the strap stays put when the body lifts
  outer.userData.strap = strap;
  outer.userData.body = g;
  outer.userData.light = light.material;
  outer.userData.size = { W, H, D };
  return outer;
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
// Tiny tween helper (numeric properties on any object, e.g. a Vector3).
// ---------------------------------------------------------------------------
const tweens = [];
const ease = {
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inCubic: (t) => t * t * t,
  outBack: (t) => { const c = 2.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};
function tween(target, to, duration, easing = ease.outCubic, delay = 0, onDone) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    if (tweens[i].target === target) tweens.splice(i, 1);
  }
  const scale = reducedMotion ? 0.3 : 1;
  tweens.push({ target, to, from: null, start: performance.now() + delay * scale, duration: Math.max(1, duration * scale), easing, onDone });
}
function updateTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const t = tweens[i];
    if (now < t.start) continue;
    if (!t.from) { t.from = {}; for (const k in t.to) t.from[k] = t.target[k]; }
    const p = Math.min(1, (now - t.start) / t.duration);
    const e = t.easing(p);
    for (const k in t.to) t.target[k] = t.from[k] + (t.to[k] - t.from[k]) * e;
    if (p >= 1) { tweens.splice(i, 1); if (t.onDone) t.onDone(); }
  }
  return tweens.length > 0;
}

// ---------------------------------------------------------------------------
// Scene
// ---------------------------------------------------------------------------
const stage = document.getElementById('stage');
const canvasEl = document.getElementById('view');
const labelEl = document.getElementById('label');
const labelName = document.getElementById('label-name');
const labelLine = document.getElementById('label-line');
const labelHint = document.getElementById('label-hint');
const labelChoices = document.getElementById('label-choices');
const btnApart = document.getElementById('btn-apart');
const btnReset = document.getElementById('btn-reset');
const btnCamera = document.getElementById('btn-camera');
const btnBack = document.getElementById('btn-back');
const btnTry = document.getElementById('btn-try');
const btnAgain = document.getElementById('btn-again');
const btnBackReaction = document.getElementById('btn-back-reaction');
const viewfinderEl = document.getElementById('viewfinder');
const vfHint = document.getElementById('vf-hint');
const reactionEl = document.getElementById('reaction');
const reactionText = document.getElementById('reaction-text');

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
  const img = document.querySelector('#fallback img');
  if (!img.src) img.src = img.dataset.src; // only download the render when it is needed
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

  // Kit mode shows kitGroup, camera mode shows camGroup. Only one is in the world at a time.
  const kitGroup = new THREE.Group();
  const device = buildDevice();
  device.rotation.x = -0.08; // lean back a touch
  kitGroup.add(device);
  const deviceShadow = shadowPlane(2.0, 0.9);
  deviceShadow.position.set(0, -DEVICE.h / 2 - 0.03, 0.05);
  kitGroup.add(deviceShadow);
  world.add(kitGroup);

  const camGroup = new THREE.Group();
  const cam = buildCamera();
  cam.position.set(0, 0.12, 0);
  cam.rotation.set(-0.05, -0.35, 0.05);
  camGroup.add(cam);
  const camShadow = shadowPlane(1.1, 0.6);
  camShadow.position.set(0, cam.position.y - cam.userData.size.H / 2 - 0.03, 0.05);
  camGroup.add(camShadow);

  const parts = {
    notes:  { group: device.userData.modules.notes,  screen: null },
    chat:   { group: device.userData.modules.chat,   screen: null },
    map:    { group: device.userData.modules.map,    screen: null },
    sound:  { group: device.userData.modules.sound,  screen: null },
    camera: { group: cam.userData.body, screen: null },
  };
  for (const key of ['notes', 'chat', 'map']) {
    parts[key].group.traverse((o) => { if (o.userData.screenMaterial) parts[key].screen = o.userData.screenMaterial; });
  }
  const kitTargets = ['notes', 'chat', 'map', 'sound'].map((k) => parts[k].group);
  const camTargets = [parts.camera.group];
  let mode = 'kit'; // 'kit' | 'camera' | 'pov'

  // -------------------------------------------------------------------------
  // Interaction 1: turn it. Drag to rotate, pinch or scroll to zoom, double-tap to reset.
  // -------------------------------------------------------------------------
  const controls = new OrbitControls(camera, canvasEl);
  controls.enablePan = false;
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;
  controls.minPolarAngle = Math.PI / 2 - 0.65;
  controls.maxPolarAngle = Math.PI / 2 + 0.45;

  // Fit the camera so the whole model is in view, and remember that as home.
  const bounds = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const home = { position: new THREE.Vector3(), target: new THREE.Vector3() };
  function frame(aspect) {
    bounds.setFromObject(world);
    bounds.getSize(size);
    bounds.getCenter(center);
    const vfov = THREE.MathUtils.degToRad(camera.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const portrait = aspect < 0.9;
    const dist = Math.max(size.y / 2 / Math.tan(vfov / 2), size.x / 2 / Math.tan(hfov / 2)) * (portrait ? 1.06 : 1.12) + size.z / 2;
    const el = 0.18, az = portrait ? 0.2 : 0.3;
    home.position.set(
      center.x + dist * Math.sin(az) * Math.cos(el),
      center.y + dist * Math.sin(el),
      center.z + dist * Math.cos(az) * Math.cos(el)
    );
    home.target.copy(center);
    controls.minDistance = dist * 0.5;
    controls.maxDistance = dist * 1.6;
    camera.position.copy(home.position);
    controls.target.copy(home.target);
    controls.update();
  }

  function resetView() {
    controls.enabled = false;
    tween(camera.position, { x: home.position.x, y: home.position.y, z: home.position.z }, 550, ease.inOutCubic);
    tween(controls.target, { x: home.target.x, y: home.target.y, z: home.target.z }, 550, ease.inOutCubic, 0, () => { controls.enabled = !drawing; });
  }
  btnReset.disabled = false;
  btnReset.addEventListener('click', resetView);
  canvasEl.addEventListener('dblclick', (e) => { if (mode !== 'pov' && !partAt(e.clientX, e.clientY).part) resetView(); });

  // -------------------------------------------------------------------------
  // Interaction 2: take it apart, and click it back together.
  // -------------------------------------------------------------------------
  const APART = { x: 0.26, y: 0.17, z: 0.08 };
  let apart = false;
  function setApart(next) {
    if (drawing) setDrawing(false);
    apart = next;
    const holders = device.userData.holders;
    const slots = device.userData.slots;
    Object.keys(holders).forEach((key, i) => {
      const h = holders[key];
      const [sx, sy] = slots[h.userData.slot];
      const delay = i * 45;
      if (apart) {
        tween(h.position, { x: sx + Math.sign(sx) * APART.x, y: sy + Math.sign(sy) * APART.y, z: APART.z }, 650, ease.outCubic, delay);
      } else {
        // Overshoot into the slot so it reads as a click.
        tween(h.position, { x: sx, y: sy, z: 0 }, 520, ease.outBack, delay);
      }
    });
    // The dark spine only exists to darken the seams; shrink it away while apart.
    const spine = device.userData.spine;
    if (apart) {
      tween(spine.scale, { x: 0.001, y: 0.001, z: 0.001 }, 400, ease.inOutCubic, 0, () => { spine.visible = false; });
    } else {
      spine.visible = true;
      tween(spine.scale, { x: 1, y: 1, z: 1 }, 300, ease.outCubic, 250);
    }
    // LLM-written: button label toggles with the state
    btnApart.textContent = apart ? 'Put together' : 'Take apart';
    btnApart.setAttribute('aria-pressed', String(apart));
    selectForSwap(null);
    renderLabel();
  }
  btnApart.disabled = false;
  btnApart.setAttribute('aria-pressed', 'false');
  btnApart.addEventListener('click', () => setApart(!apart));

  // -------------------------------------------------------------------------
  // Interaction 3: point at a part. Hover on desktop, tap on phone.
  // -------------------------------------------------------------------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let focused = null;
  const worldPos = new THREE.Vector3();

  function partAt(clientX, clientY) {
    const r = canvasEl.getBoundingClientRect();
    pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const targets = mode === 'kit' ? kitTargets : mode === 'camera' ? camTargets : pov.targets;
    raycaster.setFromCamera(pointer, mode === 'pov' ? povCamera : camera);
    const hits = raycaster.intersectObjects(targets, true);
    for (const hit of hits) {
      let o = hit.object;
      let area = null;
      while (o && !o.userData.part && !o.userData.bin) {
        if (!area && o.userData.hit) area = o.userData.hit;
        o = o.parent;
      }
      if (o) return { part: o.userData.part || null, bin: o.userData.bin || null, area };
    }
    return { part: null, bin: null, area: null };
  }

  function placeLabel(key) {
    // On narrow screens, keep the label away from the part it describes.
    const wide = window.innerWidth >= 760 && window.innerWidth / window.innerHeight >= 1;
    if (wide || !key) {
      labelEl.classList.remove('label--top');
      return;
    }
    parts[key].group.getWorldPosition(worldPos).project(camera);
    const screenY = (1 - worldPos.y) / 2; // 0 top, 1 bottom of the stage
    labelEl.classList.toggle('label--top', screenY > 0.55);
  }

  // One place decides what the label says, from the current state.
  function renderLabel() {
    let name = '', line = '', hint = '', anchor = null, speaker = null;
    if (mode === 'pov') { labelEl.hidden = true; return; }
    if (mode === 'camera') {
      name = LABELS.camera.name; line = LABELS.camera.line; anchor = 'camera';
    } else if (drawing) {
      name = LABELS.notes.name; line = LABELS.notes.line; hint = UI.drawHint; anchor = 'notes';
    } else if (talk.index >= 0) {
      name = LABELS.chat.name; anchor = 'chat';
      if (talk.phase === 'choose') {
        hint = UI.chatChoose;
      } else if (chatCaption && !chatCaption.typing) {
        speaker = chatCaption.who; line = chatCaption.text;
        if (talk.phase === 'kai') hint = UI.chatNext;
      } else if (chatCaption) {
        speaker = 'Kai'; line = '…';
      }
    } else if (selected) {
      name = LABELS[selected].name; line = LABELS[selected].line; hint = UI.swapNext; anchor = selected;
    } else if (focused) {
      name = LABELS[focused].name; line = LABELS[focused].line; anchor = focused;
      if (apart && focused !== 'camera') hint = UI.swapHint;
      else if (focused === 'chat') hint = UI.chatHint;
      else if (focused === 'map') hint = UI.mapHint;
      else if (focused === 'sound') hint = `${soundIndex + 1}/${SOUNDS.length} ${SOUNDS[soundIndex].name}. ${listening ? UI.soundStop : UI.soundHint} ${UI.soundStep}`;
    } else if (apart) {
      name = UI.modulesTitle; line = MODULES_CONTEXT; hint = UI.swapHint;
    }
    if (!name) { labelEl.hidden = true; return; }
    labelName.textContent = name;
    labelLine.textContent = '';
    if (speaker) {
      const s = document.createElement('span');
      s.className = 'speaker';
      s.textContent = speaker + ': ';
      labelLine.appendChild(s);
    }
    labelLine.appendChild(document.createTextNode(line));
    labelHint.textContent = hint;
    labelChoices.textContent = '';
    if (talk.awaiting) {
      CONVERSATION[talk.turn].lena.forEach((text, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.addEventListener('click', () => talk.choose(i));
        labelChoices.appendChild(b);
      });
    }
    placeLabel(anchor);
    labelEl.hidden = false;
  }

  function setFocus(key) {
    if (key === focused) return;
    if (focused) {
      const prev = parts[focused];
      tween(prev.group.position, { z: 0 }, 260);
      if (prev.screen) tween(prev.screen, { emissiveIntensity: 0.55 }, 260);
      if (focused === 'camera') tween(cam.userData.light, { emissiveIntensity: 0 }, 260);
    }
    focused = key;
    if (key) {
      const p = parts[key];
      tween(p.group.position, { z: 0.07 }, 320, ease.outBack);
      if (p.screen) tween(p.screen, { emissiveIntensity: 1.15 }, 320);
      if (key === 'camera') tween(cam.userData.light, { emissiveIntensity: 1.3 }, 320);
    }
    renderLabel();
  }

  // -------------------------------------------------------------------------
  // Interaction 4: talk to Kai. Tap the Chat screen; lines play one at a time.
  // -------------------------------------------------------------------------
  // The visitor picks Lena's line each turn; Kai answers. Phases: choose, lena, typing, kai.
  const talk = {
    turn: -1,
    phase: 'idle',
    timer: 0,
    get index() { return this.turn; },
    get awaiting() { return this.phase === 'choose'; },
    set(phase, caption, nextMs, next) {
      clearTimeout(this.timer);
      this.phase = phase;
      setChatCaption(caption, performance.now());
      needsRender = true;
      renderLabel();
      if (next) this.timer = setTimeout(next, reducedMotion ? Math.min(nextMs, 900) : nextMs);
    },
    start() { this.turn = 0; this.set('choose', null); },
    choose(i) {
      if (this.phase !== 'choose') return;
      const t = CONVERSATION[this.turn];
      this.reply = t.kai[i];
      this.set('lena', { who: 'Lena', text: t.lena[i] }, 1500, () =>
        this.set('typing', { who: 'Kai', typing: true }, 900, () => this.showKai()));
    },
    showKai() {
      this.set('kai', { who: 'Kai', text: this.reply }, 3200, () => this.next());
    },
    next() {
      if (this.turn + 1 < CONVERSATION.length) { this.turn += 1; this.set('choose', null); }
      else this.stop();
    },
    advance() {
      // A tap on the screen skips the wait.
      if (this.phase === 'lena' || this.phase === 'typing') this.showKai();
      else if (this.phase === 'kai') this.next();
    },
    stop() { clearTimeout(this.timer); this.turn = -1; this.phase = 'idle'; setChatCaption(null); needsRender = true; renderLabel(); },
  };

  // -------------------------------------------------------------------------
  // Interaction 5: listen. Tap the speaker or a button; tap again to stop.
  // -------------------------------------------------------------------------
  const ocean = document.getElementById('ocean');
  let listening = false;
  let soundIndex = 0;
  ocean.src = SOUNDS[soundIndex].file;
  // Orange and green buttons step through the list; keeps playing if a clip was playing.
  function stepSound(dir) {
    soundIndex = (soundIndex + dir + SOUNDS.length) % SOUNDS.length;
    const wasListening = listening;
    ocean.pause();
    ocean.src = SOUNDS[soundIndex].file;
    ocean.currentTime = 0;
    if (wasListening) {
      const p = ocean.play();
      if (p && p.catch) p.catch(() => { listening = false; playLightOff(); renderLabel(); });
    }
    renderLabel();
  }
  function stopListening() {
    listening = false;
    ocean.pause();
    ocean.currentTime = 0;
    playLightOff();
    renderLabel();
  }
  function playLightOff() {
    const m = parts.sound.group.userData.playLight;
    m.emissiveIntensity = 0;
    needsRender = true;
  }
  function toggleListen() {
    if (listening) { stopListening(); return; }
    const p = ocean.play();
    if (p && p.catch) p.catch(() => { listening = false; playLightOff(); renderLabel(); });
    listening = true;
    renderLabel();
  }
  ocean.addEventListener('ended', stopListening);
  ocean.addEventListener('pause', () => { if (listening && ocean.ended) stopListening(); });

  // -------------------------------------------------------------------------
  // Interaction 6: swap modules. While apart: tap one module, then tap another.
  // -------------------------------------------------------------------------
  let selected = null;
  function holderTarget(holder) {
    const [sx, sy] = device.userData.slots[holder.userData.slot];
    return { x: sx + Math.sign(sx) * APART.x, y: sy + Math.sign(sy) * APART.y, z: APART.z };
  }
  function selectForSwap(key) {
    if (selected) {
      const h = device.userData.holders[selected];
      if (apart) tween(h.position, holderTarget(h), 300);
    }
    selected = key;
    if (key) {
      const h = device.userData.holders[key];
      const t = holderTarget(h);
      tween(h.position, { x: t.x, y: t.y, z: t.z + 0.12 }, 300, ease.outBack);
    }
    renderLabel();
  }
  function swapModules(a, b) {
    const ha = device.userData.holders[a];
    const hb = device.userData.holders[b];
    const slotA = ha.userData.slot;
    ha.userData.slot = hb.userData.slot;
    hb.userData.slot = slotA;
    selected = null;
    tween(ha.position, holderTarget(ha), 600, ease.inOutCubic);
    tween(hb.position, holderTarget(hb), 600, ease.inOutCubic);
    renderLabel();
  }

  // -------------------------------------------------------------------------
  // v3: draw on the Notes screen. Tap the pen to pick it up; drag on the screen to draw.
  // -------------------------------------------------------------------------
  let drawing = false;
  let stroke = null;
  const stylus = parts.notes.group.userData.stylus;
  const stylusHome = stylus.position.clone();
  let notesPlane = null;
  parts.notes.group.traverse((o) => { if (!notesPlane && o.userData.hit === 'screen') notesPlane = o; });
  const notesCanvas = TEX.notes.image;
  const notesCtx = notesCanvas.getContext('2d');
  const notesCenter = new THREE.Vector3();

  function setDrawing(next) {
    if (next === drawing) return;
    drawing = next;
    stroke = null;
    if (drawing) {
      tween(stylus.position, { x: stylusHome.x + 0.06, y: stylusHome.y + 0.05, z: stylusHome.z + 0.16 }, 350, ease.outBack);
      tween(stylus.rotation, { x: 0.35, z: -0.4 }, 350);
      controls.enabled = false;
      setFocus('notes');
      // Move in on the Notes module so there is room to draw.
      parts.notes.group.getWorldPosition(notesCenter);
      const pos = notesCenter.clone().add(camera.position.clone().sub(notesCenter).multiplyScalar(0.55));
      tween(camera.position, { x: pos.x, y: pos.y, z: pos.z }, 500, ease.inOutCubic);
      tween(controls.target, { x: notesCenter.x, y: notesCenter.y, z: notesCenter.z }, 500, ease.inOutCubic);
    } else {
      tween(stylus.position, { x: stylusHome.x, y: stylusHome.y, z: stylusHome.z }, 350, ease.outCubic);
      tween(stylus.rotation, { x: 0, z: 0 }, 350);
      resetView(); // re-enables the controls when it lands
    }
    renderLabel();
  }

  function screenUV(clientX, clientY) {
    const r = canvasEl.getBoundingClientRect();
    pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(notesPlane, false)[0];
    return hit && hit.uv ? hit.uv : null;
  }

  function inkTo(uv, begin) {
    const x = uv.x * notesCanvas.width;
    const y = (1 - uv.y) * notesCanvas.height;
    if (begin) {
      notesCtx.beginPath();
      notesCtx.moveTo(x, y);
      notesCtx.lineTo(x + 0.01, y);
    } else {
      notesCtx.lineTo(x, y);
    }
    notesCtx.strokeStyle = '#9FE6D2';
    notesCtx.lineWidth = 6;
    notesCtx.lineCap = 'round';
    notesCtx.lineJoin = 'round';
    notesCtx.stroke();
    notesCtx.beginPath();
    notesCtx.moveTo(x, y);
    TEX.notes.needsUpdate = true;
    needsRender = true;
  }

  function clearInk() {
    drawNotes(notesCtx, notesCanvas.width, notesCanvas.height);
    TEX.notes.needsUpdate = true;
    needsRender = true;
  }

  // Pointer handling: hover for mouse, tap for touch and pen. Drags go to OrbitControls.
  let down = null;
  let lastTap = 0;
  canvasEl.addEventListener('pointerdown', (e) => {
    if (drawing && mode === 'kit') {
      const uv = screenUV(e.clientX, e.clientY);
      if (uv) { stroke = true; inkTo(uv, true); down = null; return; }
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
  });
  canvasEl.addEventListener('pointermove', (e) => {
    if (stroke && e.buttons) {
      const uv = screenUV(e.clientX, e.clientY);
      if (uv) inkTo(uv, false);
      return;
    }
    if (drawing) return; // no hover changes while the pen is out
    if (e.pointerType !== 'mouse' || e.buttons) return;
    const hit = partAt(e.clientX, e.clientY);
    if (mode === 'pov') pov.hover(hit.bin); else setFocus(hit.part);
  });
  canvasEl.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (mode === 'pov') pov.hover(null); else if (!selected) setFocus(null);
  });
  canvasEl.addEventListener('pointerup', (e) => {
    stroke = null;
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const held = performance.now() - down.t;
    down = null;
    if (moved > 10 || held > 400) return; // a drag, not a tap
    const now = performance.now();
    const hit = partAt(e.clientX, e.clientY);
    // Double-tap on empty space resets the view. On a part, two taps are two taps.
    if (mode !== 'pov' && e.pointerType !== 'mouse' && !hit.part && now - lastTap < 320) {
      lastTap = 0;
      resetView();
      return;
    }
    lastTap = now;
    tap(hit, e.pointerType === 'mouse');
  });
  canvasEl.addEventListener('pointercancel', () => { down = null; stroke = null; });

  function tap({ part, area, bin }, isMouse) {
    if (mode === 'pov') { if (bin) pov.throwInto(bin); return; }
    // Hover already focused the part on desktop; on touch the first tap does it.
    const wasFocused = focused === part;
    setFocus(part);
    if (mode === 'camera') return;
    if (drawing) {
      if (part === 'notes' && area === 'pen') setDrawing(false);
      else if (part === 'notes' && area === 'clear') clearInk();
      return;
    }
    if (!part) { selectForSwap(null); return; }
    if (!apart && part === 'notes' && area === 'pen' && (isMouse || wasFocused)) { setDrawing(true); return; }

    if (apart) {
      if (part === 'camera') return;
      if (!selected) selectForSwap(part);
      else if (selected === part) selectForSwap(null);
      else swapModules(selected, part);
      return;
    }
    if (part === 'chat' && area === 'screen' && (isMouse || wasFocused)) {
      if (talk.index >= 0) talk.advance(); else talk.start();
    } else if (part === 'sound' && area === 'speaker' && (isMouse || wasFocused)) {
      toggleListen();
    } else if (part === 'sound' && (area === 'up' || area === 'down') && (isMouse || wasFocused)) {
      stepSound(area === 'up' ? -1 : 1);
    }
  }

  // -------------------------------------------------------------------------
  // v2: camera screen and the point-of-view test.
  // -------------------------------------------------------------------------
  const povScene = new THREE.Scene();
  povScene.environment = scene.environment;
  povScene.environmentIntensity = 0.5;
  povScene.add(new THREE.HemisphereLight(0xffffff, 0xd9d2c8, 0.9));
  const povKey = new THREE.DirectionalLight(0xffffff, 1.5);
  povKey.position.set(1, 3, 2);
  povScene.add(povKey);
  const povCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 50);
  povCamera.position.set(0, 1.05, 1.55);
  povCamera.lookAt(0, 0.3, -0.35);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(5, 48), mat(0xF2EEE8, { roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  povScene.add(floor);

  // A bin: tapered body, lid ring, label on the front. The body material is cloned so hover can light it.
  function buildBin(key, color, labelText, labelBg) {
    const g = new THREE.Group();
    g.userData.bin = key;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.78, 36), mat(color, { roughness: 0.55 }));
    body.position.y = 0.39;
    g.add(body);
    g.userData.body = body.material;
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.06, 36), mat(C.ink, { roughness: 0.5 }));
    lid.position.y = 0.81;
    g.add(lid);
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.27, 36), mat(0x0d0e0d, { roughness: 1 }));
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.y = 0.845;
    g.add(mouth);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.36, 0.14),
      new THREE.MeshStandardMaterial({
        map: canvasTexture(512, 200, (ctx, w, h) => {
          ctx.fillStyle = labelBg; roundRect(ctx, 0, 0, w, h, 40); ctx.fill();
          ctx.fillStyle = '#131312';
          ctx.font = '700 72px system-ui, -apple-system, "Segoe UI", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(labelText, w / 2, h / 2 + 4);
        }), transparent: true, roughness: 0.7,
      })
    );
    label.position.set(0, 0.5, 0.29);
    label.rotation.x = -0.08;
    g.add(label);
    const shadow = shadowPlane(1.1, 0.8);
    shadow.position.y = 0.004;
    g.add(shadow);
    return g;
  }
  const binPlastic = buildBin('plastic', 0x4FA8DC, UI.binPlastic, '#dff4ff');
  binPlastic.position.set(-0.5, 0, -0.75);
  const binGeneral = buildBin('general', 0x5A5C60, UI.binGeneral, '#e9e6e1');
  binGeneral.position.set(0.5, 0, -0.75);
  povScene.add(binPlastic, binGeneral);
  const bins = { plastic: binPlastic, general: binGeneral };

  // The wrapper: a crumpled snack wrapper in orange and paper tones.
  const wrapper = new THREE.Group();
  const wrapperTex = canvasTexture(256, 160, (ctx, w, h) => {
    ctx.fillStyle = '#EF7A1F'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#E9DFD8';
    for (let x = 0; x < w; x += 48) ctx.fillRect(x, 0, 20, h);
    ctx.strokeStyle = '#131312'; ctx.lineWidth = 6; ctx.beginPath();
    for (let x = 0; x <= w; x += 8) { const y = h / 2 + Math.sin(x / 14) * 18; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
  });
  const wrapperMat = new THREE.MeshStandardMaterial({ map: wrapperTex, roughness: 0.6 });
  const wrapBody = new THREE.Mesh(roundedBox(0.26, 0.05, 0.16, 0.02), wrapperMat);
  wrapper.add(wrapBody);
  const wrapFold = new THREE.Mesh(roundedBox(0.12, 0.05, 0.1, 0.02), wrapperMat);
  wrapFold.position.set(0.06, 0.035, -0.02);
  wrapFold.rotation.set(0.3, 0.5, 0.2);
  wrapper.add(wrapFold);
  const wrapShadow = shadowPlane(0.5, 0.36);
  wrapShadow.position.y = -0.028;
  wrapper.add(wrapShadow);
  wrapper.rotation.y = 0.4;
  wrapper.visible = false;
  povScene.add(wrapper);
  const WRAP_REST = { x: 0, y: 0.03, z: 0.38 };
  const WRAP_START = { x: 0.05, y: 0.03, z: 1.1 };

  const pov = {
    state: 'off', // off | asleep | awake | thrown
    targets: [binPlastic, binGeneral],
    timer: 0,
    hovered: null,
    fit(aspect) {
      // Keep both bins in frame on narrow screens: widen the lens, never narrower than 48 degrees.
      const hHalf = THREE.MathUtils.degToRad(26);
      povCamera.fov = Math.max(48, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(hHalf) / aspect)));
      povCamera.aspect = aspect;
      povCamera.updateProjectionMatrix();
      // On wide screens the hint strip sits low, so the wrapper rests nearer the middle of the frame.
      WRAP_REST.z = aspect >= 1 ? -0.05 : 0.38;
      if (this.state === 'awake') wrapper.position.z = WRAP_REST.z;
    },
    enter() {
      this.state = 'asleep';
      viewfinderEl.className = 'viewfinder asleep';
      reactionEl.hidden = true;
      vfHint.textContent = UI.povHint;
      wrapper.visible = false;
      wrapper.position.set(WRAP_START.x, WRAP_START.y, WRAP_START.z);
      needsRender = true;
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.wake(), reducedMotion ? 300 : 1200);
    },
    wake() {
      this.state = 'awake';
      viewfinderEl.className = 'viewfinder awake';
      wrapper.visible = true;
      tween(wrapper.position, { x: WRAP_REST.x, y: WRAP_REST.y, z: WRAP_REST.z }, 700, ease.outCubic);
    },
    hover(key) {
      if (this.state !== 'awake') key = null;
      if (key === this.hovered) return;
      if (this.hovered) tween(bins[this.hovered].userData.body, { emissiveIntensity: 0 }, 200);
      this.hovered = key;
      if (key) {
        bins[key].userData.body.emissive.set(0xffffff);
        tween(bins[key].userData.body, { emissiveIntensity: 0.18 }, 200);
      }
      canvasEl.style.cursor = key ? 'pointer' : '';
    },
    throwInto(key) {
      if (this.state !== 'awake') return;
      this.state = 'thrown';
      this.hover(null);
      viewfinderEl.className = 'viewfinder awake thrown';
      const b = bins[key].position;
      const flight = reducedMotion ? 200 : 750;
      tween(wrapper.position, { x: b.x, z: b.z }, flight, ease.inOutCubic);
      // Height goes up, then down into the bin. Two tweens on a helper object, applied in tick.
      const arc = { y: WRAP_REST.y };
      tween(arc, { y: 1.05 }, flight * 0.5, ease.outCubic, 0, () => {
        tween(arc, { y: 0.6 }, flight * 0.5, ease.inCubic, 0, () => {
          wrapper.visible = false;
          needsRender = true;
          this.react(key);
        });
      });
      this.arc = arc;
      tween(wrapper.rotation, { x: 1.6, y: 2.2 }, flight, ease.inOutCubic);
    },
    react(key) {
      const right = key === 'plastic';
      reactionText.textContent = right ? UI.right : UI.wrong;
      reactionEl.className = 'reaction ' + (right ? 'right' : 'wrong');
      reactionEl.hidden = false;
    },
    reset() {
      // Try again: straight to awake, no sleep beat.
      reactionEl.hidden = true;
      this.state = 'awake';
      viewfinderEl.className = 'viewfinder awake';
      wrapper.rotation.set(0, 0.4, 0);
      wrapper.position.set(WRAP_START.x, WRAP_START.y, WRAP_START.z);
      wrapper.visible = true;
      tween(wrapper.position, { x: WRAP_REST.x, y: WRAP_REST.y, z: WRAP_REST.z }, 600, ease.outCubic);
    },
    leave() {
      clearTimeout(this.timer);
      this.hover(null);
      this.state = 'off';
      reactionEl.hidden = true;
      viewfinderEl.className = 'viewfinder';
    },
    arc: null,
  };

  function setMode(next) {
    if (next === mode) return;
    if (mode === 'kit') { talk.stop(); if (listening) stopListening(); selectForSwap(null); if (drawing) setDrawing(false); }
    if (mode === 'pov') pov.leave();
    setFocus(null);
    mode = next;
    document.body.dataset.mode = mode;
    if (mode === 'kit') { world.remove(camGroup); world.add(kitGroup); controls.enabled = true; }
    if (mode === 'camera') { world.remove(kitGroup); world.add(camGroup); controls.enabled = true; }
    if (mode === 'pov') { controls.enabled = false; pov.enter(); }
    if (mode !== 'pov') frame(camera.aspect);
    renderLabel();
    needsRender = true;
  }
  btnCamera.disabled = false;
  btnCamera.addEventListener('click', () => setMode('camera'));
  btnTry.addEventListener('click', () => setMode('pov'));
  btnBack.addEventListener('click', () => setMode('kit'));
  btnBackReaction.addEventListener('click', () => setMode('kit'));
  btnAgain.addEventListener('click', () => pov.reset());

  // -------------------------------------------------------------------------
  // Sizing and render loop
  // -------------------------------------------------------------------------
  let needsRender = true;
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pov.fit(w / h);
    if (mode !== 'pov') frame(camera.aspect);
    if (focused) placeLabel(focused);
    needsRender = true;
  }
  new ResizeObserver(resize).observe(stage);
  resize();
  controls.addEventListener('change', () => { needsRender = true; });

  const playLight = parts.sound.group.userData.playLight;
  playLight.emissive.set(C.aqua);
  playLight.emissiveIntensity = 0;
  let chatDrawnAt = 0;
  let mapDrawnAt = 0;
  function tick(now) {
    const animating = updateTweens(now);
    const moved = controls.update();
    if (mode === 'kit' && now - mapDrawnAt > 200) {
      mapDrawnAt = now;
      drawMapReadout(radarState(now));
      needsRender = true;
    }
    if (mode === 'kit' && !reducedMotion && kaiReady && (focused === 'chat' || talk.index >= 0) && now - chatDrawnAt > 80) {
      chatDrawnAt = now;
      setChatCaption(chatCaption, now);
      needsRender = true;
    }
    if (listening) {
      playLight.emissiveIntensity = 0.35 + 0.35 * Math.sin(now / 160);
      needsRender = true;
    }
    if (pov.state === 'thrown' && pov.arc) {
      wrapper.position.y = pov.arc.y;
    }
    if (needsRender || animating || moved) {
      if (mode === 'pov') renderer.render(povScene, povCamera); else renderer.render(scene, camera);
      needsRender = false;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.getElementById('loading').hidden = true;
  window.__kitReady = true;
  if (location.hash === '#camera') setMode('camera');

  // Exposed for the next steps and for poking at in the console.
  window.kit = {
    THREE, scene, camera, renderer, controls, world, device, cam, parts, LABELS, reducedMotion, povScene, povCamera, pov,
    get mode() { return mode; }, setMode, radarState, RADAR_POINTS,
    setFocus, setApart, resetView, talk, toggleListen, stepSound, setDrawing, clearInk, get drawing() { return drawing; }, get soundIndex() { return soundIndex; }, selectForSwap, swapModules, requestRender: () => { needsRender = true; },
  };
}
