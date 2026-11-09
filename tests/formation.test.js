import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLD } from '../model/Entity.js';
import { Enemy } from '../model/Enemy.js';
import { Formation } from '../model/Formation.js';

const SETTINGS = { stepEvery: 1, fireEvery: 1000 };
const newFormation = (settings = SETTINGS, random = () => 0) => new Formation(settings, random);
const positions = (formation) => formation.enemies.map(({ x, y }) => [x, y]);

test('formation starts with ROWS by COLUMNS enemies', () => {
  assert.equal(newFormation().enemies.length, Formation.ROWS * Formation.COLUMNS);
});

test('each row has a single enemy kind and rows score more toward the top', () => {
  const { enemies } = newFormation();
  const top = enemies.find((enemy) => enemy.y === Math.min(...enemies.map(({ y }) => y)));
  const bottom = enemies.find((enemy) => enemy.y === Math.max(...enemies.map(({ y }) => y)));
  assert.ok(top.points > bottom.points);
});

test('formation moves as a block sideways each stepEvery', () => {
  const formation = newFormation();
  const before = positions(formation);
  formation.update(0.5);
  assert.deepEqual(positions(formation), before);
  formation.update(0.5);
  formation.enemies.forEach((enemy, i) => {
    assert.equal(enemy.x, before[i][0] + Formation.STEP_X);
    assert.equal(enemy.y, before[i][1]);
  });
});

test('formation drops and reverses when it reaches the side', () => {
  const formation = newFormation();
  const [first] = formation.enemies;
  const startY = first.y;
  let guard = 0;
  while (first.y === startY && guard++ < 200) formation.update(1);
  assert.equal(first.y, startY + Formation.STEP_Y);
  const xAfterDrop = first.x;
  formation.update(1);
  assert.equal(first.x, xAfterDrop - Formation.STEP_X);
});

test('formation stays inside WORLD', () => {
  const formation = newFormation();
  for (let i = 0; i < 200; i++) {
    formation.update(1);
    formation.enemies.forEach((enemy) => {
      assert.ok(enemy.x >= 0);
      assert.ok(enemy.x + enemy.width <= WORLD.width);
    });
  }
});

test('formation marches faster as enemies are destroyed', () => {
  const formation = newFormation();
  const [survivor] = formation.enemies;
  formation.enemies.slice(1, 18).forEach((enemy) => formation.remove(enemy));
  const startX = survivor.x;
  formation.update(0.6);
  assert.notEqual(survivor.x, startX);
});

test('march does not depend on the frame rate with few enemies', () => {
  const finalPosition = (step, frames) => {
    const formation = newFormation({ stepEvery: 0.2, fireEvery: 1000 });
    const [survivor] = formation.enemies;
    formation.enemies.slice(1).forEach((enemy) => formation.remove(enemy));
    for (let i = 0; i < frames; i++) formation.update(step);
    return survivor.x;
  };
  const at30 = finalPosition(1 / 30, 9);
  const at120 = finalPosition(1 / 120, 36);
  assert.ok(Math.abs(at30 - at120) <= Formation.STEP_X, `${at30} vs ${at120}`);
});

test('every column can fire and always from its front enemy', () => {
  for (let column = 0; column < Formation.COLUMNS; column++) {
    const random = () => (column + 0.5) / Formation.COLUMNS;
    const formation = newFormation({ stepEvery: 1000, fireEvery: 1 }, random);
    const [shot] = formation.update(1);
    assert.equal(shot.y, formation.lowestEdge);
  }
});

test('only the front enemy of a column fires', () => {
  const formation = newFormation({ stepEvery: 1000, fireEvery: 1 });
  const [shot] = formation.update(1);
  assert.equal(shot.owner, 'enemy');
  assert.equal(shot.y, formation.lowestEdge);
});

test('when the front enemy dies the one above it can fire', () => {
  const formation = newFormation({ stepEvery: 1000, fireEvery: 1 });
  const [firstColumnFront] = formation.enemies
    .filter(({ x }) => x === formation.enemies[0].x)
    .sort((a, b) => b.y - a.y);
  formation.remove(firstColumnFront);
  const [shot] = formation.update(1);
  assert.equal(shot.y, firstColumnFront.y - Formation.CELL_HEIGHT + firstColumnFront.height);
});

test('formation fires nothing before fireEvery', () => {
  const formation = newFormation({ stepEvery: 1000, fireEvery: 1 });
  assert.deepEqual(formation.update(0.5), []);
});

test('isCleared is true only without enemies', () => {
  const formation = newFormation();
  assert.equal(formation.isCleared, false);
  [...formation.enemies].forEach((enemy) => formation.remove(enemy));
  assert.equal(formation.isCleared, true);
});

test('lowestEdge is the bottom of the lowest enemy', () => {
  const formation = newFormation();
  const lowest = Math.max(...formation.enemies.map(({ y, height }) => y + height));
  assert.equal(formation.lowestEdge, lowest);
  assert.ok(formation.enemies[0] instanceof Enemy);
});

test('top setting moves the whole formation down', () => {
  const high = newFormation();
  const low = newFormation({ ...SETTINGS, top: Formation.TOP + 44 });
  assert.equal(low.enemies[0].y, high.enemies[0].y + 44);
});
