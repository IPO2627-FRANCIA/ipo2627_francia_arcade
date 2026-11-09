import { Entity, WORLD } from './Entity.js';
import { Projectile } from './Projectile.js';

/** Enemigo que baja con una deriva lateral sinusoidal. */
export class Enemy extends Entity {
  static KINDS = Object.freeze({
    drone: { width: 36, height: 28, speed: 90, points: 10, hp: 1, fireEvery: null },
    gunner: { width: 44, height: 34, speed: 60, points: 25, hp: 2, fireEvery: 2.2 },
  });
  static DRIFT_AMPLITUDE = 70;
  static DRIFT_FREQUENCY = 1.8;

  #hp;
  #fireEvery;
  #fireTimer;
  #driftAngle;
  #driftSign = 1;

  constructor(kind, x, speedFactor) {
    const { width, height, speed, points, hp, fireEvery } = Enemy.KINDS[kind];
    super({ x, y: -height, width, height, vy: speed * speedFactor });
    this.kind = kind;
    this.points = points;
    this.#hp = hp;
    this.#fireEvery = fireEvery;
    this.#fireTimer = fireEvery;
    // Cada enemigo empieza la oscilación en un punto distinto según su posición.
    this.#driftAngle = x;
  }

  get isDestroyed() {
    return this.#hp <= 0;
  }

  get hasEscaped() {
    return this.y > WORLD.height;
  }

  update(dt) {
    this.#driftAngle += Enemy.DRIFT_FREQUENCY * dt;
    this.vx = this.#driftSign * Enemy.DRIFT_AMPLITUDE * Math.cos(this.#driftAngle);
    this.move(dt);
    this.#bounceOnSides();
    if (this.#fireEvery !== null) this.#fireTimer -= dt;
  }

  tryFire() {
    if (this.#fireEvery === null || this.#fireTimer > 0) return null;
    this.#fireTimer = this.#fireEvery;
    return Projectile.fromEnemy(this);
  }

  damage() {
    this.#hp -= 1;
  }

  #bounceOnSides() {
    const maxX = WORLD.width - this.width;
    if (this.x >= 0 && this.x <= maxX) return;
    this.x = Math.min(maxX, Math.max(0, this.x));
    this.#driftSign = -this.#driftSign;
  }
}
