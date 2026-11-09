// Ejecutar con: node --test tests/*.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Entity, WORLD } from '../model/Entity.js';
import { Projectile } from '../model/Projectile.js';
import { Ship } from '../model/Ship.js';

const DT = 1 / 60;

const run = (ship, seconds, step = DT) => {
  for (let elapsed = 0; elapsed < seconds - step / 2; elapsed += step) ship.update(step);
};

test('ship accelerates toward steer direction', () => {
  const ship = new Ship();
  ship.steer(1);
  ship.update(0.016);
  assert.ok(ship.vx > 0);
});

test('ship never exceeds MAX_SPEED', () => {
  const ship = new Ship();
  ship.steer(1);
  for (let i = 0; i < 200; i++) {
    ship.update(DT);
    assert.ok(Math.abs(ship.vx) <= Ship.MAX_SPEED);
  }
});

test('ship slows by friction without input', () => {
  const ship = new Ship();
  ship.vx = 300;
  ship.steer(0);
  ship.update(DT);
  assert.ok(Math.abs(ship.vx) < 300);
});

test('ship stays inside WORLD', () => {
  const ship = new Ship();
  ship.steer(1);
  for (let i = 0; i < 500; i++) ship.update(DT);
  assert.ok(ship.x + ship.width <= WORLD.width);
  assert.equal(ship.vx, 0);
});

test('same distance at 60 and 120 fps', () => {
  const distance = (step) => {
    const ship = new Ship();
    const start = ship.x;
    ship.steer(1);
    run(ship, 0.2, step);
    return ship.x - start;
  };
  const at60 = distance(1 / 60);
  const at120 = distance(1 / 120);
  assert.ok(Math.abs(at60 - at120) / at120 < 0.03, `${at60} vs ${at120}`);
});

test('tryFire respects cooldown', () => {
  const ship = new Ship();
  assert.ok(ship.tryFire() instanceof Projectile);
  assert.equal(ship.tryFire(), null);
  ship.update(Ship.FIRE_COOLDOWN);
  assert.ok(ship.tryFire() instanceof Projectile);
});

test('hit makes ship invulnerable for INVULNERABLE_TIME', () => {
  const ship = new Ship();
  assert.equal(ship.isInvulnerable, false);
  ship.hit();
  assert.equal(ship.isInvulnerable, true);
  ship.update(Ship.INVULNERABLE_TIME - 0.1);
  assert.equal(ship.isInvulnerable, true);
  ship.update(0.2);
  assert.equal(ship.isInvulnerable, false);
});

test('overlaps is true only with real penetration', () => {
  const box = new Entity({ x: 0, y: 0, width: 10, height: 10 });
  assert.equal(box.overlaps(new Entity({ x: 5, y: 5, width: 10, height: 10 })), true);
  assert.equal(box.overlaps(new Entity({ x: 10, y: 0, width: 10, height: 10 })), false);
  assert.equal(box.overlaps(new Entity({ x: 50, y: 50, width: 10, height: 10 })), false);
});

test('ship projectile moves up and leaves world', () => {
  const shot = Projectile.fromShip(new Ship());
  assert.equal(shot.owner, 'ship');
  assert.ok(shot.vy < 0);
  assert.equal(shot.isOutOfWorld, false);
  for (let i = 0; i < 200; i++) shot.move(DT);
  assert.equal(shot.isOutOfWorld, true);
});

test('enemy projectile starts below the shooter and moves down', () => {
  const shooter = new Entity({ x: 100, y: 100, width: 40, height: 30 });
  const shot = Projectile.fromEnemy(shooter);
  assert.equal(shot.owner, 'enemy');
  assert.ok(shot.vy > 0);
  assert.equal(shot.y, shooter.y + shooter.height);
});
