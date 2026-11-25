// Sizzle Line — render: every pixel the player sees. One job: draw the
// kitchen, the chef, the orders and the overlays from the world state.
// All art is drawn with canvas shapes; no image or font files are loaded.

import { VIEW, COLORS, CRATES, STATIONS, SHIFT_SECONDS } from './config.js';
import { INGREDIENTS, RECIPES, recipeById, displayName, neededProcess } from './recipes.js';
import { assemblyDish } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, s, x, y, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

// ---- ingredient icons (drawn, never emoji) ----

export function drawIngredient(ctx, kind, state, x, y, r) {
  const def = INGREDIENTS[kind];
  if (!def) return;
  ctx.save();
  if (state === 'burnt') {
    circle(ctx, x, y, r);
    ctx.fillStyle = '#241f1c';
    ctx.fill();
    ctx.fillStyle = '#5a5148';
    circle(ctx, x - r * 0.3, y - r * 0.25, r * 0.22); ctx.fill();
    circle(ctx, x + r * 0.3, y + r * 0.2, r * 0.18); ctx.fill();
    ctx.restore();
    return;
  }
  const scale = state === 'chopped' ? 0.72 : 1;
  const rr2 = r * scale;
  if (kind === 'tomato') {
    circle(ctx, x, y, rr2); ctx.fillStyle = def.color; ctx.fill();
    circle(ctx, x, y + rr2 * 0.45, rr2 * 0.7); ctx.fillStyle = def.dark; ctx.fill();
    ctx.fillStyle = '#4c9a4a';
    ctx.beginPath();
    ctx.moveTo(x, y - rr2 * 0.9);
    ctx.lineTo(x - rr2 * 0.45, y - rr2 * 0.35);
    ctx.lineTo(x + rr2 * 0.45, y - rr2 * 0.35);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'lettuce') {
    circle(ctx, x, y, rr2); ctx.fillStyle = def.color; ctx.fill();
    circle(ctx, x - rr2 * 0.35, y - rr2 * 0.3, rr2 * 0.45); ctx.fillStyle = '#8fd694'; ctx.fill();
    circle(ctx, x + rr2 * 0.35, y + rr2 * 0.25, rr2 * 0.4); ctx.fillStyle = '#8fd694'; ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - rr2 * 0.5, y); ctx.quadraticCurveTo(x, y - rr2 * 0.4, x + rr2 * 0.5, y); ctx.stroke();
  } else if (kind === 'onion') {
    circle(ctx, x, y, rr2); ctx.fillStyle = def.color; ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 1.5;
    circle(ctx, x, y, rr2 * 0.62); ctx.stroke();
    circle(ctx, x, y, rr2 * 0.3); ctx.stroke();
  } else if (kind === 'mushroom') {
    ctx.fillStyle = '#f5efe0';
    rr(ctx, x - rr2 * 0.3, y - rr2 * 0.1, rr2 * 0.6, rr2 * 0.9, 3); ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y - rr2 * 0.1, rr2 * 0.95, Math.PI, 0);
    ctx.closePath(); ctx.fillStyle = def.color; ctx.fill();
    ctx.fillStyle = '#fff';
    circle(ctx, x - rr2 * 0.4, y - rr2 * 0.45, rr2 * 0.16); ctx.fill();
    circle(ctx, x + rr2 * 0.35, y - rr2 * 0.55, rr2 * 0.13); ctx.fill();
  } else if (kind === 'patty') {
    rr(ctx, x - rr2, y - rr2 * 0.55, rr2 * 2, rr2 * 1.1, rr2 * 0.5);
    ctx.fillStyle = def.color; ctx.fill();
    ctx.fillStyle = def.dark;
    circle(ctx, x - rr2 * 0.4, y, rr2 * 0.12); ctx.fill();
    circle(ctx, x + rr2 * 0.3, y - rr2 * 0.15, rr2 * 0.12); ctx.fill();
  } else if (kind === 'pasta') {
    circle(ctx, x, y, rr2); ctx.fillStyle = def.color; ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, rr2 * 0.6, 0.3, 2.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, rr2 * 0.3, 2.8, 5.2); ctx.stroke();
  } else if (kind === 'bun') {
    ctx.beginPath();
    ctx.arc(x, y + rr2 * 0.25, rr2, Math.PI, 0);
    ctx.closePath(); ctx.fillStyle = def.color; ctx.fill();
    rr(ctx, x - rr2, y + rr2 * 0.2, rr2 * 2, rr2 * 0.35, 4); ctx.fillStyle = def.dark; ctx.fill();
    ctx.fillStyle = '#fff6e5';
    circle(ctx, x - rr2 * 0.4, y - rr2 * 0.4, rr2 * 0.09); ctx.fill();
    circle(ctx, x + rr2 * 0.1, y - rr2 * 0.55, rr2 * 0.09); ctx.fill();
    circle(ctx, x + rr2 * 0.5, y - rr2 * 0.3, rr2 * 0.09); ctx.fill();
  }
  if (state === 'chopped') {
    // Three little cubes beside the icon read as "chopped pieces".
    ctx.fillStyle = def.dark;
    const s = r * 0.22;
    ctx.fillRect(x + r * 0.55, y - s, s, s);
    ctx.fillRect(x + r * 0.75, y + r * 0.1, s, s);
    ctx.fillRect(x + r * 0.45, y + r * 0.35, s, s);
  }
  if (state === 'cooked') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.3, y - r * 1.15); ctx.quadraticCurveTo(x - r * 0.45, y - r * 1.45, x - r * 0.3, y - r * 1.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + r * 0.3, y - r * 1.15); ctx.quadraticCurveTo(x + r * 0.45, y - r * 1.45, x + r * 0.3, y - r * 1.7); ctx.stroke();
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#c9c2b4';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#e3ddd0';
  ctx.stroke();
}

