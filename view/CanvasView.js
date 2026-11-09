import { WORLD } from '../model/Entity.js';

const RENDER_SCALE = 2;

/** Dibuja la partida. El orden importa: lo último que se pinta queda encima. */
export class CanvasView {
  #canvas;
  #ctx;
  #colors;

  constructor(canvas) {
    this.#canvas = canvas;
    canvas.width = WORLD.width * RENDER_SCALE;
    canvas.height = WORLD.height * RENDER_SCALE;
    this.#ctx = canvas.getContext('2d');
    this.#ctx.scale(RENDER_SCALE, RENDER_SCALE);

    const styles = getComputedStyle(canvas);
    const color = (name) => styles.getPropertyValue(name).trim();
    this.#colors = {
      ship: color('--color-ship'),
      shipShot: color('--color-ship-shot'),
      enemy: color('--color-enemy'),
      enemyStrong: color('--color-enemy-strong'),
      enemyShot: color('--color-enemy-shot'),
      barrier: color('--color-barrier'),
    };
  }

  render(match) {
    this.#ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    if (!match) return;
    match.barrierBlocks.forEach((block) => this.#drawBarrierBlock(block));
    match.enemies.forEach((enemy) => this.#drawEnemy(enemy));
    match.projectiles.forEach((projectile) => this.#drawProjectile(projectile));
    this.#drawShip(match.ship);
  }

  focus() {
    this.#canvas.focus();
  }

  #drawShip(ship) {
    const { x, y, width, height } = ship;
    const ctx = this.#ctx;
    ctx.save();
    if (ship.isInvulnerable) ctx.globalAlpha = 0.45;
    ctx.fillStyle = this.#colors.ship;
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width / 2, y + height * 0.72);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  #drawEnemy(enemy) {
    if (enemy.kind === 'elite') this.#drawElite(enemy);
    else if (enemy.kind === 'drone') this.#drawDrone(enemy);
    else this.#drawScout(enemy);
  }

  #drawBarrierBlock({ x, y, width, height }) {
    this.#ctx.fillStyle = this.#colors.barrier;
    this.#ctx.fillRect(x, y, width, height);
  }

  /** Casco ancho con dos patas centrales. */
  #drawScout({ x, y, width, height }) {
    const ctx = this.#ctx;
    ctx.fillStyle = this.#colors.enemy;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y);
    ctx.lineTo(x + width * 0.8, y);
    ctx.lineTo(x + width, y + height * 0.6);
    ctx.lineTo(x + width * 0.7, y + height * 0.6);
    ctx.lineTo(x + width * 0.6, y + height);
    ctx.lineTo(x + width * 0.4, y + height);
    ctx.lineTo(x + width * 0.3, y + height * 0.6);
    ctx.lineTo(x, y + height * 0.6);
    ctx.closePath();
    ctx.fill();
  }

  /** Cuerpo redondo con dos alas triangulares. */
  #drawDrone({ x, y, width, height }) {
    const ctx = this.#ctx;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    ctx.fillStyle = this.#colors.enemy;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(centerX, centerY);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, height / 2.4, 0, 2 * Math.PI);
    ctx.fill();
  }

  /** Hexágono oscuro con un ojo central. */
  #drawElite({ x, y, width, height }) {
    const ctx = this.#ctx;
    ctx.fillStyle = this.#colors.enemyStrong;
    ctx.beginPath();
    ctx.moveTo(x + width * 0.25, y);
    ctx.lineTo(x + width * 0.75, y);
    ctx.lineTo(x + width, y + height / 2);
    ctx.lineTo(x + width * 0.75, y + height);
    ctx.lineTo(x + width * 0.25, y + height);
    ctx.lineTo(x, y + height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = this.#colors.enemyShot;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2, height / 6, 0, 2 * Math.PI);
    ctx.fill();
  }

  #drawProjectile({ owner, x, y, width, height }) {
    this.#ctx.fillStyle = owner === 'ship' ? this.#colors.shipShot : this.#colors.enemyShot;
    this.#ctx.fillRect(x, y, width, height);
  }
}
