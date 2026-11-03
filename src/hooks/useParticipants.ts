import { useCallback, useMemo, useState } from 'react';
import type { ParsedParticipant, Participant } from '../types';

function createId(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface LoadResult {
  /** Сколько участников реально добавилось. */
  added: number;
  /** Сколько записей совпало с уже имеющимися. */
  skipped: number;
}

export interface ParticipantsApi {
  participants: Participant[];
  load: (parsed: ParsedParticipant[]) => LoadResult;
  addEmpty: () => void;
  update: (id: string, patch: Partial<Pick<Participant, 'name' | 'email'>>) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Состояние списка участников.
 * Идентификатор не зависит от полей, поэтому редактирование ФИО/email
 * не пересоздаёт сектор колеса и не теряет фокус в таблице.
 */
export function useParticipants(): ParticipantsApi {
  const [participants, setParticipants] = useState<Participant[]>([]);

  const load = useCallback(
    (parsed: ParsedParticipant[]): LoadResult => {
      const result: LoadResult = { added: 0, skipped: 0 };
      const appended: Participant[] = [];

      for (const item of parsed) {
        const email = normalizeEmail(item.email);
        const name = item.name.trim();

        if (!email && !name) {
          result.skipped += 1;
          continue;
        }

        appended.push({ id: createId(), name, email: item.email.trim() });
        result.added += 1;
      }

      // Новый список заменяет старый — предыдущие участники удаляются.
      setParticipants(appended);

      return result;
    },
    [],
  );

  const addEmpty = useCallback(() => {
    setParticipants((current) => [...current, { id: createId(), name: '', email: '' }]);
  }, []);

  const update = useCallback<ParticipantsApi['update']>((id, patch) => {
    setParticipants((current) =>
      current.map((participant) => (participant.id === id ? { ...participant, ...patch } : participant)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setParticipants((current) => current.filter((participant) => participant.id !== id));
  }, []);

  const clear = useCallback(() => {
    setParticipants([]);
  }, []);

  return useMemo(
    () => ({ participants, load, addEmpty, update, remove, clear }),
    [participants, load, addEmpty, update, remove, clear],
  );
}
