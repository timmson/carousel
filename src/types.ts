export interface Participant {
  /** Стабильный идентификатор: не зависит от редактируемых полей. */
  id: string;
  name: string;
  email: string;
}

/** Участник, пришедший из разбора текста — идентификатор ещё не назначен. */
export type ParsedParticipant = Pick<Participant, 'name' | 'email'>;
