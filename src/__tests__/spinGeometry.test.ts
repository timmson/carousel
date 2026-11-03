import { describe, it, expect } from 'vitest';
import { computeTargetRotation, sectorAtPointer, sliceAngle } from '../lib/wheel';

/**
 * Ключевое требование ТЗ: выбранный программно участник обязан совпадать
 * с сектором, который остановился под стрелкой.
 */
describe('spin geometry consistency', () => {
  const counts = [2, 3, 4, 7, 10, 16, 20, 30];
  const jitters = [0, 0.001, 0.25, 0.5, 0.75, 0.999, 1];

  for (const count of counts) {
    for (const jitterValue of jitters) {
      const jitter = jitterValue * 0.7;

      it(`points to the winner for ${count} participants (random=${jitterValue})`, () => {
        for (let winnerIndex = 0; winnerIndex < count; winnerIndex += 1) {
          const target = computeTargetRotation(
            0,
            count,
            winnerIndex,
            5,
            () => jitterValue,
            jitter,
          );

          expect(sectorAtPointer(target, count)).toBe(winnerIndex);
        }
      });
    }
  }

  it('always rotates forward by at least the requested number of turns', () => {
    for (const count of [2, 10, 30]) {
      for (let winnerIndex = 0; winnerIndex < count; winnerIndex += 1) {
        const turns = 5;
        const target = computeTargetRotation(37, count, winnerIndex, turns, () => 0.5);
        const delta = target - 37;

        expect(delta).toBeGreaterThanOrEqual(turns * 360);
        expect(delta).toBeLessThan((turns + 1) * 360);
      }
    }
  });

  it('keeps rotation monotonic when starting from a previous stop position', () => {
    let rotation = 0;

    for (let spin = 0; spin < 12; spin += 1) {
      const count = 5;
      const winnerIndex = spin % count;
      rotation = computeTargetRotation(rotation, count, winnerIndex, 6, () => 0.42);

      expect(rotation).toBeGreaterThan(0);
      expect(sectorAtPointer(rotation, count)).toBe(winnerIndex);
    }
  });

  it('covers the whole circle with sectors', () => {
    for (const count of counts) {
      expect(sliceAngle(count) * count).toBeCloseTo(360, 10);
    }
  });

  it('maps every angle to a valid sector index', () => {
    const count = 13;

    for (let degrees = -720; degrees <= 720; degrees += 1) {
      const index = sectorAtPointer(degrees, count);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(count);
    }
  });
});
