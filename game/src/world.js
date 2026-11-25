// Sizzle Line — the world: game state, kitchen stations, chef, orders.
// One job: own every mutable fact about a shift, and nothing else.

import { VIEW, SHIFT_SECONDS, MAX_HEARTS, CHEF, CRATES, STATIONS, TIMING, spawnInterval, orderPatience } from './config.js';
import { mulberry32, pickWeighted } from './random.js';
import { RECIPES, itemKey, matchRecipe } from './recipes.js';

export function createWorld(seed) {
  return {
    seed,
    rng: mulberry32(seed),
    // 'title' | 'playing' | 'over'
    mode: 'title',
    elapsed: 0,
    shiftLeft: SHIFT_SECONDS,
    coins: 0,
    served: 0,
    lost: 0,
    streak: 0,
    bestStreak: 0,
    hearts: MAX_HEARTS,
    frozen: false, // screenshot staging: render but never step
    flash: 0, // red flash timer after a lost order
    chef: {
      x: 400, y: 330, tx: null, ty: null,
      carrying: null, // an item {kind,state} or a plate {kind:'plate', items:[], dish:null}
      face: 1, // 1 right, -1 left
      walkPhase: 0,
      moving: false,
    },
    // Chopping board: one item being chopped.
    board: { item: null, progress: 0 },
    // Stove: two burners, each an independent slot.
    stove: {
      slots: [
        { item: null, progress: 0 },
        { item: null, progress: 0 },
      ],
    },
    // Assembly counter: the plate being built (items are item objects).
    assembly: { items: [] },
    orders: [], // {id, recipe, patience, patienceMax, born}
    spawnIn: 6,
    nextOrderId: 1,
    particles: [],
    floats: [],
    message: '',
    messageT: 0,
    // Results, filled when the shift ends.
    results: null,
    // Last interacted station (for the prompt line).
    near: null,
  };
}

// ---- helpers the other modules share ----

export function rectOfStation(kind, crateKind) {
  if (kind === 'crate') {
    const c = CRATES.find((x) => x.kind === crateKind);
    return c ? { x: c.x, y: c.y, w: c.w, h: c.h } : null;
  }
  const s = STATIONS[kind];
  return s ? { x: s.x, y: s.y, w: s.w, h: s.h } : null;
}

// All solid rectangles the chef cannot walk through.
export function solids() {
  const list = CRATES.map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
  for (const key of Object.keys(STATIONS)) {
    const s = STATIONS[key];
    list.push({ x: s.x, y: s.y, w: s.w, h: s.h });
  }
  return list;
}

// Distance from a point to a rectangle (0 when inside).
export function distToRect(x, y, r) {
  const cx = Math.max(r.x, Math.min(x, r.x + r.w));
  const cy = Math.max(r.y, Math.min(y, r.y + r.h));
  return Math.hypot(x - cx, y - cy);
}

// Which station is the chef standing next to? Returns
// { kind: 'crate'|'board'|'stove'|'assembly'|'window'|'trash', crate?: kind }
// or null.
export function nearestStation(world) {
  const { x, y } = world.chef;
  let best = null;
  let bestD = 52;
  for (const c of CRATES) {
    const d = distToRect(x, y, c);
    if (d < bestD) { bestD = d; best = { kind: 'crate', crate: c.kind, rect: c }; }
  }
  for (const key of ['board', 'stove', 'assembly', 'window', 'trash']) {
    const s = STATIONS[key];
    const d = distToRect(x, y, s);
    if (d < bestD) { bestD = d; best = { kind: key, rect: s }; }
  }
  return best;
}

// Spawn a new customer order.
export function spawnOrder(world) {
  const weights = RECIPES.map((r) => {
    // Early on, favour the easy salad; later the full menu.
    const w = world.elapsed < 30 ? (r.id === 'salad' ? 3 : r.id === 'pasta' ? 2 : 1) : 1;
    return [r, w];
  });
  const recipe = pickWeighted(world.rng, weights);
  const patience = orderPatience(world.elapsed);
  world.orders.push({
    id: world.nextOrderId++,
    recipe,
    patience,
    patienceMax: patience,
    born: world.elapsed,
  });
  world.spawnIn = spawnInterval(world.elapsed);
}

// Add a floating score text and a few particles at (x, y).
export function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color: color || '#fff6e5', life: 1.4, max: 1.4 });
}

export function addParticles(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = world.rng() * Math.PI * 2;
    const v = (speed || 60) * (0.4 + world.rng() * 0.8);
    world.particles.push({
      x, y,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30,
      life: 0.5 + world.rng() * 0.5, max: 1,
      color, size: 2 + world.rng() * 3,
    });
  }
}

export function setMessage(world, text) {
  world.message = text;
  world.messageT = 2.2;
}

// The plate the chef carries (or null).
export function carriedPlate(world) {
  const c = world.chef.carrying;
  return c && c.kind === 'plate' ? c : null;
}

// Does the assembly plate currently match a recipe? Returns the recipe or null.
export function assemblyDish(world) {
  if (world.assembly.items.length === 0) return null;
  const keys = world.assembly.items.map(itemKey);
  return matchRecipe(keys);
}
