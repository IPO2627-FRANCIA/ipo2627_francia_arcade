import { Ship } from './Ship.js';
import { Swarm } from './Swarm.js';

/**
 * Estado de una partida y sus reglas: movimiento, colisiones, puntos y vidas.
 * No conoce las fases de la aplicación: quien decide qué pasa cuando las
 * vidas llegan a cero es GameController.
 */
export class Match {
  static DIFFICULTIES = Object.freeze({
    easy: { speed: 0.8, spawnEvery: 1.2, lives: 5 },
    normal: { speed: 1, spawnEvery: 0.9, lives: 3 },
    hard: { speed: 1.3, spawnEvery: 0.65, lives: 3 },
  });

  #ship = new Ship();
  #swarm;
  #enemies = [];
  #projectiles = [];
  #score = 0;
  #lives;

  constructor(difficultyId, random = Math.random) {
    const difficulty = Match.DIFFICULTIES[difficultyId];
    this.#swarm = new Swarm(difficulty, random);
    this.#lives = difficulty.lives;
  }

  get ship() {
    return this.#ship;
  }

  get enemies() {
    return this.#enemies;
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

  get wave() {
    return this.#swarm.wave;
  }

  steerShip(direction) {
    this.#ship.steer(direction);
  }

  fireShip() {
    this.#addProjectile(this.#ship.tryFire());
  }

  update(dt) {
    this.#ship.update(dt);
    this.#enemies.forEach((enemy) => enemy.update(dt));
    this.#projectiles.forEach((projectile) => projectile.move(dt));
    this.#enemies.push(...this.#swarm.update(dt));
    this.#enemies.forEach((enemy) => this.#addProjectile(enemy.tryFire()));
    this.#removeEscapedEnemies();
    this.#projectiles = this.#projectiles.filter((projectile) => !projectile.isOutOfWorld);
  }

  resolveCollisions() {
    this.#resolveShipShots();
    this.#resolveEnemyShots();
    this.#resolveEnemyContacts();
  }

  #addProjectile(projectile) {
    if (projectile) this.#projectiles.push(projectile);
  }

  #removeEscapedEnemies() {
    this.#enemies.filter((enemy) => enemy.hasEscaped).forEach(() => this.#loseLife());
    this.#enemies = this.#enemies.filter((enemy) => !enemy.hasEscaped);
  }

  #resolveShipShots() {
    for (const shot of this.#projectiles.filter(({ owner }) => owner === 'ship')) {
      const enemy = this.#enemies.find((candidate) => shot.overlaps(candidate));
      if (!enemy) continue;
      this.#removeFrom(this.#projectiles, shot);
      enemy.damage();
      if (enemy.isDestroyed) this.#destroyEnemy(enemy);
    }
  }

  #destroyEnemy(enemy) {
    this.#score += enemy.points;
    this.#removeFrom(this.#enemies, enemy);
  }

  #resolveEnemyShots() {
    for (const shot of this.#projectiles.filter(({ owner }) => owner === 'enemy')) {
      if (this.#ship.isInvulnerable || !shot.overlaps(this.#ship)) continue;
      this.#removeFrom(this.#projectiles, shot);
      this.#hitShip();
    }
  }

  #resolveEnemyContacts() {
    for (const enemy of [...this.#enemies]) {
      if (this.#ship.isInvulnerable || !enemy.overlaps(this.#ship)) continue;
      this.#removeFrom(this.#enemies, enemy);
      this.#hitShip();
    }
  }

  #hitShip() {
    this.#ship.hit();
    this.#loseLife();
  }

  #loseLife() {
    this.#lives = Math.max(0, this.#lives - 1);
  }

  #removeFrom(list, item) {
    list.splice(list.indexOf(item), 1);
  }
}
