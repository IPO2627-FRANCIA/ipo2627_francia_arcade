/** Dimensiones lógicas del juego, independientes del tamaño en pantalla. */
export const WORLD = Object.freeze({ width: 800, height: 600 });

/** Caja con velocidad: (x, y) es su esquina superior izquierda. */
export class Entity {
  constructor({ x, y, width, height, vx = 0, vy = 0 }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = vx;
    this.vy = vy;
  }

  move(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /** Dos cajas que solo comparten un borde no chocan. */
  overlaps(other) {
    return (
      this.x < other.x + other.width &&
      other.x < this.x + this.width &&
      this.y < other.y + other.height &&
      other.y < this.y + this.height
    );
  }
}
