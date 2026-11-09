import { useState, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { parseParticipants } from '../lib/parseParticipants';
import type { ParsedParticipant } from '../types';
import type { LoadResult } from '../hooks/useParticipants';
import styles from './ParticipantInput.module.css';

export interface ParticipantInputProps {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  onLoad: (parsed: ParsedParticipant[]) => LoadResult;
  disabled: boolean;
}

function plural(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

function handleFiles(
  files: FileList,
  onParsed: (p: ParsedParticipant[]) => void,
  onError: (e: string) => void,
) {
  for (const file of Array.from(files)) {
    if (!file.name.toLowerCase().endsWith('.msg')) continue;
    file.arrayBuffer().then((buffer) => {
      import('@npeersab/msgreader').then(async ({ MsgReader }) => {
        const reader = new MsgReader(new Uint8Array(buffer));
        const { recipients } = reader.getFileData();

        const parsed: ParsedParticipant[] = (recipients ?? [])
          .map((r) => {
            const name = (r.name ?? '').trim();
            const email =
              (r.smtpAddress || (r.addressType === 'SMTP' ? r.email : '') || '').trim();
            return name || email ? { name: name || email, email } : null;
          })
          .filter((p): p is ParsedParticipant => p !== null);

        if (parsed.length === 0) {
          onError('В файле не найдено ни одного адресата.');
          return;
        }

        onParsed(parsed);
      }).catch((e) => {
        onError(e instanceof Error ? e.message : 'Ошибка при чтении .msg файла');
      });
    });
  }
}

export function ParticipantInput({ text, setText, onLoad, disabled }: ParticipantInputProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleLoad = useCallback(() => {
    const parsed = parseParticipants(text);
    onLoad(parsed);

    if (parsed.length === 0) {
      setFeedback('Не удалось распознать ни одного участника. Проверьте формат списка.');
      return;
    }

    setFeedback(`Добавлено: ${parsed.length} ${plural(parsed.length, 'участник', 'участника', 'участников')}.`);
    setError(null);
  }, [text, onLoad]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files, onLoad, setError);
    },
    [onLoad],
  );

  return (
    <section className={styles.card} aria-labelledby="participants-input-title">
      <h2 id="participants-input-title" className={styles.title}>
        1. Скопируй ФИО участников
      </h2>

      <textarea
        className={styles.textarea}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setFeedback(null);
        }}
        placeholder={'Иванов Иван <ivanov@example.com>;\nПетрова Мария <petrova@example.com>'}
        rows={5}
        spellCheck={false}
        disabled={disabled}
        aria-describedby="participants-input-title"
      />

      <div className={styles.row}>
        <button
          type="button"
          className={styles.primary}
          onClick={handleLoad}
          disabled={disabled || text.trim().length === 0}
        >
          Добавить участников
        </button>
        <button
          type="button"
          className={styles.ghost}
          onClick={() => {
            setText('');
            setFeedback(null);
          }}
          disabled={disabled || text.length === 0}
        >
          Очистить
        </button>
      </div>

      {feedback ? (
        <p className={styles.feedback} role="status">
          {feedback}
        </p>
      ) : null}

      <div
        className={`${styles.dropZone}${isDragOver ? ` ${styles.dragOver}` : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <p className={styles.dropHint}>
          или просто перенеси файл письма или встречи сюда
        </p>
        {error && <p className={styles.dropError} role="alert">{error}</p>}
      </div>
    </section>
  );
}
