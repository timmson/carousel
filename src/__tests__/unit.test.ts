import { describe, it, expect } from 'vitest';
import { parseParticipants } from '../lib/parseParticipants';
import { randomInt } from '../lib/random';
import { computeTargetRotation, sectorAtPointer } from '../lib/wheel';

describe('parseParticipants', () => {
  it('parses Outlook format with semicolons', () => {
    const result = parseParticipants(
      'Иванов Иван <ivan@example.com>; Петрова Мария <maria@example.com>',
    );
    expect(result).toEqual([
      { name: 'Иванов Иван', email: 'ivan@example.com' },
      { name: 'Петрова Мария', email: 'maria@example.com' },
    ]);
  });

  it('parses newline-separated entries', () => {
    const result = parseParticipants(
      'Иванов Иван <ivan@example.com>\nПетрова Мария <maria@example.com>',
    );
    expect(result).toHaveLength(2);
  });

  it('parses comma-separated entries', () => {
    const result = parseParticipants(
      'Иванов Иван <ivan@example.com>, Петрова Мария <maria@example.com>',
    );
    expect(result).toHaveLength(2);
  });

  it('deduplicates by email', () => {
    const result = parseParticipants(
      'Иванов Иван <ivan@example.com>; Иванов Иван <ivan@example.com>',
    );
    expect(result).toHaveLength(1);
  });

  it('handles names with commas inside', () => {
    const result = parseParticipants('Иванов, И. И. <ivan@example.com>');
    expect(result).toEqual([{ name: 'Иванов, И. И.', email: 'ivan@example.com' }]);
  });

  it('handles entries without email', () => {
    const result = parseParticipants('Иванов Иван');
    expect(result).toEqual([{ name: 'Иванов Иван', email: '' }]);
  });

  it('handles bare email addresses', () => {
    const result = parseParticipants('ivan@example.com');
    expect(result).toEqual([{ name: '', email: 'ivan@example.com' }]);
  });

  it('ignores empty entries', () => {
    const result = parseParticipants('  ;  ;  ');
    expect(result).toHaveLength(0);
  });

  it('handles mixed separators', () => {
    const result = parseParticipants(
      'A <a@test.com>; B <b@test.com>, C <c@test.com>',
    );
    expect(result).toHaveLength(3);
  });
});

describe('randomInt', () => {
  it('returns value in range [0, max)', () => {
    const max = 100;
    for (let i = 0; i < 500; i += 1) {
      const val = randomInt(max);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(max);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('returns 0 for max=1', () => {
    expect(randomInt(1)).toBe(0);
  });

  it('throws on invalid input', () => {
    expect(() => randomInt(0)).toThrow(RangeError);
    expect(() => randomInt(-1)).toThrow(RangeError);
    expect(() => randomInt(1.5)).toThrow(RangeError);
  });
});

describe('sectorAtPointer', () => {
  it('returns correct index for zero rotation', () => {
    expect(sectorAtPointer(0, 3)).toBe(0);
    expect(sectorAtPointer(0, 2)).toBe(0);
  });

  it('returns correct index after rotation', () => {
    const count = 4;
    const slice = 360 / count;
    // Rotate so sector 2 is at the pointer
    const rotation = 360 - (2 * slice + slice / 2);
    const index = sectorAtPointer(rotation, count);
    expect(index).toBe(2);
  });

  it('handles multiple full rotations', () => {
    expect(sectorAtPointer(720, 4)).toBe(0);
  });

  it('throws for negative count', () => {
    expect(() => sectorAtPointer(0, 0)).toThrow(RangeError);
  });
});

describe('computeTargetRotation', () => {
  it('computes a positive rotation', () => {
    const target = computeTargetRotation(0, 5, 0, 5, () => 0.5);
    expect(target).toBeGreaterThan(0);
  });

  it('returns a rotation >= current', () => {
    const target = computeTargetRotation(100, 5, 0, 5, () => 0.5);
    expect(target).toBeGreaterThanOrEqual(100);
  });

  it('throws for invalid winner index', () => {
    expect(() => computeTargetRotation(0, 3, -1, 3, () => 0.5)).toThrow(RangeError);
    expect(() => computeTargetRotation(0, 3, 3, 3, () => 0.5)).toThrow(RangeError);
  });

  it('sector at pointer matches winner index after rotation', () => {
    const count = 7;
    const winnerIndex = 4;
    const target = computeTargetRotation(0, count, winnerIndex, 5, () => 0.3);
    const index = sectorAtPointer(target, count);
    expect(index).toBe(winnerIndex);
  });
});
