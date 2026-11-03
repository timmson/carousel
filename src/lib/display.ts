import type { Participant } from '../types';

/** Имя для отображения: при отсутствии ФИО показываем email. */
export function displayName(participant: Participant): string {
  const name = participant.name.trim();
  if (name) return name;
  return participant.email.trim() || 'Без имени';
}

export function initials(participant: Participant): string {
  const name = displayName(participant);
  const parts = name.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

/** Укорачивает длинное ФИО для сектора колеса. */
export function truncate(value: string, maxChars: number): string {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= maxChars) return collapsed;
  return `${collapsed.slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`;
}
