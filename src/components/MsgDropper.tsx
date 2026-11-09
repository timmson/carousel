import type { ParsedParticipant } from '../types';
import { useState } from 'react';
import styles from './MsgDropper.module.css';

export function MsgDropper({ onParticipants }: { onParticipants: (p: ParsedParticipant[]) => void }) {
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      if (!file.name.toLowerCase().endsWith('.msg')) continue;
      try {
        const buffer = await file.arrayBuffer();

        // Импорт по требованию: парсер нужен только при дропе, он не должен
        // попадать в initial-бандл страницы.
        const { MsgReader } = await import('@npeersab/msgreader');
        const reader = new MsgReader(new Uint8Array(buffer));
        const { recipients } = reader.getFileData();

        const parsed: ParsedParticipant[] = (recipients ?? [])
          .map((r) => {
            const name = (r.name ?? '').trim();
            // У внутренних получателей SMTP-адрес лежит в smtpAddress, а email
            // может быть в формате X500 — берём его только как запасной.
            const email = (r.smtpAddress || (r.addressType === 'SMTP' ? r.email : '') || '').trim();
            return name || email ? { name: name || email, email } : null;
          })
          .filter((p): p is ParsedParticipant => p !== null);

        if (parsed.length === 0) {
          setError('В файле не найдено ни одного адресата.');
          return;
        }

        onParticipants(parsed);
        setError(null);
      } catch (e) {
        console.error('Error processing .msg:', e);
        setError(e instanceof Error ? e.message : 'Ошибка при чтении .msg файла');
      }
    }
  }

  return (
    <div className={styles.dropper}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer?.files ?? []);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <p className={styles.hint}>Перетащите сюда .msg файл из Outlook — адресаты подставятся сами</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
