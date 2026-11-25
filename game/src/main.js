// Sizzle Line — bootstrap and game loop. One job: wire the canvas, the
// input and the update/render steps together, and stage screenshot shots.
//
// Play: open game/index.html in desktop Chrome. No network, no build step.
// Screenshots: game/index.html?shot=start|play|end&seed=1 freezes the world
// in a staged state (see shots.js) and renders it.

import { VIEW } from './config.js';
import { createWorld } from './world.js';
import { createInput, endFrame } from './input.js';
import { step } from './update.js';
import { draw } from './render.js';
import { stageShot } from './shots.js';
import { hashSeed } from './random.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedText = params.get('seed') || 'sizzle-line-1';
const shot = params.get('shot');

let world = createWorld(hashSeed(seedText));
const input = createInput(canvas);

if (shot) stageShot(world, shot);

let last = performance.now();

function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  if (!world.frozen) {
    step(world, input, dt);
    if (world.restartRequested) {
      world = createWorld(hashSeed(seedText) + 1);
      world.mode = 'playing';
      world.spawnIn = 2;
    }
  }
  draw(ctx, world);
  endFrame(input);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// Exposed for debugging and for the screenshot harness.
window.__sizzle = { world, input };
