// Sizzle Line — update: one step of the simulation. One job: move the chef,
// run the stations, age the orders, and score the shift.

import { VIEW, CHEF, CRATES, STATIONS, TIMING, SHIFT_SECONDS } from './config.js';
import {
  nearestStation, distToRect, solids, spawnOrder, addFloat, addParticles,
  setMessage, carriedPlate, assemblyDish,
} from './world.js';
import { INGREDIENTS, RECIPES, recipeById, itemKey, displayName, neededProcess, couldBecomeRecipe } from './recipes.js';
import { sfx } from './audio.js';

const WALK = { minX: 162, maxX: 944, minY: 92, maxY: 584 };

// Move the chef, resolving collisions against counters and crates.
function moveChef(world, dx, dy, dt) {
  const chef = world.chef;
  const list = solids();
  const r = CHEF.r;
  // X axis, then Y axis, so the chef slides along counters.
  let nx = chef.x + dx * dt;
  if (!hits(nx, chef.y, r, list)) chef.x = nx;
  let ny = chef.y + dy * dt;
  if (!hits(chef.x, ny, r, list)) chef.y = ny;
  chef.x = Math.max(WALK.minX, Math.min(WALK.maxX, chef.x));
  chef.y = Math.max(WALK.minY, Math.min(WALK.maxY, chef.y));
  if (dx !== 0 || dy !== 0) {
    chef.face = dx < 0 ? -1 : dx > 0 ? 1 : chef.face;
    chef.moving = true;
    chef.walkPhase += dt * 11;
  } else {
    chef.moving = false;
  }
}

function hits(x, y, r, list) {
  for (const s of list) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if (Math.hypot(x - cx, y - cy) < r) return true;
  }
  return false;
}

// The one thing the chef does at a station, on E / Space / click.
function doInteract(world, station) {
  const chef = world.chef;
  const hands = chef.carrying;

  if (station.kind === 'crate') {
    if (hands) { setMessage(world, 'Hands full — serve or trash something first.'); return; }
    const def = INGREDIENTS[station.crate];
    chef.carrying = { kind: station.crate, state: def.process === 'ready' ? 'ready' : 'raw' };
    sfx.pickup();
    return;
  }

  if (station.kind === 'board') {
    const b = world.board;
    if (!b.item) {
      if (!hands) { setMessage(world, 'Bring something to chop.'); return; }
      if (hands.kind === 'plate') { setMessage(world, 'Plates do not get chopped.'); return; }
      if (neededProcess(hands) !== 'chop') { setMessage(world, `${displayName(hands)} never needs chopping.`); return; }
      b.item = hands;
      b.progress = 0;
      chef.carrying = null;
      sfx.place();
      return;
    }
    if (b.progress >= 1) {
      if (hands) { setMessage(world, 'Hands full — take it another time.'); return; }
      chef.carrying = b.item;
      world.board = { item: null, progress: 0 };
      sfx.pickup();
      return;
    }
    setMessage(world, 'Hold E to chop it.');
    return;
  }

  if (station.kind === 'stove') {
    // Use the burner the chef is closest to (left burner first on a tie).
    const stove = STATIONS.stove;
    const d0 = Math.hypot(chef.x - stove.burners[0].x, chef.y - stove.burners[0].y);
    const d1 = Math.hypot(chef.x - stove.burners[1].x, chef.y - stove.burners[1].y);
    const slot = world.stove.slots[d0 <= d1 ? 0 : 1];
    if (!slot.item) {
      if (!hands) { setMessage(world, 'Bring something to cook.'); return; }
      if (hands.kind === 'plate') { setMessage(world, 'Plates do not go on the stove.'); return; }
      if (neededProcess(hands) !== 'cook') { setMessage(world, `${displayName(hands)} never needs the stove.`); return; }
      slot.item = hands;
      slot.progress = 0;
      chef.carrying = null;
      sfx.place();
      sfx.sizzleStart();
      return;
    }
    if (slot.item.state === 'cooked' || slot.item.state === 'burnt') {
      if (hands) { setMessage(world, 'Hands full — take it another time.'); return; }
      chef.carrying = slot.item;
      slot.item = null;
      slot.progress = 0;
      sfx.pickup();
      return;
    }
    setMessage(world, 'Still cooking — wait for the ring to fill.');
    return;
  }

  if (station.kind === 'assembly') {
    if (hands && hands.kind === 'plate') {
      if (world.assembly.items.length > 0) { setMessage(world, 'The counter is busy — serve that plate first.'); return; }
      world.assembly.items = hands.items;
      chef.carrying = null;
      sfx.place();
      return;
    }
    if (hands) {
      if (world.assembly.items.length >= 4) { setMessage(world, 'The plate is full.'); return; }
      const trial = [...world.assembly.items.map(itemKey), itemKey(hands)];
      if (!couldBecomeRecipe(trial)) { setMessage(world, 'No recipe uses that here.'); return; }
      world.assembly.items.push(hands);
      chef.carrying = null;
      sfx.place();
      const dish = assemblyDish(world);
      if (dish) {
        setMessage(world, `${dish.name} is ready — serve it!`);
        addFloat(world, STATIONS.assembly.x + 112, STATIONS.assembly.y - 8, `${dish.name} ready!`, '#f2b705');
        sfx.ding();
      }
      return;
    }
    // Empty hands: take the plate (and everything on it).
    if (world.assembly.items.length === 0) { setMessage(world, 'Add ingredients to build a dish.'); return; }
    chef.carrying = { kind: 'plate', items: world.assembly.items, dish: assemblyDish(world) };
    world.assembly.items = [];
    sfx.pickup();
    return;
  }

  if (station.kind === 'window') {
    const plate = carriedPlate(world);
    if (!plate) {
      setMessage(world, hands ? 'Only a finished dish goes out the window.' : 'Bring a finished dish here to serve it.');
      return;
    }
    if (!plate.dish) { setMessage(world, 'Finish the dish first — check the recipe.'); return; }
    const order = world.orders.find((o) => o.recipe.id === plate.dish.id);
    if (!order) { setMessage(world, `No order for ${plate.dish.name} right now.`); return; }
    serveOrder(world, order, plate.dish);
    chef.carrying = null;
    return;
  }

  if (station.kind === 'trash') {
    if (!hands) { setMessage(world, 'Nothing to throw away.'); return; }
    chef.carrying = null;
    addParticles(world, STATIONS.trash.x + 46, STATIONS.trash.y + 20, '#9aa0a6', 10, 50);
    sfx.trash();
    return;
  }
}

