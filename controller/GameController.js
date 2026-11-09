import { Match } from '../model/Match.js';

/**
 * Centro del juego: bucle principal, fases de la aplicación y decisión de fin
 * de partida. Traduce la entrada en acciones del modelo y elige qué muestran
 * las vistas. No toca el DOM.
 */
export class GameController {
  static MAX_STEP = 1 / 30;

  #canvas;
  #hud;
  #overlay;
  #keyboard;
  #createMatch;
  #match = null;
  #phase = 'menu';
  #rafId = null;
  #lastTime = null;

  constructor({ canvas, hud, overlay, keyboard, createMatch = (difficulty) => new Match(difficulty) }) {
    this.#canvas = canvas;
    this.#hud = hud;
    this.#overlay = overlay;
    this.#keyboard = keyboard;
    this.#createMatch = createMatch;
  }

  start() {
    this.#hud.onAction('pause', () => this.#pause());
    this.#hud.onAction('finish', () => this.#finish());
    this.#hud.onAction('help', () => this.#openHelp());
    this.#overlay.onAction('start', () => this.#startMatch());
    this.#overlay.onAction('resume', () => this.#resume());
    this.#keyboard.onPauseKey(() => this.#togglePause());
    this.#keyboard.onFocusLost(() => this.#pause());

    this.#canvas.render(null);
    this.#enterPhase('menu');
  }

  // --- Bucle principal ------------------------------------------------------

  #frame = (now) => {
    this.#rafId = requestAnimationFrame(this.#frame);
    const dt = this.#stepFrom(now);
    this.#applyInput();
    this.#match.update(dt);
    this.#match.resolveCollisions();
    this.#canvas.render(this.#match);
    this.#hud.update({ score: this.#match.score, wave: this.#match.wave, lives: this.#match.lives });
    this.#checkEnd();
  };

  /** Segundos desde el frame anterior, limitados para evitar saltos tras una espera. */
  #stepFrom(now) {
    const elapsed = this.#lastTime === null ? 0 : (now - this.#lastTime) / 1000;
    this.#lastTime = now;
    return Math.min(elapsed, GameController.MAX_STEP);
  }

  #applyInput() {
    this.#match.steerShip(this.#keyboard.direction);
    if (this.#keyboard.isFiring) this.#match.fireShip();
  }

  #checkEnd() {
    if (this.#match.lives === 0) this.#finish();
  }

  #startLoop() {
    this.#lastTime = null;
    this.#rafId = requestAnimationFrame(this.#frame);
  }

  #stopLoop() {
    cancelAnimationFrame(this.#rafId);
  }

  // --- Fases ----------------------------------------------------------------

  #enterPhase(phase) {
    this.#phase = phase;
    this.#hud.setPhase(phase);
    this.#keyboard.setCaptureGameKeys(phase === 'playing');
  }

  #startMatch() {
    if (this.#phase === 'playing' || this.#phase === 'paused') return;
    this.#match = this.#createMatch(this.#overlay.difficulty);
    this.#play();
  }

  #play() {
    this.#overlay.hideAll();
    this.#canvas.focus();
    this.#enterPhase('playing');
    this.#startLoop();
  }

  #pause() {
    if (this.#phase !== 'playing') return;
    this.#stopLoop();
    this.#keyboard.reset();
    this.#overlay.showPause();
    this.#enterPhase('paused');
  }

  #resume() {
    if (this.#phase === 'paused') this.#play();
  }

  #togglePause() {
    if (this.#overlay.isHelpOpen) return;
    if (this.#phase === 'playing') this.#pause();
    else this.#resume();
  }

  #finish() {
    if (this.#phase !== 'playing' && this.#phase !== 'paused') return;
    this.#stopLoop();
    this.#keyboard.reset();
    this.#overlay.showSetup({
      title: 'Partida terminada',
      summary: `Has conseguido ${this.#match.score} puntos y has llegado a la oleada ${this.#match.wave}.`,
    });
    this.#enterPhase('over');
  }

  #openHelp() {
    this.#pause();
    this.#overlay.openHelp();
  }
}
