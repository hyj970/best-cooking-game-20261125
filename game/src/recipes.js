// Sizzle Line — ingredients and recipes. One job: what a dish is made of,
// how each ingredient is processed, and what an order asks for.
//
// An item is { kind, state } where state is:
//   'raw'     — just taken from a crate
//   'chopped' — finished on the chopping board
//   'cooked'  — finished on the stove
//   'ready'   — needs no processing (the bun)
//   'burnt'   — left on the stove too long; only the trash wants it

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e5484d', dark: '#b32d31', process: 'chop', label: 'Tomato' },
  lettuce: { name: 'Lettuce', color: '#69b455', dark: '#3f7d33', process: 'chop', label: 'Lettuce' },
  onion: { name: 'Onion', color: '#c9a7d8', dark: '#8d6aa8', process: 'chop', label: 'Onion' },
  mushroom: { name: 'Mushroom', color: '#d8cbb2', dark: '#a08c68', process: 'chop', label: 'Mushroom' },
  patty: { name: 'Patty', color: '#8a5a33', dark: '#5f3a1e', process: 'cook', label: 'Patty' },
  pasta: { name: 'Pasta', color: '#f2c94c', dark: '#d9a41f', process: 'cook', label: 'Pasta' },
  bun: { name: 'Bun', color: '#e8b06a', dark: '#b57e35', process: 'ready', label: 'Bun' },
};

// A recipe's needs are item keys: "<kind>:<state>".
export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['tomato:chopped', 'lettuce:chopped'],
    coins: 8,
    color: '#69b455',
    blurb: 'Crisp, fresh, no stove required.',
  },
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    needs: ['pasta:cooked', 'tomato:chopped'],
    coins: 12,
    color: '#e5484d',
    blurb: 'Boil the pasta, chop the tomato, plate it hot.',
  },
  {
    id: 'burger',
    name: 'Classic Burger',
    needs: ['bun:ready', 'patty:cooked', 'lettuce:chopped'],
    coins: 14,
    color: '#8a5a33',
    blurb: 'The house favourite. Do not burn the patty.',
  },
  {
    id: 'toast',
    name: 'Forest Toast',
    needs: ['bun:ready', 'mushroom:chopped', 'onion:chopped'],
    coins: 10,
    color: '#c9a7d8',
    blurb: 'Earthy mushrooms on a warm bun.',
  },
];

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id) || null;
}

// "tomato:chopped" for an item object.
export function itemKey(item) {
  return `${item.kind}:${item.state}`;
}

export function displayName(item) {
  const def = INGREDIENTS[item.kind];
  if (!def) return '???';
  if (item.state === 'chopped') return `Chopped ${def.name}`;
  if (item.state === 'cooked') return `Cooked ${def.name}`;
  if (item.state === 'burnt') return `Burnt ${def.name}`;
  return def.name;
}

// What processing does this raw item still need? 'chop' | 'cook' | null.
export function neededProcess(item) {
  if (!item || item.state !== 'raw') return null;
  const def = INGREDIENTS[item.kind];
  if (!def) return null;
  if (def.process === 'chop' || def.process === 'cook') return def.process;
  return null;
}

// Does this set of item keys match a recipe exactly (order-free)?
export function matchRecipe(itemKeys) {
  const sorted = [...itemKeys].sort().join('|');
  for (const r of RECIPES) {
    if ([...r.needs].sort().join('|') === sorted) return r;
  }
  return null;
}

// Could these item keys still grow into some recipe (no wrong item yet)?
export function couldBecomeRecipe(itemKeys) {
  const have = new Set(itemKeys);
  for (const r of RECIPES) {
    const need = new Set(r.needs);
    if (have.size > need.size) continue;
    let ok = true;
    for (const k of have) if (!need.has(k)) { ok = false; break; }
    if (ok) return true;
  }
  return false;
}
