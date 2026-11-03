import type { ParsedParticipant } from '../types';

/**
 * Разбор списка участников, скопированного из Microsoft Outlook.
 *
 * Поддерживаемые форматы записи:
 *   - `ФИО <email@example.com>`
 *   - `"ФИО" <email@example.com>` (кавычки Outlook)
 *   - `email@example.com`
 *   - `ФИО` (без адреса)
 *
 * Разделители записей: `;`, `,` и переводы строк. Разделитель внутри `<...>`
 * или внутри кавычек игнорируется — так не ломаются адреса и ФИО вида «Иванов, И. И.».
 */

/**
 * Запятая — самый коварный разделитель: она регулярно встречается внутри ФИО
 * («Иванов, И. И.», «Smith, J.»). Поэтому запятая считается границей записей,
 * только если вокруг неё нет «ыменного» контекста: инициала сразу после неё
 * или инициала непосредственно перед ней. Точка с запятой и перевод строки
 * режут всегда.
 */
const INITIAL_AFTER_COMMA = /^\s*[A-ZА-ЯЁ][.]/;
const INITIAL_BEFORE_COMMA = /[A-ZА-ЯЁ]\.\s*$/;

function isCommaInsideName(raw: string, index: number): boolean {
  return (
    INITIAL_AFTER_COMMA.test(raw.slice(index + 1, index + 8)) ||
    INITIAL_BEFORE_COMMA.test(raw.slice(Math.max(0, index - 4), index))
  );
}

/** Разрезает строку на записи, не трогая разделители внутри <> и кавычек. */
function splitEntries(raw: string): string[] {
  const entries: string[] = [];
  let current = '';
  let angleDepth = 0;
  let inQuotes = false;

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
      continue;
    }

    if (!inQuotes) {
      if (char === '<') angleDepth += 1;
      if (char === '>') angleDepth = Math.max(0, angleDepth - 1);
    }

    const outsideName = !inQuotes && angleDepth === 0;
    const isSeparator =
      outsideName &&
      (char === ';' ||
        char === '\n' ||
        char === '\r' ||
        (char === ',' && !isCommaInsideName(raw, index)));

    if (isSeparator) {
      if (current.trim()) entries.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) entries.push(current.trim());
  return entries;
}

const EMAIL_IN_BRACKETS = /<\s*([^<>@\s]+@[^<>\s]+)\s*>/;
const BARE_EMAIL = /^[^<>@\s,;]+@[^<>@\s,;]+$/;

function cleanName(value: string): string {
  return value
    .replace(/^"|"$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Извлекает ФИО и email из одной записи. Возвращает null для пустых записей. */
export function parseEntry(entry: string): ParsedParticipant | null {
  const text = entry.replace(/\u00a0/g, ' ').trim();
  if (!text) return null;

  const bracketed = text.match(EMAIL_IN_BRACKETS);

  if (bracketed) {
    const email = bracketed[1].trim();
    const name = cleanName(text.replace(bracketed[0], ''));
    return { name, email };
  }

  // Outlook иногда отдаёт адрес без угловых скобок.
  if (BARE_EMAIL.test(text)) {
    return { name: '', email: text };
  }

  // Запись без адреса: оставляем ФИО, чтобы участник не терялся.
  const name = cleanName(text);
  return name ? { name, email: '' } : null;
}

/**
 * Разбирает вставленный текст в список участников:
 * убирает пустые записи и дубликаты (по email, а при его отсутствии — по ФИО).
 */
export function parseParticipants(raw: string): ParsedParticipant[] {
  const result: ParsedParticipant[] = [];
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();

  for (const entry of splitEntries(raw)) {
    const parsed = parseEntry(entry);
    if (!parsed) continue;

    const email = parsed.email.trim().toLowerCase();
    const name = parsed.name.trim();

    if (!email && !name) continue;

    if (email) {
      if (seenEmails.has(email)) continue;
      seenEmails.add(email);
    } else if (seenNames.has(name.toLowerCase())) {
      continue;
    }

    if (!email) seenNames.add(name.toLowerCase());

    result.push({ name, email });
  }

  return result;
}
