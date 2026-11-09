import { Entity, WORLD } from './Entity.js';

const GROUPS = 3;
const COLUMNS = 7;
const ROWS = 3;
const BLOCK_WIDTH = 14;
const BLOCK_HEIGHT = 12;
const TOP = 452;

/** Barreras destructibles: cada bloque desaparece con un solo impacto. */
export function createBarrierBlocks() {
  const groupWidth = COLUMNS * BLOCK_WIDTH;
  const gap = (WORLD.width - GROUPS * groupWidth) / (GROUPS + 1);
  const blocks = [];
  for (let group = 0; group < GROUPS; group++) {
    const left = gap + group * (groupWidth + gap);
    for (let row = 0; row < ROWS; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        blocks.push(new Entity({
          x: left + column * BLOCK_WIDTH,
          y: TOP + row * BLOCK_HEIGHT,
          width: BLOCK_WIDTH,
          height: BLOCK_HEIGHT,
        }));
      }
    }
  }
  return blocks;
}
