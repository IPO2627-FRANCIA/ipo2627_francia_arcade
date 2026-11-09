import { WORLD } from './Entity.js';
import { Enemy } from './Enemy.js';

/** Decide cuándo y qué enemigos aparecen, y en qué oleada está la partida. */
export class Swarm {
  static ENEMIES_PER_WAVE = 10;
  static WAVE_SPEED_STEP = 0.08;
  static GUNNER_CHANCE = 0.25;

  #speed;
  #spawnEvery;
  #random;
  #elapsed = 0;
  #spawnedInWave = 0;
  #wave = 1;

  constructor({ speed, spawnEvery }, random = Math.random) {
    this.#speed = speed;
    this.#spawnEvery = spawnEvery;
    this.#random = random;
  }

  get wave() {
    return this.#wave;
  }

  /** Devuelve los enemigos que aparecen en este paso. */
  update(dt) {
    const spawned = [];
    this.#elapsed += dt;
    while (this.#elapsed >= this.#spawnEvery) {
      this.#elapsed -= this.#spawnEvery;
      spawned.push(this.#spawn());
    }
    return spawned;
  }

  #spawn() {
    const kind = this.#random() < Swarm.GUNNER_CHANCE ? 'gunner' : 'drone';
    const x = this.#random() * (WORLD.width - Enemy.KINDS[kind].width);
    const enemy = new Enemy(kind, x, this.#speedFactor());
    this.#advanceWave();
    return enemy;
  }

  #speedFactor() {
    return this.#speed * (1 + Swarm.WAVE_SPEED_STEP * (this.#wave - 1));
  }

  #advanceWave() {
    this.#spawnedInWave += 1;
    if (this.#spawnedInWave < Swarm.ENEMIES_PER_WAVE) return;
    this.#spawnedInWave = 0;
    this.#wave += 1;
  }
}
