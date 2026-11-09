/** Marcador y botones de la cabecera. */
export class HudView {
  #score = document.getElementById('score');
  #wave = document.getElementById('wave');
  #lives = document.getElementById('lives');
  #root = document.getElementById('hud');
  #pauseButton = this.#root.querySelector('[data-action="pause"]');
  #finishButton = this.#root.querySelector('[data-action="finish"]');
  #handlers = {};

  constructor() {
    this.#root.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) this.#handlers[button.dataset.action]?.();
    });
  }

  onAction(name, handler) {
    this.#handlers[name] = handler;
  }

  update({ score, wave, lives }) {
    this.#score.textContent = score;
    this.#wave.textContent = wave;
    this.#lives.textContent = lives;
  }

  setPhase(phase) {
    this.#pauseButton.disabled = phase !== 'playing';
    this.#finishButton.disabled = phase !== 'playing' && phase !== 'paused';
  }
}
