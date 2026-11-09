import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameController } from '../controller/GameController.js';

/** Controlador con vistas y partida falsas que anotan cada llamada en `log`. */
function setup() {
  const log = [];
  const frames = new Map();
  let nextId = 0;

  globalThis.requestAnimationFrame = (callback) => {
    nextId += 1;
    frames.set(nextId, callback);
    log.push('requestAnimationFrame');
    return nextId;
  };
  globalThis.cancelAnimationFrame = (id) => frames.delete(id);

  const canvas = {
    focusCount: 0,
    render: (match) => log.push(match ? 'render' : 'render-empty'),
    focus() {
      this.focusCount += 1;
    },
  };
  const hud = {
    handlers: {},
    phases: [],
    update: () => log.push('hud'),
    setPhase(phase) {
      this.phases.push(phase);
    },
    onAction(name, handler) {
      this.handlers[name] = handler;
    },
  };
  const overlay = {
    handlers: {},
    difficulty: 'hard',
    isHelpOpen: false,
    setup: [],
    pauseCount: 0,
    hideCount: 0,
    helpCount: 0,
    showSetup(content) {
      this.setup.push(content);
    },
    showPause() {
      this.pauseCount += 1;
    },
    hideAll() {
      this.hideCount += 1;
    },
    openHelp() {
      this.helpCount += 1;
    },
    onAction(name, handler) {
      this.handlers[name] = handler;
    },
  };
  const keyboard = {
    direction: 0,
    isFiring: false,
    capture: [],
    resetCount: 0,
    setCaptureGameKeys(value) {
      this.capture.push(value);
    },
    reset() {
      this.resetCount += 1;
    },
    onPauseKey(handler) {
      this.pauseKey = handler;
    },
    onFocusLost(handler) {
      this.focusLost = handler;
    },
  };

  const matches = [];
  const createMatch = (difficulty) => {
    const match = {
      difficulty,
      score: 120,
      wave: 4,
      lives: 3,
      steps: [],
      steers: [],
      fires: 0,
      steerShip(direction) {
        this.steers.push(direction);
        log.push('steer');
      },
      fireShip() {
        this.fires += 1;
      },
      update(dt) {
        this.steps.push(dt);
        log.push('update');
      },
      resolveCollisions: () => log.push('collisions'),
    };
    matches.push(match);
    return match;
  };

  const runFrame = (now) => {
    const [id, callback] = [...frames][0];
    frames.delete(id);
    callback(now);
  };

  const controller = new GameController({ canvas, hud, overlay, keyboard, createMatch });
  controller.start();
  return { log, frames, canvas, hud, overlay, keyboard, matches, runFrame };
}

const lastOf = (list) => list[list.length - 1];

test('start wires the views and shows an empty canvas in the menu phase', () => {
  const { log, frames, hud } = setup();
  assert.deepEqual(log, ['render-empty']);
  assert.equal(frames.size, 0);
  assert.equal(lastOf(hud.phases), 'menu');
});

test('start action creates a match with the chosen difficulty and starts the loop', () => {
  const { overlay, matches, frames, hud, keyboard } = setup();
  overlay.handlers.start();
  assert.equal(matches[0].difficulty, 'hard');
  assert.equal(frames.size, 1);
  assert.equal(overlay.hideCount, 1);
  assert.equal(lastOf(hud.phases), 'playing');
  assert.equal(lastOf(keyboard.capture), true);
});

test('first statement of a frame requests the next frame', () => {
  const { log, overlay, runFrame } = setup();
  overlay.handlers.start();
  log.length = 0;
  runFrame(16);
  assert.deepEqual(log, ['requestAnimationFrame', 'steer', 'update', 'collisions', 'render', 'hud']);
});

test('frame applies keyboard input to the match', () => {
  const { overlay, keyboard, matches, runFrame } = setup();
  overlay.handlers.start();
  keyboard.direction = -1;
  keyboard.isFiring = true;
  runFrame(16);
  assert.deepEqual(matches[0].steers, [-1]);
  assert.equal(matches[0].fires, 1);
});

test('start during playing does not create a second loop', () => {
  const { overlay, matches, frames } = setup();
  overlay.handlers.start();
  overlay.handlers.start();
  assert.equal(matches.length, 1);
  assert.equal(frames.size, 1);
});

test('pause cancels the loop and keeps the match', () => {
  const { overlay, hud, frames, matches, keyboard } = setup();
  overlay.handlers.start();
  hud.handlers.pause();
  assert.equal(frames.size, 0);
  assert.equal(overlay.pauseCount, 1);
  assert.equal(lastOf(hud.phases), 'paused');
  assert.equal(lastOf(keyboard.capture), false);
  overlay.handlers.resume();
  assert.equal(matches.length, 1);
  assert.equal(frames.size, 1);
});

