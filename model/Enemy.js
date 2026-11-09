import { Entity } from './Entity.js';

/** Enemigo de la formación: su tipo solo cambia los puntos y el dibujo. */
export class Enemy extends Entity {
  static WIDTH = 36;
  static HEIGHT = 28;
  static POINTS = Object.freeze({ scout: 10, drone: 20, elite: 30 });

  constructor(kind, x, y) {
    super({ x, y, width: Enemy.WIDTH, height: Enemy.HEIGHT });
    this.kind = kind;
    this.points = Enemy.POINTS[kind];
  }
}
