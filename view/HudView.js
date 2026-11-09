const SCORE_DIGITS = 6;
const LOST_LIFE_CLASS = 'hud__life--lost';

/** Marcador y botón de pausa, dentro del espacio de juego. */
export class HudView {
  #score = document.getElementById('score');
  #wave = document.getElementById('wave');
  #lives = document.getElementById('lives');
  #lifeTemplate = document.getElementById('lifeTemplate');
  #root = document.getElementById('hud');
  #pauseButton = this.#root.querySelector('[data-action="pause"]');
  #handlers = {};
  #renderedLives = null;

  constructor() {
    this.#root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) this.#handlers[button.dataset.action]?.();
    });
  }

  onAction(name, handler) {
    this.#handlers[name] = handler;
  }

  update({ score, wave, lives, maxLives }) {
    this.#score.textContent = String(score).padStart(SCORE_DIGITS, '0');
    this.#wave.textContent = wave;
    this.#renderLives(lives, maxLives);
  }

  setPhase(phase) {
    this.#root.classList.toggle('hud--visible', phase === 'playing' || phase === 'paused');
    this.#pauseButton.disabled = phase !== 'playing';
  }

  /** El marcador se actualiza en cada frame: solo se redibuja si cambian las vidas. */
  #renderLives(lives, maxLives) {
    const state = `${lives} de ${maxLives}`;
    if (state === this.#renderedLives) return;
    this.#renderedLives = state;
    this.#lives.setAttribute('aria-label', state);
    this.#lives.replaceChildren(
      ...Array.from({ length: maxLives }, (_, index) => this.#createLife(index >= lives)),
    );
  }

  #createLife(isLost) {
    const icon = this.#lifeTemplate.content.firstElementChild.cloneNode(true);
    icon.classList.toggle(LOST_LIFE_CLASS, isLost);
    return icon;
  }
}
