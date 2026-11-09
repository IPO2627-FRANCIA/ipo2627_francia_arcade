import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../model/Entity.js';
import { Enemy } from '../model/Enemy.js';
import { Projectile } from '../model/Projectile.js';
import { Swarm } from '../model/Swarm.js';

const DT = 1 / 60;
const ALWAYS_DRONE = () => 0.5;
const ALWAYS_GUNNER = () => 0;

test('enemy descends and drifts inside WORLD', () => {
  const enemy = new Enemy('drone', 2, 1);
  const startY = enemy.y;
  const seenX = new Set();
  for (let i = 0; i < 300; i++) {
    enemy.update(DT);
    seenX.add(enemy.x);
    assert.ok(enemy.x >= 0);
    assert.ok(enemy.x + enemy.width <= WORLD.width);
  }
  assert.ok(enemy.vy > 0);
  assert.ok(enemy.y > startY);
  assert.ok(seenX.size > 1);
});

test('enemy at the right edge stays inside WORLD', () => {
  const enemy = new Enemy('gunner', WORLD.width - Enemy.KINDS.gunner.width, 1);
  for (let i = 0; i < 600; i++) {
    enemy.update(DT);
    assert.ok(enemy.x + enemy.width <= WORLD.width);
  }
});

test('enemy bounces off the left edge', () => {
  // cos(PI) = -1: la deriva empuja hacia la izquierda.
  const enemy = new Enemy('drone', Math.PI, 1);
  enemy.x = 0;
  enemy.update(DT);
  assert.equal(enemy.x, 0);
  enemy.update(DT);
  assert.ok(enemy.x > 0);
});

test('enemy bounces off the right edge', () => {
  // cos(2 * PI) = 1: la deriva empuja hacia la derecha.
  const enemy = new Enemy('drone', 2 * Math.PI, 1);
  const maxX = WORLD.width - enemy.width;
  enemy.x = maxX;
  enemy.update(DT);
  assert.equal(enemy.x, maxX);
  enemy.update(DT);
  assert.ok(enemy.x < maxX);
});

test('drone never fires', () => {
  const enemy = new Enemy('drone', 100, 1);
  for (let i = 0; i < 600; i++) {
    enemy.update(DT);
    assert.equal(enemy.tryFire(), null);
  }
});

test('gunner fires every fireEvery', () => {
  const enemy = new Enemy('gunner', 100, 1);
  const { fireEvery } = Enemy.KINDS.gunner;
  for (let cycle = 0; cycle < 2; cycle++) {
    enemy.update(fireEvery - 0.1);
    assert.equal(enemy.tryFire(), null);
    enemy.update(0.12);
    assert.ok(enemy.tryFire() instanceof Projectile);
    assert.equal(enemy.tryFire(), null);
  }
});

test('gunner needs two hits', () => {
  const enemy = new Enemy('gunner', 100, 1);
  enemy.damage();
  assert.equal(enemy.isDestroyed, false);
  enemy.damage();
  assert.equal(enemy.isDestroyed, true);
});

test('hasEscaped is true only past the bottom edge', () => {
  const enemy = new Enemy('drone', 100, 1);
  enemy.y = WORLD.height - 1;
  assert.equal(enemy.hasEscaped, false);
  enemy.y = WORLD.height + 1;
  assert.equal(enemy.hasEscaped, true);
});

test('speed factor scales descent', () => {
  assert.ok(new Enemy('drone', 100, 2).vy > new Enemy('drone', 100, 1).vy);
});

test('swarm spawns one enemy each spawnEvery', () => {
  const swarm = new Swarm({ speed: 1, spawnEvery: 1 }, ALWAYS_DRONE);
  assert.deepEqual(swarm.update(0.5), []);
  const spawned = swarm.update(0.5);
  assert.equal(spawned.length, 1);
  assert.ok(spawned[0] instanceof Enemy);
});

test('swarm uses random to choose kind and keeps x inside WORLD', () => {
  const swarm = new Swarm({ speed: 1, spawnEvery: 1 }, ALWAYS_GUNNER);
  const [enemy] = swarm.update(1);
  assert.equal(enemy.kind, 'gunner');
  assert.ok(enemy.x >= 0 && enemy.x + enemy.width <= WORLD.width);
});

test('swarm advances wave after ENEMIES_PER_WAVE spawns and speeds up later enemies', () => {
  const swarm = new Swarm({ speed: 1, spawnEvery: 1 }, ALWAYS_DRONE);
  assert.equal(swarm.wave, 1);
  const baseSpeed = Enemy.KINDS.drone.speed;
  for (let i = 0; i < Swarm.ENEMIES_PER_WAVE; i++) {
    const [enemy] = swarm.update(1);
    assert.equal(enemy.vy, baseSpeed);
  }
  assert.equal(swarm.wave, 2);
  const [later] = swarm.update(1);
  assert.equal(later.vy, baseSpeed * (1 + Swarm.WAVE_SPEED_STEP));
});