// A heart shape for the lives display.
function drawHeart(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-8, -2, -5, -8, 0, -3);
  ctx.bezierCurveTo(5, -8, 8, -2, 0, 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ---- the prompt line: what E does right here ----

function promptFor(world) {
  const near = world.near;
  if (!near || world.mode !== 'playing') return null;
  const hands = world.chef.carrying;
  if (near.kind === 'crate') {
    return hands ? null : `E · Take ${INGREDIENTS[near.crate].name}`;
  }
  if (near.kind === 'board') {
    if (!world.board.item) return hands && neededProcess(hands) === 'chop' ? 'E · Place to chop' : null;
    if (world.board.progress >= 1) return hands ? null : 'E · Take chopped';
    return 'Hold E · Chop';
  }
  if (near.kind === 'stove') {
    const slots = world.stove.slots;
    const done = slots.find((s) => s.item && (s.item.state === 'cooked' || s.item.state === 'burnt'));
    if (done) return hands ? null : `E · Take ${displayName(done.item)}`;
    if (slots.some((s) => !s.item)) return hands && neededProcess(hands) === 'cook' ? 'E · Put on stove' : null;
    return null;
  }
  if (near.kind === 'assembly') {
    if (hands && hands.kind !== 'plate') return 'E · Add to plate';
    if (hands && hands.kind === 'plate') return world.assembly.items.length ? null : 'E · Set plate down';
    if (world.assembly.items.length) {
      const dish = assemblyDish(world);
      return dish ? `E · Take ${dish.name}` : 'E · Take plate  (Q · take back)';
    }
    return null;
  }
  if (near.kind === 'window') {
    const plate = hands && hands.kind === 'plate' ? hands : null;
    if (plate && plate.dish) return `E · Serve ${plate.dish.name}`;
    return null;
  }
  if (near.kind === 'trash') return hands ? 'E · Throw away' : null;
  return null;
}

// ---- main draw ----

export function draw(ctx, world) {
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);

  // Floor: warm checker tiles.
  for (let ty = 0; ty < 13; ty++) {
    for (let tx = 0; tx < 20; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(tx * 48, 70 + ty * 48, 48, 48);
    }
  }
  // Wall trim under the order bar.
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 70, VIEW.w, 6);

  drawCrates(ctx);
  drawStations(ctx, world);
  drawOrdersBar(ctx, world);
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawFloats(ctx, world);
  drawHud(ctx, world);
  drawPrompt(ctx, world);
  drawToast(ctx, world);

  if (world.flash > 0) {
    ctx.fillStyle = `rgba(214,69,65,${(world.flash * 0.28).toFixed(3)})`;
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  }
  if (world.mode === 'title') drawTitle(ctx, world);
  if (world.mode === 'over') drawGameOver(ctx, world);
  if (world.paused) {
    ctx.fillStyle = 'rgba(20,12,6,0.55)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    text(ctx, 'Paused', VIEW.w / 2, VIEW.h / 2 - 10, 'bold 44px system-ui, sans-serif', '#fff6e5', 'center');
    text(ctx, 'Press P to keep cooking', VIEW.w / 2, VIEW.h / 2 + 34, '18px system-ui, sans-serif', '#ffd9a0', 'center');
  }
}

