// Sizzle Line — input: keyboard and mouse. One job: turn browser events
// into a small state object the update step reads every frame.
//
// Controls: WASD / arrows to walk, E or Space to interact with the station
// you stand next to, Q to take the last item back off the assembly plate,
// click to walk there (click a station to walk to it and use it),
// Enter to start / restart, P to pause.

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    // Mouse in logical canvas coordinates.
    mouse: { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 },
    // Edge-triggered actions, consumed by the update step.
    pressedE: false,
    pressedQ: false,
    pressedEnter: false,
    pressedP: false,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    KeyE: 'interact', Space: 'interact',
    KeyQ: 'takeback',
    Enter: 'enter',
    KeyP: 'pause',
  };

  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 960,
      y: ((e.clientY - rect.top) / rect.height) * 600,
    };
  }

  window.addEventListener('keydown', (e) => {
    const action = KEYMAP[e.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'interact'].includes(action)) {
      e.preventDefault();
    }
    if (e.repeat) return;
    input.keys.add(action);
    if (action === 'interact') input.pressedE = true;
    if (action === 'takeback') input.pressedQ = true;
    if (action === 'enter') input.pressedEnter = true;
    if (action === 'pause') input.pressedP = true;
  });
  window.addEventListener('keyup', (e) => {
    const action = KEYMAP[e.code];
    if (action) input.keys.delete(action);
  });
  window.addEventListener('blur', () => input.keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const p = toLogical(e);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    const p = toLogical(e);
    input.mouse.x = p.x;
    input.mouse.y = p.y;
    input.mouse.clicked = true;
    input.mouse.clickX = p.x;
    input.mouse.clickY = p.y;
  });

  return input;
}

// Called at the end of each update step: clear edge-triggered flags.
export function endFrame(input) {
  input.pressedE = false;
  input.pressedQ = false;
  input.pressedEnter = false;
  input.pressedP = false;
  input.mouse.clicked = false;
}
