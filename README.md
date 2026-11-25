# best-cooking-game-20261125

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hyj970/best-cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hyj970/best-cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle Line is a short-order kitchen rush: customers order, you cook. Take ingredients from the crates, chop them on the board or cook them on the stove, build each dish on the assembly counter, and serve it through the window before the customer's patience runs out. Four recipes, a 150-second shift, growing pressure, and a streak bonus for a kitchen on fire.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no network — the game is plain static files under `game/`.

## How to play

- **WASD / arrow keys** — walk the chef. **Click** — walk there (click a station to walk to it and use it).
- **E / Space** — use the station you stand next to. Hold **E** at the chopping board to chop.
- **Q** — take the last item back off the assembly plate.
- **Enter** — start the shift / play again. **P** — pause.

Recipes: Garden Salad (chopped tomato + chopped lettuce), Tomato Pasta (cooked pasta + chopped tomato), Classic Burger (bun + cooked patty + chopped lettuce), Forest Toast (bun + chopped mushroom + chopped onion). Food left on the stove too long burns — throw it in the trash. A lost order costs a heart; three hearts and the shift ends early.

## Screenshots

The three shots in `screenshots/` are real renders of the game running in a browser, staged with `?shot=start|play|end&seed=1` (see `shots.json` and `game/src/shots.js`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=xwk0pxbf&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