function drawCrates(ctx) {
  for (const c of CRATES) {
    const def = INGREDIENTS[c.kind];
    rr(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fillStyle = '#a9713f';
    ctx.fill();
    ctx.strokeStyle = '#7d4f27';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(125,79,39,0.5)';
    ctx.beginPath();
    ctx.moveTo(c.x + 6, c.y + 6); ctx.lineTo(c.x + c.w - 6, c.y + c.h - 6);
    ctx.moveTo(c.x + c.w - 6, c.y + 6); ctx.lineTo(c.x + 6, c.y + c.h - 6);
    ctx.stroke();
    drawIngredient(ctx, c.kind, def.process === 'ready' ? 'ready' : 'raw', c.x + 30, c.y + c.h / 2, 17);
    text(ctx, def.name, c.x + 56, c.y + c.h / 2 - 8, 'bold 14px system-ui, sans-serif', '#fff6e5');
    text(ctx, def.process === 'chop' ? 'chop it' : def.process === 'cook' ? 'cook it' : 'ready', c.x + 56, c.y + c.h / 2 + 11, '12px system-ui, sans-serif', '#ffd9a0');
  }
}

function drawStations(ctx, world) {
  // Chopping board.
  const b = STATIONS.board;
  rr(ctx, b.x, b.y, b.w, b.h, 10);
  ctx.fillStyle = COLORS.board;
  ctx.fill();
  ctx.strokeStyle = COLORS.counterEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'CHOPPING', b.x + b.w / 2, b.y + 14, 'bold 11px system-ui, sans-serif', '#7d4f27', 'center');
  // Knife.
  ctx.save();
  ctx.translate(b.x + b.w - 26, b.y + 22);
  ctx.rotate(-0.5);
  ctx.fillStyle = '#d7dde3';
  ctx.fillRect(0, -3, 26, 6);
  ctx.fillStyle = '#5b4636';
  ctx.fillRect(-10, -3, 10, 6);
  ctx.restore();
  if (world.board.item) {
    drawIngredient(ctx, world.board.item.kind, world.board.item.state, b.x + 62, b.y + 58, 24);
    // Chop progress bar.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, b.x + 18, b.y + b.h - 18, b.w - 36, 9, 4); ctx.fill();
    ctx.fillStyle = '#2f7d6d';
    rr(ctx, b.x + 18, b.y + b.h - 18, (b.w - 36) * world.board.progress, 9, 4); ctx.fill();
  }

  // Stove with two burners.
  const s = STATIONS.stove;
  rr(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fillStyle = COLORS.stove;
  ctx.fill();
  ctx.strokeStyle = '#22262e';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'STOVE', s.x + s.w / 2, s.y + 14, 'bold 11px system-ui, sans-serif', '#cfd8dc', 'center');
  world.stove.slots.forEach((slot, i) => {
    const burn = s.burners[i];
    circle(ctx, burn.x, burn.y + 14, burn.r);
    ctx.fillStyle = COLORS.stoveTop;
    ctx.fill();
    ctx.strokeStyle = '#22262e';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (slot.item) {
      drawIngredient(ctx, slot.item.kind, slot.item.state, burn.x, burn.y + 14, 17);
      // Progress ring: orange while cooking, green when done, red while burning.
      const frac = slot.item.state === 'raw' ? slot.progress
        : slot.item.state === 'cooked' ? Math.max(0, slot.progress - 1) : 1;
      const col = slot.item.state === 'raw' ? '#f2b705'
        : slot.item.state === 'cooked' ? (slot.progress > 1.15 ? '#d64541' : '#4c9a4a') : '#d64541';
      ctx.beginPath();
      ctx.arc(burn.x, burn.y + 14, burn.r + 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, frac));
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      ctx.stroke();
      if (slot.item.state === 'burnt') {
        text(ctx, 'BURNT!', burn.x, burn.y + 44, 'bold 10px system-ui, sans-serif', '#ffb3b0', 'center');
      }
    }
  });

  // Assembly counter.
  const a = STATIONS.assembly;
  rr(ctx, a.x, a.y, a.w, a.h, 10);
  ctx.fillStyle = COLORS.counter;
  ctx.fill();
  ctx.strokeStyle = COLORS.counterEdge;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ASSEMBLY', a.x + a.w / 2, a.y + 14, 'bold 11px system-ui, sans-serif', '#7d4f27', 'center');
  const dish = assemblyDish(world);
  if (world.assembly.items.length > 0) {
    drawPlate(ctx, a.x + 78, a.y + 62, 52, 20);
    world.assembly.items.forEach((item, i) => {
      drawIngredient(ctx, item.kind, item.state, a.x + 48 + i * 26, a.y + 58, 11);
    });
    if (dish) {
      ctx.fillStyle = 'rgba(242,183,5,0.25)';
      rr(ctx, a.x + 8, a.y + 8, a.w - 16, a.h - 16, 8); ctx.fill();
      text(ctx, `${dish.name} ready!`, a.x + a.w - 12, a.y + 62, 'bold 13px system-ui, sans-serif', '#7d5a00', 'right');
    }
  } else {
    text(ctx, 'Build a dish here', a.x + a.w / 2, a.y + 58, '13px system-ui, sans-serif', '#a08c68', 'center');
  }

  // Serving window.
  const w = STATIONS.window;
  rr(ctx, w.x, w.y, w.w, w.h, 10);
  ctx.fillStyle = COLORS.window;
  ctx.fill();
  ctx.strokeStyle = '#4a7a6e';
  ctx.lineWidth = 2;
  ctx.stroke();
  rr(ctx, w.x + 14, w.y + 26, w.w - 28, 44, 6);
  ctx.fillStyle = '#2b3a35';
  ctx.fill();
  text(ctx, 'SERVE', w.x + w.w / 2, w.y + 48, 'bold 15px system-ui, sans-serif', '#fff6e5', 'center');
  // Heat lamps.
  ctx.fillStyle = 'rgba(242,183,5,0.85)';
  circle(ctx, w.x + 50, w.y + 16, 4); ctx.fill();
  circle(ctx, w.x + w.w / 2, w.y + 16, 4); ctx.fill();
  circle(ctx, w.x + w.w - 50, w.y + 16, 4); ctx.fill();

  // Trash.
  const t = STATIONS.trash;
  rr(ctx, t.x, t.y, t.w, t.h, 8);
  ctx.fillStyle = COLORS.trash;
  ctx.fill();
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'TRASH', t.x + t.w / 2, t.y + t.h / 2, 'bold 12px system-ui, sans-serif', '#e5e7eb', 'center');
}

