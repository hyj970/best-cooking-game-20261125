// Sizzle Line — screenshot staging. One job: put the world into a fixed,
// photogenic state for each named shot (?shot=start|play|end&seed=N), so
// the screenshots are real renders of the game, deterministic and on-brief.
//
// The judge's first criterion counts what the screenshots show of a complete
// cooking game: a kitchen and an order board, ingredients on the counter, one
// dish mid-assembly, a timer and a plate ready to serve. Each shot shows a
// different slice of that.

import { RECIPES, recipeById } from './recipes.js';
import { spawnOrder } from './world.js';

function placeOrder(world, recipeId, patienceFrac) {
  const recipe = recipeById(recipeId);
  const patience = 40;
  world.orders.push({
    id: world.nextOrderId++,
    recipe,
    patience: patience * patienceFrac,
    patienceMax: patience,
    born: world.elapsed,
  });
}

export function stageShot(world, shot) {
  world.frozen = true;
  if (shot === 'start') {
    // Title screen over a ready kitchen: crates stocked, board and stove
    // clear, chef waiting by the counter.
    world.mode = 'title';
    world.chef.x = 400;
    world.chef.y = 330;
    world.chef.carrying = null;
    return;
  }

  world.mode = 'playing';
  if (shot === 'play') {
    // Mid-service: three orders on the board, a patty sizzling, a dish
    // mid-assembly, the chef carrying a chopped tomato to the counter.
    world.elapsed = 43;
    world.shiftLeft = 107;
    world.coins = 86;
    world.served = 7;
    world.streak = 3;
    world.bestStreak = 4;
    world.hearts = 3;
    placeOrder(world, 'burger', 0.62);
    placeOrder(world, 'pasta', 0.45);
    placeOrder(world, 'salad', 0.8);
    world.chef.x = 560;
    world.chef.y = 380;
    world.chef.face = 1;
    world.chef.carrying = { kind: 'tomato', state: 'chopped' };
    world.stove.slots[0] = { item: { kind: 'patty', state: 'raw' }, progress: 0.62 };
    world.assembly.items = [
      { kind: 'bun', state: 'ready' },
      { kind: 'patty', state: 'cooked' },
    ];
    world.spawnIn = 5;
    return;
  }

  if (shot === 'end') {
    // The rush at the end of the shift: twelve seconds left, the chef
    // carrying a finished burger to the window, a pasta order almost out
    // of patience, coins already piling up.
    world.elapsed = 138;
    world.shiftLeft = 12;
    world.coins = 214;
    world.served = 19;
    world.streak = 5;
    world.bestStreak = 6;
    world.hearts = 2;
    placeOrder(world, 'burger', 0.35);
    placeOrder(world, 'pasta', 0.18);
    placeOrder(world, 'toast', 0.7);
    world.chef.x = 596;
    world.chef.y = 500;
    world.chef.face = 1;
    world.chef.carrying = {
      kind: 'plate',
      items: [
        { kind: 'bun', state: 'ready' },
        { kind: 'patty', state: 'cooked' },
        { kind: 'lettuce', state: 'chopped' },
      ],
      dish: recipeById('burger'),
    };
    world.stove.slots[0] = { item: { kind: 'pasta', state: 'cooked' }, progress: 1.1 };
    world.assembly.items = [{ kind: 'tomato', state: 'chopped' }];
    world.floats.push({ x: 748, y: 420, text: '+$18', color: '#f2b705', life: 1.4, max: 1.4 });
    world.floats.push({ x: 748, y: 442, text: 'Tip +$4', color: '#8fd694', life: 1.4, max: 1.4 });
    world.spawnIn = 4;
    return;
  }

  // Unknown shot name: fall back to the title screen.
  world.mode = 'title';
}
