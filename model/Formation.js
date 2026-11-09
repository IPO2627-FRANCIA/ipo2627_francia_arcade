import { WORLD } from './Entity.js';
import { Enemy } from './Enemy.js';
import { Projectile } from './Projectile.js';

/**
 * Bloque de enemigos: avanza de lado a paso, baja y cambia de sentido al
 * llegar a un borde, y acelera según se queda sin enemigos.
 */
export class Formation {
  static ROW_KINDS = Object.freeze(['elite', 'drone', 'drone', 'scout']);
  static ROWS = Formation.ROW_KINDS.length;
  static COLUMNS = 9;
  static CELL_WIDTH = 64;
  static CELL_HEIGHT = 46;
  static TOP = 76;
  static STEP_X = 14;
  static STEP_Y = 22;
  static MIN_STEP_RATIO = 0.08;

  #enemies;
  #stepEvery;
  #fireEvery;
  #random;
  #initialCount;
  #direction = 1;
  #stepTimer = 0;
  #fireTimer = 0;

  constructor({ stepEvery, fireEvery, top = Formation.TOP }, random = Math.random) {
    this.#stepEvery = stepEvery;
    this.#fireEvery = fireEvery;
    this.#random = random;
    this.#enemies = Formation.#createEnemies(top);
    this.#initialCount = this.#enemies.length;
  }

  static #createEnemies(top) {
    const width = (Formation.COLUMNS - 1) * Formation.CELL_WIDTH + Enemy.WIDTH;
    const left = (WORLD.width - width) / 2;
    return Formation.ROW_KINDS.flatMap((kind, row) =>
      Array.from({ length: Formation.COLUMNS }, (_, column) => new Enemy(
        kind,
        left + column * Formation.CELL_WIDTH,
        top + row * Formation.CELL_HEIGHT,
      )),
    );
  }

  get enemies() {
    return this.#enemies;
  }

  get isCleared() {
    return this.#enemies.length === 0;
  }

  get lowestEdge() {
    return Math.max(...this.#enemies.map(({ y, height }) => y + height));
  }

  /** Avanza la formación y devuelve los disparos de este paso. */
  update(dt) {
    this.#march(dt);
    return this.#fire(dt);
  }

  remove(enemy) {
    this.#enemies.splice(this.#enemies.indexOf(enemy), 1);
  }

  #march(dt) {
    this.#stepTimer += dt;
    const interval = this.#stepInterval();
    if (this.#stepTimer < interval) return;
    this.#stepTimer -= interval;
    this.#takeStep();
  }

  #stepInterval() {
    const remaining = this.#enemies.length / this.#initialCount;
    return this.#stepEvery * Math.max(Formation.MIN_STEP_RATIO, remaining);
  }

  #takeStep() {
    const dx = this.#direction * Formation.STEP_X;
    if (this.#enemies.some(({ x, width }) => x + dx < 0 || x + dx + width > WORLD.width)) {
      this.#direction = -this.#direction;
      this.#enemies.forEach((enemy) => (enemy.y += Formation.STEP_Y));
      return;
    }
    this.#enemies.forEach((enemy) => (enemy.x += dx));
  }

  #fire(dt) {
    this.#fireTimer += dt;
    if (this.#fireTimer < this.#fireEvery || this.isCleared) return [];
    this.#fireTimer -= this.#fireEvery;
    const front = this.#frontEnemies();
    return [Projectile.fromEnemy(front[Math.floor(this.#random() * front.length)])];
  }

  /** Solo dispara el enemigo más bajo de cada columna. */
  #frontEnemies() {
    return this.#enemies.filter(
      (enemy) => !this.#enemies.some((other) => other.x === enemy.x && other.y > enemy.y),
    );
  }
}
