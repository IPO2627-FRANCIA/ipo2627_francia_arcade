const VISIBLE_CLASS = 'panel--visible';

/** Paneles sobre el lienzo, selector de dificultad y diálogo de ayuda. */
export class OverlayView {
  #stage = document.querySelector('.stage');
  #setupPanel = document.getElementById('setupPanel');
  #setupTitle = document.getElementById('setupTitle');
  #setupSummary = document.getElementById('setupSummary');
  #pausePanel = document.getElementById('pausePanel');
  #help = document.getElementById('helpDialog');
  #handlers = {};

  constructor() {
    this.#stage.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action]');
      if (button) this.#handlers[button.dataset.action]?.();
    });
  }

  get difficulty() {
    return this.#setupPanel.querySelector('input[name="difficulty"]:checked').value;
  }

  get isHelpOpen() {
    return this.#help.open;
  }

  onAction(name, handler) {
    this.#handlers[name] = handler;
  }

  showSetup({ title, summary }) {
    this.#setupTitle.textContent = title;
    this.#setupSummary.textContent = summary;
    this.#show(this.#setupPanel);
  }

  showPause() {
    this.#show(this.#pausePanel);
  }

  hideAll() {
    this.#setupPanel.classList.remove(VISIBLE_CLASS);
    this.#pausePanel.classList.remove(VISIBLE_CLASS);
  }

  openHelp() {
    if (!this.#help.open) this.#help.showModal();
  }

  #show(panel) {
    this.hideAll();
    panel.classList.add(VISIBLE_CLASS);
    panel.querySelector('.button--primary').focus();
  }
}
