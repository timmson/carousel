import { useState } from 'react';
import type { Participant } from '../types';
import { parse as parseMsg } from 'msgreader';

export function MsgDropper({ onParticipants }: { onParticipants: (p: Participant[]) => void }) {
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.msg')) continue;
      try {
        const buffer = await file.arrayBuffer();
        const msg = parseMsg(buffer);
        const recips = msg.mailRecipients || [];
        const participants: Participant[] = recips.map((r: any) => ({
          id: crypto.randomUUID(),
          name: r.displayName ?? r.emailAddress?.name ?? '',
          email: r.emailAddress?.address ?? ''
        }));
        onParticipants(participants);
      } catch (e) {
        setError(String(e));
      }
    }
  }

  return (
    <div
      style={{ border: '2px dashed #aaa', padding: '1rem', textAlign: 'center' }}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer?.files ?? []);
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      Drag & drop .msg files here
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
