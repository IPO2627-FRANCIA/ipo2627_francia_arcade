import { Ship } from './Ship.js';
import { Formation } from './Formation.js';
import { createBarrierBlocks } from './barriers.js';

/**
 * Estado de una partida y sus reglas: movimiento, colisiones, puntos, vidas y
 * oleadas. Solo expone hechos (vidas, hasLanded): quien decide que la partida
 * ha terminado es GameController.
 */
export class Match {
  static DIFFICULTIES = Object.freeze({
    easy: { stepEvery: 0.7, fireEvery: 2, lives: 5 },
    normal: { stepEvery: 0.55, fireEvery: 1.4, lives: 3 },
    hard: { stepEvery: 0.42, fireEvery: 1, lives: 3 },
  });
  static WAVE_STEP_FACTOR = 0.9;
  static MAX_WAVE_DROPS = 4;

  #ship = new Ship();
  #difficulty;
  #random;
  #formation;
  #barrierBlocks = createBarrierBlocks();
  #projectiles = [];
  #score = 0;
  #wave = 1;
  #lives;

  constructor(difficultyId, random = Math.random) {
    this.#difficulty = Match.DIFFICULTIES[difficultyId];
    this.#random = random;
    this.#lives = this.#difficulty.lives;
    this.#formation = this.#createFormation();
  }

  get ship() {
    return this.#ship;
  }

  get enemies() {
    return this.#formation.enemies;
  }

  get barrierBlocks() {
    return this.#barrierBlocks;
  }

  get projectiles() {
    return this.#projectiles;
  }

  get score() {
    return this.#score;
  }

  get lives() {
    return this.#lives;
  }

  get initialLives() {
    return this.#difficulty.lives;
  }

  get wave() {
    return this.#wave;
  }

  /** La formación ha llegado a la altura de la nave. */
  get hasLanded() {
    return !this.#formation.isCleared && this.#formation.lowestEdge > this.#ship.y;
  }

  steerShip(direction) {
    this.#ship.steer(direction);
  }

  fireShip() {
    const shot = this.#ship.tryFire();
    if (shot) this.#projectiles.push(shot);
  }

  update(dt) {
    if (this.#formation.isCleared) this.#startNextWave();
    this.#ship.update(dt);
    this.#projectiles.forEach((projectile) => projectile.move(dt));
    this.#projectiles.push(...this.#formation.update(dt));
    this.#projectiles = this.#projectiles.filter((projectile) => !projectile.isOutOfWorld);
  }

  resolveCollisions() {
    this.#resolveShipShots();
    this.#resolveEnemyShots();
    this.#eraseBarriersUnderEnemies();
  }

  #createFormation() {
    const { stepEvery, fireEvery } = this.#difficulty;
    const previousWaves = this.#wave - 1;
    return new Formation({
      stepEvery: stepEvery * Match.WAVE_STEP_FACTOR ** previousWaves,
      fireEvery,
      top: Formation.TOP + Math.min(previousWaves, Match.MAX_WAVE_DROPS) * Formation.STEP_Y,
    }, this.#random);
  }

  #startNextWave() {
    this.#wave += 1;
    this.#formation = this.#createFormation();
    this.#barrierBlocks = createBarrierBlocks();
  }

  #resolveShipShots() {
    for (const shot of this.#projectiles.filter(({ owner }) => owner === 'ship')) {
      const enemy = this.enemies.find((candidate) => shot.overlaps(candidate));
      if (enemy) {
        this.#score += enemy.points;
        this.#formation.remove(enemy);
        this.#removeFrom(this.#projectiles, shot);
      } else if (this.#hitBarrier(shot)) {
        this.#removeFrom(this.#projectiles, shot);
      }
    }
  }

  #resolveEnemyShots() {
    for (const shot of this.#projectiles.filter(({ owner }) => owner === 'enemy')) {
      if (this.#hitBarrier(shot)) {
        this.#removeFrom(this.#projectiles, shot);
      } else if (!this.#ship.isInvulnerable && shot.overlaps(this.#ship)) {
        this.#removeFrom(this.#projectiles, shot);
        this.#ship.hit();
        this.#lives = Math.max(0, this.#lives - 1);
      }
    }
  }

  /** Destruye el primer bloque que toca la entidad e indica si lo ha hecho. */
  #hitBarrier(entity) {
    const block = this.#barrierBlocks.find((candidate) => entity.overlaps(candidate));
    if (block) this.#removeFrom(this.#barrierBlocks, block);
    return Boolean(block);
  }

  #eraseBarriersUnderEnemies() {
    this.enemies.forEach((enemy) => {
      while (this.#hitBarrier(enemy));
    });
  }

  #removeFrom(list, item) {
    list.splice(list.indexOf(item), 1);
  }
}
