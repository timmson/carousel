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
  disabled: boolean;
}

export function ResultCard({ winner, visible, spinId, onSpinAgain, disabled }: ResultCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!visible || !winner || !cardRef.current) return;
    return fireConfetti(cardRef.current);
  }, [visible, spinId, winner]);

  if (!visible || !winner) return null;

  const hasEmail = winner.email.trim().length > 0;

  return (
    <div className={styles.wrapper} ref={cardRef}>
      <div key={spinId} className={styles.card} role="status" aria-live="assertive">
        <p className={styles.eyebrow}>Сегодня протокол ведёт:</p>
        <p className={styles.name}>{displayName(winner)}</p>
        {hasEmail ? <p className={styles.email}>{winner.email.trim()}</p> : null}
        <button type="button" className={styles.again} onClick={onSpinAgain} disabled={disabled}>
          Крутить ещё раз
        </button>
      </div>
    </div>
  );
}
