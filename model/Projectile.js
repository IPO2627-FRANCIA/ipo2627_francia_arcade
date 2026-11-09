import { Entity, WORLD } from './Entity.js';

/** Proyectil en línea recta: hacia arriba si es de la nave, hacia abajo si es enemigo. */
export class Projectile extends Entity {
  static SHIP_SHOT = Object.freeze({ width: 4, height: 14, speed: 640 });
  static ENEMY_SHOT = Object.freeze({ width: 6, height: 12, speed: 320 });

  constructor(owner, box) {
    super(box);
    this.owner = owner;
  }

  static fromShip(ship) {
    const { width, height, speed } = Projectile.SHIP_SHOT;
    return new Projectile('ship', {
      x: ship.x + (ship.width - width) / 2,
      y: ship.y - height,
      width,
      height,
      vy: -speed,
    });
  }

  static fromEnemy(enemy) {
    const { width, height, speed } = Projectile.ENEMY_SHOT;
    return new Projectile('enemy', {
      x: enemy.x + (enemy.width - width) / 2,
      y: enemy.y + enemy.height,
      width,
      height,
      vy: speed,
    });
  }

  get isOutOfWorld() {
    return this.y + this.height < 0 || this.y > WORLD.height;
  }
}
