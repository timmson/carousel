import type { Participant } from '../types';
import styles from './ParticipantTable.module.css';

export interface ParticipantTableProps {
  participants: Participant[];
  onUpdate: (id: string, patch: Partial<Pick<Participant, 'name' | 'email'>>) => void;
  onRemove: (id: string) => void;
  onAddEmpty: () => void;
  onClear: () => void;
  disabled: boolean;
}

export function ParticipantTable({
  participants,
  onUpdate,
  onRemove,
  onAddEmpty,
  onClear,
  disabled,
}: ParticipantTableProps) {
  const hasAny = participants.some((p) => p.name.trim() || p.email.trim());

  const handleAdd = () => {
    if (disabled) return;
    onAddEmpty();
  };

  const handleClear = () => {
    if (disabled) return;
    onClear();
  };

  return (
    <section className={styles.card} aria-labelledby="table-title">
      <div className={styles.toolbar}>
        <h2 id="table-title" className={styles.title}>
          2. Отредактируй список{' '}
          <span className={styles.count} aria-live="polite">
            {participants.length}
          </span>
        </h2>
        <div className={styles.actions}>
          <button type="button" className={styles.btnSecondary} onClick={handleAdd} disabled={disabled}>
            + Добавить
          </button>
          <button type="button" className={styles.btnDanger} onClick={handleClear} disabled={disabled || participants.length === 0}>
            Очистить
          </button>
        </div>
      </div>

      {!hasAny && participants.length === 0 ? (
        <p className={styles.empty}>
          Список пуст. Вставьте список участников выше или добавьте вручную.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} scope="col">№</th>
                <th className={styles.th} scope="col">ФИО</th>
                <th className={styles.th} scope="col">Действие</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant, index) => (
                <tr key={participant.id} className={styles.tr}>
                  <td className={styles.td}>{index + 1}</td>
                  <td className={styles.td}>
                    <input
                      className={styles.input}
                      type="text"
                      value={participant.name}
                      onChange={(event) => onUpdate(participant.id, { name: event.target.value })}
                      placeholder={participant.email || 'Иванов Иван'}
                      disabled={disabled}
                      aria-label={`ФИО участника #${index + 1}`}
                    />
                  </td>
                  <td className={styles.td}>
                    <button
                      type="button"
                      className={styles.btnRemove}
                      onClick={() => onRemove(participant.id)}
                      disabled={disabled}
                      title="Удалить участника"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
