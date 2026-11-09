const LEFT_KEYS = ['arrowleft', 'a'];
const RIGHT_KEYS = ['arrowright', 'd'];
const FIRE_KEY = ' ';
const PAUSE_KEY = 'p';
const GAME_KEYS = [...LEFT_KEYS, ...RIGHT_KEYS, FIRE_KEY];

/**
 * Teclado y pérdida de foco. Escucha en window porque lo dibujado en el
 * lienzo no existe en el DOM.
 */
export class KeyboardView {
  #pressed = new Set();
  // Teclas capturadas que siguen físicamente pulsadas: sus repeticiones y su
  // keyup no deben llegar al botón que reciba el foco durante la pausa.
  #held = new Set();
  #capture = false;
  #onPauseKey = null;
  #onFocusLost = null;

  constructor() {
    window.addEventListener('keydown', (event) => this.#keyDown(event));
    window.addEventListener('keyup', (event) => this.#keyUp(event));
    window.addEventListener('blur', () => this.#focusLost());
  }

  get direction() {
    return this.#isAnyPressed(RIGHT_KEYS) - this.#isAnyPressed(LEFT_KEYS);
  }

  get isFiring() {
    return this.#pressed.has(FIRE_KEY);
  }

  setCaptureGameKeys(capture) {
    this.#capture = capture;
  }

  reset() {
    this.#pressed.clear();
  }

  onPauseKey(handler) {
    this.#onPauseKey = handler;
  }

  onFocusLost(handler) {
    this.#onFocusLost = handler;
  }

  #isAnyPressed(keys) {
    return keys.some((key) => this.#pressed.has(key));
  }

  #keyDown(event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (key === PAUSE_KEY && !event.repeat) this.#onPauseKey?.();
    if (!GAME_KEYS.includes(key)) return;
    if (this.#capture) {
      this.#held.add(key);
      this.#pressed.add(key);
    }
    if (this.#held.has(key)) event.preventDefault();
  }

  #keyUp(event) {
    const key = event.key.toLowerCase();
    this.#pressed.delete(key);
    if (this.#held.delete(key)) event.preventDefault();
  }

  #focusLost() {
    this.reset();
    this.#held.clear();
    this.#onFocusLost?.();
  }
}