function drawOrdersBar(ctx, world) {
  // Top bar.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.w, 70);
  text(ctx, 'SIZZLE', 14, 22, 'bold 22px system-ui, sans-serif', '#fff6e5');
  text(ctx, 'LINE', 14, 46, 'bold 22px system-ui, sans-serif', '#f2b705');
  text(ctx, 'ORDERS', 168, 14, 'bold 10px system-ui, sans-serif', '#ffd9a0');

  world.orders.forEach((o, i) => {
    const x = 168 + i * 158;
    const y = 8;
    const w = 150;
    const h = 54;
    const urgent = o.patience < 10;
    rr(ctx, x, y, w, h, 8);
    ctx.fillStyle = urgent && Math.floor(world.elapsed * 4) % 2 === 0 ? '#fbe3e3' : '#fff6e5';
    ctx.fill();
    ctx.strokeStyle = urgent ? '#d64541' : '#d8c49a';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, o.recipe.name, x + 10, y + 13, 'bold 13px system-ui, sans-serif', COLORS.ink);
    text(ctx, `$${o.recipe.coins}`, x + w - 10, y + 13, 'bold 13px system-ui, sans-serif', '#7d5a00', 'right');
    o.recipe.needs.forEach((need, j) => {
      const [kind, state] = need.split(':');
      drawIngredient(ctx, kind, state, x + 20 + j * 26, y + 34, 10);
    });
    // Patience bar.
    const frac = Math.max(0, o.patience / o.patienceMax);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    rr(ctx, x + 10, y + h - 10, w - 20, 5, 2); ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#4c9a4a' : frac > 0.25 ? '#f2b705' : '#d64541';
    rr(ctx, x + 10, y + h - 10, (w - 20) * frac, 5, 2); ctx.fill();
  });
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(chef.walkPhase) * 2 : 0;
  const x = chef.x;
  const y = chef.y + bob;
  // Shadow.
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 20, 18, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  // Body (apron).
  rr(ctx, x - 14, y - 2, 28, 24, 9);
  ctx.fillStyle = COLORS.teal;
  ctx.fill();
  ctx.fillStyle = '#fff6e5';
  ctx.fillRect(x - 14, y + 8, 28, 4);
  // Head.
  circle(ctx, x, y - 12, 13);
  ctx.fillStyle = '#f2c9a0';
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  rr(ctx, x - 13, y - 32, 26, 12, 5); ctx.fill();
  circle(ctx, x - 8, y - 30, 6); ctx.fill();
  circle(ctx, x, y - 33, 7); ctx.fill();
  circle(ctx, x + 8, y - 30, 6); ctx.fill();
  // Face.
  ctx.fillStyle = COLORS.ink;
  const look = chef.face * 2;
  circle(ctx, x - 5 + look, y - 13, 1.8); ctx.fill();
  circle(ctx, x + 5 + look, y - 13, 1.8); ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + look, y - 9, 4, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried item in a bubble above the hat.
  if (chef.carrying) {
    const c = chef.carrying;
    circle(ctx, x, y - 48, 17);
    ctx.fillStyle = '#fff6e5';
    ctx.fill();
    ctx.strokeStyle = '#d8c49a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (c.kind === 'plate') {
      drawPlate(ctx, x, y - 48, 12, 5);
      if (c.dish) {
        text(ctx, c.dish.name, x, y - 68, 'bold 11px system-ui, sans-serif', '#7d5a00', 'center');
      } else {
        c.items.forEach((item, i) => {
          drawIngredient(ctx, item.kind, item.state, x - 10 + i * 10, y - 48, 5);
        });
      }
    } else {
      drawIngredient(ctx, c.kind, c.state, x, y - 48, 12);
    }
  }
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.fillStyle = p.color;
    circle(ctx, p.x, p.y, p.size);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFloats(ctx, world) {
  for (const f of world.floats) {
    ctx.globalAlpha = Math.max(0, f.life / f.max);
    text(ctx, f.text, f.x, f.y, 'bold 16px system-ui, sans-serif', f.color, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, world) {
  const t = Math.max(0, Math.ceil(world.shiftLeft));
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  const urgent = t <= 15;
  text(ctx, `${mm}:${ss}`, 838, 22, `bold 24px system-ui, sans-serif`, urgent ? '#ff9d9a' : '#fff6e5', 'center');
  text(ctx, `$${world.coins}  ·  ${world.served} served`, 838, 50, 'bold 13px system-ui, sans-serif', '#ffd9a0', 'center');
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 908 + i * 18, 20, 1, i < world.hearts ? '#e5484d' : 'rgba(255,255,255,0.25)');
  }
  if (world.streak >= 2) {
    text(ctx, `STREAK x${world.streak}`, 950, 50, 'bold 12px system-ui, sans-serif', '#f2b705', 'right');
  }
  // Shift progress bar under the top bar.
  const frac = 1 - world.shiftLeft / SHIFT_SECONDS;
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, 70, VIEW.w, 4);
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(0, 70, VIEW.w * frac, 4);
}