test('resume restarts with zero dt', () => {
  const { overlay, hud, matches, runFrame } = setup();
  overlay.handlers.start();
  runFrame(1000);
  runFrame(1016);
  hud.handlers.pause();
  overlay.handlers.resume();
  runFrame(11016);
  assert.equal(lastOf(matches[0].steps), 0);
});

test('step is clamped to MAX_STEP', () => {
  const { overlay, matches, runFrame } = setup();
  overlay.handlers.start();
  runFrame(1000);
  runFrame(6000);
  assert.equal(lastOf(matches[0].steps), GameController.MAX_STEP);
});

test('step converts milliseconds to seconds', () => {
  const { overlay, matches, runFrame } = setup();
  overlay.handlers.start();
  runFrame(1000);
  runFrame(1020);
  assert.ok(Math.abs(lastOf(matches[0].steps) - 0.02) < 1e-9);
});

test('controller ends the match when lives reach zero', () => {
  const { overlay, hud, matches, frames, log, runFrame } = setup();
  overlay.handlers.start();
  matches[0].lives = 0;
  log.length = 0;
  runFrame(16);
  assert.ok(log.includes('render'));
  assert.equal(frames.size, 0);
  assert.equal(lastOf(hud.phases), 'over');
  assert.match(overlay.setup[0].summary, /120/);
});

test('match keeps running while lives remain', () => {
  const { overlay, hud, frames, runFrame } = setup();
  overlay.handlers.start();
  runFrame(16);
  assert.equal(frames.size, 1);
  assert.equal(lastOf(hud.phases), 'playing');
});

test('finish from paused goes to over', () => {
  const { overlay, hud, frames } = setup();
  overlay.handlers.start();
  hud.handlers.pause();
  hud.handlers.finish();
  assert.equal(lastOf(hud.phases), 'over');
  assert.equal(frames.size, 0);
  assert.equal(overlay.setup.length, 1);
});

test('finish while playing stops the loop', () => {
  const { overlay, hud, frames } = setup();
  overlay.handlers.start();
  hud.handlers.finish();
  assert.equal(lastOf(hud.phases), 'over');
  assert.equal(frames.size, 0);
});

test('a new match can start after the previous one is over', () => {
  const { overlay, hud, matches, frames } = setup();
  overlay.handlers.start();
  hud.handlers.finish();
  overlay.handlers.start();
  assert.equal(matches.length, 2);
  assert.equal(frames.size, 1);
});

test('focus lost while playing pauses and resets keyboard', () => {
  const { overlay, hud, keyboard, frames } = setup();
  overlay.handlers.start();
  keyboard.focusLost();
  assert.equal(lastOf(hud.phases), 'paused');
  assert.equal(frames.size, 0);
  assert.ok(keyboard.resetCount >= 1);
});

test('pause key pauses and resumes', () => {
  const { overlay, hud, keyboard } = setup();
  overlay.handlers.start();
  keyboard.pauseKey();
  assert.equal(lastOf(hud.phases), 'paused');
  keyboard.pauseKey();
  assert.equal(lastOf(hud.phases), 'playing');
});

test('pause key does nothing in the menu', () => {
  const { hud, keyboard, frames } = setup();
  keyboard.pauseKey();
  assert.equal(lastOf(hud.phases), 'menu');
  assert.equal(frames.size, 0);
});

test('pause key is ignored while help is open', () => {
  const { overlay, hud, keyboard, frames } = setup();
  overlay.handlers.start();
  hud.handlers.help();
  overlay.isHelpOpen = true;
  keyboard.pauseKey();
  assert.equal(lastOf(hud.phases), 'paused');
  assert.equal(frames.size, 0);
});

test('opening help while playing pauses', () => {
  const { overlay, hud, frames } = setup();
  overlay.handlers.start();
  hud.handlers.help();
  assert.equal(overlay.helpCount, 1);
  assert.equal(lastOf(hud.phases), 'paused');
  assert.equal(frames.size, 0);
});

test('opening help in the menu keeps the menu phase', () => {
  const { overlay, hud } = setup();
  hud.handlers.help();
  assert.equal(overlay.helpCount, 1);
  assert.equal(lastOf(hud.phases), 'menu');
});

test('start and resume return focus to canvas', () => {
  const { overlay, hud, canvas } = setup();
  overlay.handlers.start();
  assert.equal(canvas.focusCount, 1);
  hud.handlers.pause();
  overlay.handlers.resume();
  assert.equal(canvas.focusCount, 2);
});
