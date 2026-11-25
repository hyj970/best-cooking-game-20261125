// Sizzle Line — configuration: canvas size, palette, kitchen layout, timings.
// One job: every number the rest of the game reads, in one place.

export const VIEW = { w: 960, h: 600 };

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;

export const CHEF = { r: 16, speed: 235 };

// Warm kitchen palette: terracotta walls, cream counters, teal apron accents.
export const COLORS = {
  floorA: '#d9a066',
  floorB: '#cf955c',
  wall: '#8a4b2d',
  wallTrim: '#6e3a22',
  counter: '#f3e2c7',
  counterEdge: '#b98d5f',
  board: '#e8b04b',
  stove: '#3d4451',
  stoveTop: '#565e6e',
  window: '#7fb3a3',
  trash: '#6b7280',
  ink: '#2b2118',
  cream: '#fff6e5',
  teal: '#2f7d6d',
  red: '#d64541',
  gold: '#f2b705',
  green: '#4c9a4a',
};

// Ingredient crates along the left wall (x 8..150). Each crate is one
// ingredient; the chef takes from it with E when standing next to it.
export const CRATES = [
  { kind: 'tomato', x: 10, y: 84, w: 136, h: 62 },
  { kind: 'lettuce', x: 10, y: 154, w: 136, h: 62 },
  { kind: 'onion', x: 10, y: 224, w: 136, h: 62 },
  { kind: 'mushroom', x: 10, y: 294, w: 136, h: 62 },
  { kind: 'patty', x: 10, y: 364, w: 136, h: 62 },
  { kind: 'pasta', x: 10, y: 434, w: 136, h: 62 },
  { kind: 'bun', x: 10, y: 504, w: 136, h: 62 },
];

// Stations. Each is a rectangle the chef cannot walk through, plus an
// interaction radius. The stove has two burners (two independent slots).
export const STATIONS = {
  board: { x: 636, y: 92, w: 150, h: 96, label: 'Chopping Board' },
  stove: {
    x: 636, y: 208, w: 150, h: 104, label: 'Stove',
    burners: [
      { x: 668, y: 236, r: 26 },
      { x: 754, y: 236, r: 26 },
    ],
  },
  assembly: { x: 636, y: 332, w: 224, h: 104, label: 'Assembly Counter' },
  window: { x: 636, y: 456, w: 224, h: 96, label: 'Serving Window' },
  // Bottom-centre, clear of the crates: standing here must never be
  // mistaken for standing at the bun crate.
  trash: { x: 300, y: 520, w: 92, h: 64, label: 'Trash' },
};

// How long each process takes (seconds).
export const TIMING = {
  chop: 1.6,
  cook: 4.0,
  burnAfter: 4.0, // seconds past done before the item burns
};

// Order pacing: spawn interval and patience shrink as the shift goes on.
export function spawnInterval(elapsed) {
  return Math.max(7, 13 - elapsed * 0.02);
}
export function orderPatience(elapsed) {
  return Math.max(26, 46 - elapsed * 0.06);
}