function drawPrompt(ctx, world) {
  const p = promptFor(world);
  if (!p) return;
  const x = world.chef.x;
  const y = world.chef.y - 78;
  ctx.font = 'bold 13px system-ui, sans-serif';
  const w = ctx.measureText(p).width + 20;
  rr(ctx, x - w / 2, y - 12, w, 24, 12);
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fill();
  text(ctx, p, x, y, 'bold 13px system-ui, sans-serif', '#fff6e5', 'center');
}

function drawToast(ctx, world) {
  if (world.messageT <= 0 || !world.message) return;
  ctx.font = 'bold 14px system-ui, sans-serif';
  const w = ctx.measureText(world.message).width + 28;
  const x = VIEW.w / 2 - w / 2;
  const y = 84;
  ctx.globalAlpha = Math.min(1, world.messageT);
  rr(ctx, x, y, w, 28, 14);
  ctx.fillStyle = 'rgba(20,12,6,0.85)';
  ctx.fill();
  text(ctx, world.message, VIEW.w / 2, y + 14, 'bold 14px system-ui, sans-serif', '#fff6e5', 'center');
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20,12,6,0.62)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, 'SIZZLE LINE', VIEW.w / 2, 150, 'bold 64px system-ui, sans-serif', '#fff6e5', 'center');
  text(ctx, 'A short-order kitchen rush', VIEW.w / 2, 196, '22px system-ui, sans-serif', '#f2b705', 'center');
  const lines = [
    'Customers order. You cook. Nobody waits forever.',
    '',
    'WASD / arrows — walk    E — use a station (hold E to chop)',
    'Click — walk there    Q — take an item back off the plate',
    'Take ingredients, chop or cook them, build the dish, serve it hot.',
    'Burnt food goes in the trash. Lost orders cost a heart.',
    '',
    'Recipes:  Garden Salad  ·  Tomato Pasta  ·  Classic Burger  ·  Forest Toast',
  ];
  lines.forEach((line, i) => {
    text(ctx, line, VIEW.w / 2, 250 + i * 26, line === '' ? '16px system-ui, sans-serif' : '16px system-ui, sans-serif', '#fff6e5', 'center');
  });
  const pulse = 0.65 + 0.35 * Math.sin(world.elapsed * 4 + 2);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press Enter or click to start the shift', VIEW.w / 2, 480, 'bold 20px system-ui, sans-serif', '#f2b705', 'center');
  ctx.globalAlpha = 1;
}

function drawGameOver(ctx, world) {
  const r = world.results || { coins: 0, served: 0, lost: 0, bestStreak: 0, reason: 'time' };
  ctx.fillStyle = 'rgba(20,12,6,0.66)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, r.reason === 'hearts' ? 'The customers walked out!' : 'Shift over!', VIEW.w / 2, 140, 'bold 52px system-ui, sans-serif', '#fff6e5', 'center');
  text(ctx, `You earned $${r.coins}`, VIEW.w / 2, 210, 'bold 30px system-ui, sans-serif', '#f2b705', 'center');
  const lines = [
    `Dishes served: ${r.served}`,
    `Orders lost: ${r.lost}`,
    `Best streak: ${r.bestStreak}`,
  ];
  lines.forEach((line, i) => {
    text(ctx, line, VIEW.w / 2, 260 + i * 30, '20px system-ui, sans-serif', '#fff6e5', 'center');
  });
  const pulse = 0.65 + 0.35 * Math.sin(world.elapsed * 4 + 2);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press Enter to cook another shift', VIEW.w / 2, 390, 'bold 20px system-ui, sans-serif', '#f2b705', 'center');
  ctx.globalAlpha = 1;
}
