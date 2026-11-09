import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../model/Entity.js';
import { Enemy } from '../model/Enemy.js';
import { Projectile } from '../model/Projectile.js';
import { Match } from '../model/Match.js';

const newMatch = (difficulty = 'normal') => new Match(difficulty, () => 0.5);

/** Enemigo situado exactamente sobre la entidad indicada. */
const enemyOver = (kind, target) => {
  const enemy = new Enemy(kind, target.x, 1);
  enemy.y = target.y;
  return enemy;
};

const enemyFarFromShip = (kind) => {
  const enemy = new Enemy(kind, 100, 1);
  enemy.y = 100;
  return enemy;
};

const shipShotOn = (match, enemy) => {
  const shot = Projectile.fromShip(match.ship);
  shot.x = enemy.x + 1;
  shot.y = enemy.y + 1;
  match.projectiles.push(shot);
  return shot;
};

test('ship shot damages enemy and awards points when destroyed', () => {
  const match = newMatch();
  const enemy = enemyFarFromShip('drone');
  match.enemies.push(enemy);
  shipShotOn(match, enemy);
  match.resolveCollisions();
  assert.equal(match.score, enemy.points);
  assert.equal(match.enemies.length, 0);
  assert.equal(match.projectiles.length, 0);
});

test('gunner survives first shot and scores nothing', () => {
  const match = newMatch();
  const enemy = enemyFarFromShip('gunner');
  match.enemies.push(enemy);
  shipShotOn(match, enemy);
  match.resolveCollisions();
  assert.equal(match.score, 0);
  assert.equal(match.enemies.length, 1);
  assert.equal(match.projectiles.length, 0);
});

test('one shot damages only one of two overlapping enemies', () => {
  const match = newMatch();
  const first = enemyFarFromShip('drone');
  const second = enemyFarFromShip('drone');
  match.enemies.push(first, second);
  shipShotOn(match, first);
  match.resolveCollisions();
  assert.equal(match.enemies.length, 1);
  assert.equal(match.score, first.points);
});

test('enemy shot costs one life and removes the shot', () => {
  const match = newMatch();
  const shot = Projectile.fromEnemy(enemyFarFromShip('gunner'));
  shot.x = match.ship.x + 1;
  shot.y = match.ship.y + 1;
  match.projectiles.push(shot);
  match.resolveCollisions();
  assert.equal(match.lives, 2);
  assert.equal(match.projectiles.length, 0);
  assert.equal(match.ship.isInvulnerable, true);
});

test('enemy touching ship costs one life and destroys the enemy without points', () => {
  const match = newMatch();
  match.enemies.push(enemyOver('drone', match.ship));
  match.resolveCollisions();
  assert.equal(match.lives, 2);
  assert.equal(match.enemies.length, 0);
  assert.equal(match.score, 0);
});

test('invulnerable ship loses no life from contact', () => {
  const match = newMatch();
  match.ship.hit();
  match.enemies.push(enemyOver('drone', match.ship));
  match.resolveCollisions();
  assert.equal(match.lives, 3);
});

test('two enemies touching ship in one frame cost one life', () => {
  const match = newMatch();
  match.enemies.push(enemyOver('drone', match.ship), enemyOver('drone', match.ship));
  match.resolveCollisions();
  assert.equal(match.lives, 2);
});

test('escaped enemy costs one life even while invulnerable, and only once across frames', () => {
  const match = newMatch();
  match.ship.hit();
  const enemy = enemyFarFromShip('drone');
  enemy.y = WORLD.height + 1;
  match.enemies.push(enemy);
  match.update(0);
  assert.equal(match.lives, 2);
  match.update(0);
  match.update(0);
  assert.equal(match.lives, 2);
  assert.equal(match.enemies.length, 0);
});

test('lives never go below zero with several hits in one frame', () => {
  const match = new Match('hard', () => 0.5);
  match.ship.hit();
  for (let i = 0; i < 5; i++) {
    const enemy = enemyFarFromShip('drone');
    enemy.y = WORLD.height + 1;
    match.enemies.push(enemy);
  }
  match.update(0);
  assert.equal(match.lives, 0);
});

test('difficulty sets initial lives', () => {
  assert.equal(newMatch('easy').lives, Match.DIFFICULTIES.easy.lives);
  assert.equal(newMatch('normal').lives, Match.DIFFICULTIES.normal.lives);
  assert.equal(newMatch('hard').lives, Match.DIFFICULTIES.hard.lives);
});

test('update spawns enemies and reports the swarm wave', () => {
  const match = newMatch();
  assert.equal(match.wave, 1);
  match.update(Match.DIFFICULTIES.normal.spawnEvery);
  assert.equal(match.enemies.length, 1);
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

test('gunners add their shots during update', () => {
  const match = newMatch();
  match.enemies.push(enemyFarFromShip('gunner'));
  match.update(Enemy.KINDS.gunner.fireEvery + 0.01);
  assert.equal(match.projectiles.filter((shot) => shot.owner === 'enemy').length, 1);
});

test('shots that leave the world are removed', () => {
  const match = newMatch();
  match.fireShip();
  match.projectiles[0].y = -100;
  match.update(0);
  assert.equal(match.projectiles.length, 0);
});
