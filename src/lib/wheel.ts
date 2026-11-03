/**
 * Геометрия колеса фортуны.
 *
 * Система отсчёта: угол измеряется в градусах по часовой стрелке от направления
 * «вверх» — именно туда указывает неподвижная стрелка. Сектор с индексом `i`
 * занимает интервал [i·slice, (i+1)·slice), а колесо поворачивается на `rotation`
 * градусов по часовой стрелке. Отсюда сектор под стрелкой — тот, для которого
 * (i·slice + rotation) mod 360 содержит 0.
 */

export const FULL_CIRCLE = 360;

/** Ширина одного сектора в градусах. */
export function sliceAngle(count: number): number {
  if (count < 1) throw new RangeError('Колесо должно иметь хотя бы один сектор');
  return FULL_CIRCLE / count;
}

/**
 * Итоговый угол поворота колеса, при котором выбранный сектор останавливается
 * под стрелкой.
 *
 * @param currentRotation Текущий (уже выполненный) поворот — чтобы вращение было непрерывным.
 * @param turns Количество полных оборотов до остановки.
 * @param jitter Доля сектора, на которую допускается отклонение от центра (0..1).
 */
export function computeTargetRotation(
  currentRotation: number,
  count: number,
  winnerIndex: number,
  turns: number,
  random: () => number,
  jitter = 0.7,
): number {
  if (winnerIndex < 0 || winnerIndex >= count) {
    throw new RangeError(`Индекс победителя ${winnerIndex} вне диапазона 0..${count - 1}`);
  }

  const slice = sliceAngle(count);
  const centreOfWinner = winnerIndex * slice + slice / 2;
  // Отклонение от центра сектора, чтобы колесо не останавливалось «под линеечку».
  const offset = (random() - 0.5) * slice * jitter;
  const desired = -(centreOfWinner + offset);

  const delta = (((desired - currentRotation) % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
  return currentRotation + turns * FULL_CIRCLE + delta;
}

/** Индекс сектора, оказавшегося под стрелкой при заданном повороте. */
export function sectorAtPointer(rotation: number, count: number): number {
  const slice = sliceAngle(count);
  const normalised = ((rotation % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
  const index = Math.floor(((FULL_CIRCLE - normalised) % FULL_CIRCLE) / slice);
  return Math.min(count - 1, Math.max(0, index));
}

/**
 * Палитра строится по золотому сечению: цвета гарантированно различимы и
 * равномерно распределены по тону при любом количестве участников.
 */
const GOLDEN_ANGLE = 137.50776405003785;

export function sectorColor(index: number, count: number): string {
  const hue = (index * GOLDEN_ANGLE + 12) % FULL_CIRCLE;
  // Нечётные сектора слегка различимы по светлоте — помогает при 2 участниках.
  // Чем больше секторов, тем они уже, поэтому палитру слегка осветляем.
  const base = index % 2 === 0 ? 46 : 40;
  const lightness = count > 12 ? base + 5 : base;
  return `hsl(${hue.toFixed(1)} 72% ${lightness}%)`;
}
