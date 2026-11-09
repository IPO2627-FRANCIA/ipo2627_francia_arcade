import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { KeyboardView } from '../view/KeyboardView.js';

// Una ventana nueva por test: cada KeyboardView escucha solo la suya.
beforeEach(() => {
  globalThis.window = new EventTarget();
});

const send = (type, key, init = {}) => {
  const event = Object.assign(new Event(type, { cancelable: true }), { key, repeat: false }, init);
  window.dispatchEvent(event);
  return event;
};

const capturing = () => {
  const keyboard = new KeyboardView();
  keyboard.setCaptureGameKeys(true);
  return keyboard;
};

test('held key keeps being cancelled after the capture ends until it is released', () => {
  const keyboard = capturing();
  send('keydown', ' ');
  keyboard.setCaptureGameKeys(false);
  keyboard.reset();
  assert.equal(send('keydown', ' ', { repeat: true }).defaultPrevented, true);
  assert.equal(send('keyup', ' ').defaultPrevented, true);
});

test('held key does not fire again after reset', () => {
  const keyboard = capturing();
  send('keydown', ' ');
  keyboard.setCaptureGameKeys(false);
  keyboard.reset();
  send('keydown', ' ', { repeat: true });
  assert.equal(keyboard.isFiring, false);
});

test('game keys are left alone when not captured and not held', () => {
  const keyboard = new KeyboardView();
  keyboard.setCaptureGameKeys(false);
  assert.equal(send('keydown', ' ').defaultPrevented, false);
  assert.equal(send('keyup', ' ').defaultPrevented, false);
});

test('window blur clears held keys and notifies', () => {
  const keyboard = capturing();
  let lost = 0;
  keyboard.onFocusLost(() => {
    lost += 1;
  });
  send('keydown', 'ArrowLeft');
  assert.equal(keyboard.direction, -1);
  window.dispatchEvent(new Event('blur'));
  assert.equal(keyboard.direction, 0);
  assert.equal(lost, 1);
  keyboard.setCaptureGameKeys(false);
  assert.equal(send('keydown', 'ArrowLeft').defaultPrevented, false);
});

test('opposite directions cancel out and letters ignore case', () => {
  const keyboard = capturing();
  send('keydown', 'D');
  assert.equal(keyboard.direction, 1);
  send('keydown', 'ArrowLeft');
  assert.equal(keyboard.direction, 0);
});

test('pause key ignores auto-repeat and browser shortcuts', () => {
  const keyboard = new KeyboardView();
  let pauses = 0;
  keyboard.onPauseKey(() => {
    pauses += 1;
  });
  send('keydown', 'p', { repeat: true });
  send('keydown', 'p', { metaKey: true });
  assert.equal(pauses, 0);
  send('keydown', 'P');
  assert.equal(pauses, 1);
});
