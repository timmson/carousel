import { useEffect, useRef } from 'react';
import type { Participant } from '../types';
import { displayName } from '../lib/display';
import { fireConfetti } from '../lib/confetti';
import styles from './ResultCard.module.css';

export interface ResultCardProps {
  winner: Participant | null;
  visible: boolean;
  /** Меняется при каждом новом выборе, чтобы перезапустить анимацию и конфетти. */
  spinId: number;
  onSpinAgain: () => void;
  onClose: () => void;
  disabled: boolean;
}

export function ResultCard({
  winner,
  visible,
  spinId,
  onSpinAgain,
  onClose,
  disabled,
}: ResultCardProps) {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const againRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!visible || !winner) return;

    const stopConfetti = overlayRef.current
      ? fireConfetti(overlayRef.current)
      : () => {};
    againRef.current?.focus();

    return stopConfetti;
  }, [visible, spinId, winner]);

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [visible, onClose]);

  if (!visible || !winner) return null;

  const hasEmail = winner.email.trim().length > 0;

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={onClose}>
      <div
        key={spinId}
        className={styles.card}
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ✕
        </button>

        <p className={styles.emoji} aria-hidden="true">
          🎉
        </p>
        <p id="result-title" className={styles.eyebrow}>
          Сегодня протокол ведёт:
        </p>
        <p className={styles.name}>{displayName(winner)}</p>
        {hasEmail ? <p className={styles.email}>{winner.email.trim()}</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.again}
            onClick={onSpinAgain}
            disabled={disabled}
            ref={againRef}
          >
            Крутить ещё раз
          </button>
          <button type="button" className={styles.dismiss} onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
