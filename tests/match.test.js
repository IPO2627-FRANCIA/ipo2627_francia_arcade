import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Formation } from '../model/Formation.js';
import { Projectile } from '../model/Projectile.js';
import { Ship } from '../model/Ship.js';
import { Match } from '../model/Match.js';

const newMatch = (difficulty = 'normal') => new Match(difficulty, () => 0);

const shotOn = (factory, match, target) => {
  const shot = factory(match.ship);
  shot.x = target.x + 1;
  shot.y = target.y + 1;
  match.projectiles.push(shot);
  return shot;
};
const shipShotOn = (match, target) => shotOn((ship) => Projectile.fromShip(ship), match, target);
const enemyShotOn = (match, target) => shotOn((ship) => Projectile.fromEnemy(ship), match, target);

test('ship shot destroys the enemy and awards its points', () => {
  const match = newMatch();
  const enemy = match.enemies[0];
  const total = match.enemies.length;
  shipShotOn(match, enemy);
  match.resolveCollisions();
  assert.equal(match.score, enemy.points);
  assert.equal(match.enemies.length, total - 1);
  assert.equal(match.projectiles.length, 0);
});

test('one shot destroys only one of two overlapping enemies', () => {
  const match = newMatch();
  const [first, second] = match.enemies;
  second.x = first.x;
  const total = match.enemies.length;
  shipShotOn(match, first);
  match.resolveCollisions();
  assert.equal(match.enemies.length, total - 1);
});

test('enemy shot costs one life, removes the shot and protects the ship', () => {
  const match = newMatch();
  enemyShotOn(match, match.ship);
  match.resolveCollisions();
  assert.equal(match.lives, 2);
  assert.equal(match.projectiles.length, 0);
  assert.equal(match.ship.isInvulnerable, true);
});

test('invulnerable ship loses no life and the shot passes', () => {
  const match = newMatch();
  match.ship.hit();
  enemyShotOn(match, match.ship);
  match.resolveCollisions();
  assert.equal(match.lives, 3);
  assert.equal(match.projectiles.length, 1);
});

test('two enemy shots in one frame cost one life', () => {
  const match = newMatch();
  enemyShotOn(match, match.ship);
  enemyShotOn(match, match.ship);
  match.resolveCollisions();
  assert.equal(match.lives, 2);
});

test('lives never go below zero', () => {
  const match = newMatch();
  for (let i = 0; i < 5; i++) {
    enemyShotOn(match, match.ship);
    match.resolveCollisions();
    match.ship.update(Ship.INVULNERABLE_TIME + 0.1);
    match.projectiles.length = 0;
  }
  assert.equal(match.lives, 0);
});

test('enemy shot erodes a barrier block and stops there', () => {
  const match = newMatch();
  const total = match.barrierBlocks.length;
  enemyShotOn(match, match.barrierBlocks[0]);
  match.resolveCollisions();
  assert.equal(match.barrierBlocks.length, total - 1);
  assert.equal(match.projectiles.length, 0);
});

test('ship shot erodes a barrier block too', () => {
  const match = newMatch();
  const total = match.barrierBlocks.length;
  shipShotOn(match, match.barrierBlocks[0]);
  match.resolveCollisions();
  assert.equal(match.barrierBlocks.length, total - 1);
  assert.equal(match.projectiles.length, 0);
});

test('enemy touching a barrier block erases it', () => {
  const match = newMatch();
  const total = match.barrierBlocks.length;
  const [enemy] = match.enemies;
  enemy.x = match.barrierBlocks[0].x;
  enemy.y = match.barrierBlocks[0].y;
  match.resolveCollisions();
  assert.ok(match.barrierBlocks.length < total);
});

test('barriers sit between the formation and the ship', () => {
  const match = newMatch();
  match.barrierBlocks.forEach(({ y, height }) => {
    assert.ok(y > match.enemies[0].y);
    assert.ok(y + height < match.ship.y);
  });
});

test('hasLanded reports the formation reaching the ship line', () => {
  const match = newMatch();
  assert.equal(match.hasLanded, false);
  const [enemy] = match.enemies;
  enemy.y = match.ship.y - enemy.height + 1;
  assert.equal(match.hasLanded, true);
});

test('clearing the formation starts a lower wave and rebuilds barriers', () => {
  const match = newMatch();
  const firstY = match.enemies[0].y;
  const blocks = match.barrierBlocks.length;
  match.barrierBlocks.pop();
  match.enemies.length = 0;
  match.update(0);
  assert.equal(match.wave, 2);
  assert.equal(match.enemies.length, Formation.ROWS * Formation.COLUMNS);
  assert.ok(match.enemies[0].y > firstY);
  assert.equal(match.barrierBlocks.length, blocks);
});

test('wave stays while enemies remain', () => {
  const match = newMatch();
  match.update(0);
  assert.equal(match.wave, 1);
});

test('difficulty sets initial lives', () => {
  for (const id of Object.keys(Match.DIFFICULTIES)) {
    assert.equal(newMatch(id).lives, Match.DIFFICULTIES[id].lives);
  }
});

test('formation shots are added during update', () => {
  const match = newMatch();
  match.update(Match.DIFFICULTIES.normal.fireEvery);
  assert.equal(match.projectiles.filter(({ owner }) => owner === 'enemy').length, 1);
});

test('fireShip adds a projectile only when the cooldown allows it', () => {
  const match = newMatch();
  match.fireShip();
  match.fireShip();
  assert.equal(match.projectiles.length, 1);
});

test('steerShip moves the ship on update', () => {
  const match = newMatch();
  const start = match.ship.x;
  match.steerShip(-1);
  match.update(0.1);
  assert.ok(match.ship.x < start);
});

test('shots that leave the world are removed', () => {
  const match = newMatch();
  match.fireShip();
  match.projectiles[0].y = -100;
  match.update(0);
  assert.equal(match.projectiles.length, 0);
});