function serveOrder(world, order, dish) {
  const tip = Math.round(dish.coins * 0.5 * (order.patience / order.patienceMax));
  const streakBonus = Math.min(world.streak, 5);
  const earned = dish.coins + tip + streakBonus;
  world.coins += earned;
  world.served += 1;
  world.streak += 1;
  world.bestStreak = Math.max(world.bestStreak, world.streak);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  const wx = STATIONS.window.x + 112;
  const wy = STATIONS.window.y + 30;
  addFloat(world, wx, wy - 14, `+$${earned}`, '#f2b705');
  if (tip > 0) addFloat(world, wx, wy + 8, `Tip +$${tip}`, '#8fd694');
  addParticles(world, wx, wy, '#f2b705', 16, 90);
  sfx.serve();
  if (world.streak >= 3) setMessage(world, `${world.streak} in a row — the kitchen is on fire!`);
}

function endShift(world, reason) {
  world.mode = 'over';
  world.results = {
    reason,
    coins: world.coins,
    served: world.served,
    lost: world.lost,
    bestStreak: world.bestStreak,
  };
  sfx.gameover();
}

export function step(world, input, dt) {
  dt = Math.min(dt, 0.05);

  // Title screen: Enter or click starts the shift.
  if (world.mode === 'title') {
    if (input.pressedEnter || input.mouse.clicked) {
      world.mode = 'playing';
      world.spawnIn = 2;
      spawnOrder(world);
      spawnOrder(world);
      sfx.start();
    }
    return;
  }

  // Results screen: Enter asks the shell to start a fresh shift.
  if (world.mode === 'over') {
    if (input.pressedEnter) world.restartRequested = true;
    return;
  }

  if (world.paused) {
    if (input.pressedP) world.paused = false;
    return;
  }
  if (input.pressedP) { world.paused = true; return; }

  const chef = world.chef;

  // --- click to walk (and auto-use a clicked station on arrival) ---
  if (input.mouse.clicked) {
    const cx = input.mouse.clickX;
    const cy = input.mouse.clickY;
    chef.tx = Math.max(WALK.minX, Math.min(WALK.maxX, cx));
    chef.ty = Math.max(WALK.minY, Math.min(WALK.maxY, cy));
    chef.pendingStation = null;
    // Did the click land on a station? Walk there and use it.
    for (const c of CRATES) {
      if (cx >= c.x - 14 && cx <= c.x + c.w + 14 && cy >= c.y - 14 && cy <= c.y + c.h + 14) {
        chef.pendingStation = { kind: 'crate', crate: c.kind };
      }
    }
    for (const key of ['board', 'stove', 'assembly', 'window', 'trash']) {
      const s = STATIONS[key];
      if (cx >= s.x - 14 && cx <= s.x + s.w + 14 && cy >= s.y - 14 && cy <= s.y + s.h + 14) {
        chef.pendingStation = { kind: key };
      }
    }
  }

  // --- movement: keys, or walk toward the click target ---
  let dx = 0;
  let dy = 0;
  if (input.keys.has('left')) dx -= 1;
  if (input.keys.has('right')) dx += 1;
  if (input.keys.has('up')) dy -= 1;
  if (input.keys.has('down')) dy += 1;
  if (dx === 0 && dy === 0 && chef.tx !== null && chef.ty !== null) {
    const ddx = chef.tx - chef.x;
    const ddy = chef.ty - chef.y;
    const dist = Math.hypot(ddx, ddy);
    if (dist < 7) {
      chef.tx = null;
      chef.ty = null;
    } else {
      dx = ddx / dist;
      dy = ddy / dist;
    }
  }
  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy) || 1;
    moveChef(world, (dx / len) * CHEF.speed, (dy / len) * CHEF.speed, dt);
  } else {
    chef.moving = false;
  }

  // Arrived at a clicked station: use it.
  world.near = nearestStation(world);
  if (chef.pendingStation && world.near
    && world.near.kind === chef.pendingStation.kind
    && (chef.pendingStation.kind !== 'crate' || world.near.crate === chef.pendingStation.crate)) {
    doInteract(world, chef.pendingStation);
    chef.pendingStation = null;
    chef.tx = null;
    chef.ty = null;
  }

  // --- E / Space: use the station next to you ---
  if (input.pressedE && world.near) doInteract(world, world.near);

  // --- Q: take the last item back off the assembly plate ---
  if (input.pressedQ && world.near && world.near.kind === 'assembly'
    && !chef.carrying && world.assembly.items.length > 0) {
    chef.carrying = world.assembly.items.pop();
    sfx.pickup();
  }

  // --- hold E at the chopping board: chop ---
  if (input.keys.has('interact') && world.near && world.near.kind === 'board'
    && world.board.item && world.board.progress < 1) {
    world.board.progress += dt / TIMING.chop;
    if (world.rng() < dt * 22) {
      addParticles(world, STATIONS.board.x + 75, STATIONS.board.y + 48, '#e8b04b', 2, 70);
    }
    if (world.board.progress >= 1) {
      world.board.progress = 1;
      world.board.item.state = 'chopped';
      setMessage(world, `Chopped ${INGREDIENTS[world.board.item.kind].name}!`);
      sfx.chop();
    }
  }

  // --- stove: cook, then burn if forgotten ---
  for (const slot of world.stove.slots) {
    if (!slot.item) continue;
    if (slot.item.state === 'raw') {
      slot.progress += dt / TIMING.cook;
      if (world.rng() < dt * 6) {
        addParticles(world, STATIONS.stove.x + 75, STATIONS.stove.y + 20, '#cfd8dc', 1, 20);
      }
      if (slot.progress >= 1) {
        slot.item.state = 'cooked';
        slot.progress = 1;
        sfx.ding();
      }
    } else if (slot.item.state === 'cooked') {
      slot.progress += dt / TIMING.burnAfter;
      if (slot.progress >= 2) {
        slot.item.state = 'burnt';
        slot.progress = 2;
        setMessage(world, 'Something burned! Trash it.');
        sfx.burn();
      }
    }
  }

  // --- orders: patience, expiry, spawning ---
  world.elapsed += dt;
  world.shiftLeft -= dt;
  for (const o of world.orders) o.patience -= dt;
  const expired = world.orders.find((o) => o.patience <= 0);
  if (expired) {
    world.orders = world.orders.filter((o) => o.id !== expired.id);
    world.hearts -= 1;
    world.lost += 1;
    world.streak = 0;
    world.flash = 0.6;
    setMessage(world, 'Order lost — a customer walked out!');
    sfx.lose();
  }
  world.spawnIn -= dt;
  if (world.spawnIn <= 0 && world.orders.length < 4) spawnOrder(world);

  // --- particles, floats, message, flash ---
  for (const p of world.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 60 * dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floats) {
    f.life -= dt;
    f.y -= 26 * dt;
  }
  world.floats = world.floats.filter((f) => f.life > 0);
  if (world.messageT > 0) world.messageT -= dt;
  if (world.flash > 0) world.flash -= dt;

  // --- shift end ---
  if (world.shiftLeft <= 0) endShift(world, 'time');
  else if (world.hearts <= 0) endShift(world, 'hearts');
}
