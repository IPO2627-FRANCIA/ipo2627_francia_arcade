import { Entity, WORLD } from './Entity.js';
import { Projectile } from './Projectile.js';

/** Nave del jugador: acelera en horizontal y frena por fricción. */
export class Ship extends Entity {
  static WIDTH = 44;
  static HEIGHT = 36;
  static BOTTOM_GAP = 16;
  static ACCELERATION = 2400;
  static FRICTION = 6;
  static MAX_SPEED = 420;
  static FIRE_COOLDOWN = 0.22;
  static INVULNERABLE_TIME = 1.5;

  #direction = 0;
  #cooldown = 0;
  #invulnerability = 0;

  constructor() {
    super({
      x: (WORLD.width - Ship.WIDTH) / 2,
      y: WORLD.height - Ship.HEIGHT - Ship.BOTTOM_GAP,
      width: Ship.WIDTH,
      height: Ship.HEIGHT,
    });
  }

  get isInvulnerable() {
    return this.#invulnerability > 0;
  }

  steer(direction) {
    this.#direction = direction;
  }

  update(dt) {
    const previousVx = this.vx;
    this.#accelerate(dt);
    // Velocidad media del paso: el recorrido no depende de la tasa de refresco.
    this.x += ((previousVx + this.vx) / 2) * dt;
    this.#keepInsideWorld();
    this.#cooldown = Math.max(0, this.#cooldown - dt);
    this.#invulnerability = Math.max(0, this.#invulnerability - dt);
  }

  tryFire() {
    if (this.#cooldown > 0) return null;
    this.#cooldown = Ship.FIRE_COOLDOWN;
    return Projectile.fromShip(this);
  }

  hit() {
    this.#invulnerability = Ship.INVULNERABLE_TIME;
  }

  #accelerate(dt) {
    if (this.#direction === 0) {
      this.vx *= Math.exp(-Ship.FRICTION * dt);
      return;
    }
    const speed = this.vx + this.#direction * Ship.ACCELERATION * dt;
    this.vx = Math.min(Ship.MAX_SPEED, Math.max(-Ship.MAX_SPEED, speed));
  }

  #keepInsideWorld() {
    const maxX = WORLD.width - this.width;
    if (this.x > 0 && this.x < maxX) return;
    this.x = Math.min(maxX, Math.max(0, this.x));
    this.vx = 0;
  }
}
