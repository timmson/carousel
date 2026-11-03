/**
 * Криптографически стойкие равномерные случайные значения.
 * Используется rejection sampling, чтобы избежать смещения (modulo bias).
 */

const UINT32_MAX = 0x100000000;

function randomUint32(): number {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0];
}

/** Равномерное целое из диапазона [0, maxExclusive). */
export function randomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive должен быть положительным целым, получено ${maxExclusive}`);
  }
  if (maxExclusive === 1) return 0;

  // Отбрасываем значения из «хвоста», из-за которого остаток от деления неровномерен.
  const limit = Math.floor(UINT32_MAX / maxExclusive) * maxExclusive;
  let value = randomUint32();
  while (value >= limit) {
    value = randomUint32();
  }
  return value % maxExclusive;
}

/** Равномерное вещественное число из диапазона [0, 1). */
export function randomFloat(): number {
  // 32 бита дают точность ~2.3e-10 — более чем достаточно для угла сектора.
  return randomUint32() / UINT32_MAX;
}
