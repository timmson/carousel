import { describe, it, expect } from 'vitest';
import {
  isLabelFlipped,
  labelMaxLength,
  labelRotation,
  labelStartRadius,
  sliceAngle,
} from '../lib/wheel';

const FULL = 360;
const rad = (degrees: number) => (degrees * Math.PI) / 180;

/** Вектор, в котором после `rotate(d)` смотрит ось текста (y экрана направлен вниз). */
function textDirection(rotation: number): [number, number] {
  return [Math.cos(rad(rotation)), Math.sin(rad(rotation))];
}

/** Направление «от центра колеса наружу» для середины сектора. */
function outward(middle: number): [number, number] {
  return [Math.sin(rad(middle)), -Math.cos(rad(middle))];
}

const dot = (a: [number, number], b: [number, number]) => a[0] * b[0] + a[1] * b[1];

const COUNTS = [2, 3, 4, 5, 7, 10, 16, 20, 30];
const FONT_SIZE = 12.5;
const INNER_RADIUS = 52;
const RADIUS = 194;
const HUB_RADIUS = 44;

describe('label orientation', () => {
  it('lays every label along its own radius, not across it', () => {
    for (const count of COUNTS) {
      const slice = sliceAngle(count);

      for (let index = 0; index < count; index += 1) {
        const middle = index * slice + slice / 2;
        // Косинус угла между осью текста и радиусом: ±1 — вдоль, 0 — поперёк.
        const alignment = Math.abs(dot(textDirection(labelRotation(middle)), outward(middle)));
        expect(alignment).toBeGreaterThan(0.999);
      }
    }
  });

  it('keeps labels upright: none of them reads right-to-left', () => {
    for (const count of COUNTS) {
      const slice = sliceAngle(count);

      for (let index = 0; index < count; index += 1) {
        const middle = index * slice + slice / 2;
        const { 0: dx } = textDirection(labelRotation(middle));
        expect(dx).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('reads outward on the right half and inward from the rim on the flipped half', () => {
    for (const count of COUNTS) {
      const slice = sliceAngle(count);

      for (let index = 0; index < count; index += 1) {
        const middle = index * slice + slice / 2;
        const alignment = dot(textDirection(labelRotation(middle)), outward(middle));

        if (isLabelFlipped(middle)) {
          expect(alignment).toBeLessThan(-0.999);
        } else {
          expect(alignment).toBeGreaterThan(0.999);
        }
      }
    }
  });

  it('flips exactly the sectors whose radius points to the left', () => {
    for (const count of COUNTS) {
      const slice = sliceAngle(count);

      for (let index = 0; index < count; index += 1) {
        const middle = index * slice + slice / 2;
        expect(isLabelFlipped(middle)).toBe(outward(middle)[0] < 0);
      }
    }
  });

  it('treats angles consistently across full turns', () => {
    expect(isLabelFlipped(0)).toBe(false);
    expect(isLabelFlipped(90)).toBe(false);
    expect(isLabelFlipped(180)).toBe(false);
    expect(isLabelFlipped(270)).toBe(true);
    expect(isLabelFlipped(270 + FULL)).toBe(true);
    expect(isLabelFlipped(-90)).toBe(true);
    expect(labelRotation(0)).toBeCloseTo(-90);
    expect(labelRotation(90)).toBeCloseTo(0);
    // 360° и 0° — один и тот же поворот, сравниваем через вектор оси текста.
    expect(textDirection(labelRotation(270))[0]).toBeCloseTo(1);
    expect(textDirection(labelRotation(270))[1]).toBeCloseTo(0);
  });
});

describe('label placement', () => {
  it('starts labels outside the hub so they are never hidden by it', () => {
    for (const count of COUNTS) {
      const fontSize = count <= 3 ? 22 : count <= 22 ? 11 : 9.5;
      expect(labelStartRadius(INNER_RADIUS, count, fontSize)).toBeGreaterThan(HUB_RADIUS);
    }
  });

  it('starts labels wide enough for the text to fit inside its own sector', () => {
    for (const count of COUNTS) {
      const slice = sliceAngle(count);
      const start = labelStartRadius(INNER_RADIUS, count, FONT_SIZE);
      const sectorWidth = 2 * start * Math.tan(rad(slice / 2));

      expect(sectorWidth).toBeGreaterThanOrEqual(FONT_SIZE);
    }
  });

  it('never lets a label run past the rim or back into the hub', () => {
    const margin = 12;
    const labelEnd = RADIUS - margin;

    for (const count of COUNTS) {
      const start = labelStartRadius(INNER_RADIUS, count, FONT_SIZE);
      const maxChars = labelMaxLength(start, labelEnd, FONT_SIZE);
      const textLength = maxChars * FONT_SIZE * 0.55;

      expect(start).toBeLessThan(labelEnd);
      expect(start + textLength).toBeLessThanOrEqual(labelEnd + FONT_SIZE * 0.55);
      expect(labelEnd - textLength).toBeGreaterThan(HUB_RADIUS);
    }
  });

  it('always allows at least a few characters', () => {
    for (const count of COUNTS) {
      const start = labelStartRadius(INNER_RADIUS, count, FONT_SIZE);
      expect(labelMaxLength(start, RADIUS - 12, FONT_SIZE)).toBeGreaterThanOrEqual(3);
    }
  });
});
