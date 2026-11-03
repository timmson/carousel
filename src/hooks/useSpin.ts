import { useCallback, useEffect, useRef, useState } from 'react';
import type { Participant } from '../types';
import { randomFloat, randomInt } from '../lib/random';
import { computeTargetRotation, sectorAtPointer } from '../lib/wheel';

const MIN_PARTICIPANTS = 2;
export const SPIN_DURATION_MS = 5000;
const MIN_TURNS = 5;
const EXTRA_TURNS = 3;
/** Запас на случай, если transitionend не придёт (фоновая вкладка, reduced motion). */
const FINISH_GRACE_MS = 400;

export type SpinPhase = 'idle' | 'spinning' | 'finished';

export interface SpinApi {
  phase: SpinPhase;
  isSpinning: boolean;
  rotation: number;
  spinDuration: number;
  winner: Participant | null;
  error: string | null;
  /** Счётчик завершённых вращений: меняет key, чтобы перезапустить анимации. */
  spinId: number;
  spin: (participants: Participant[]) => void;
  finish: () => void;
  reset: () => void;
}

/**
 * Механика вращения.
 *
 * Победитель выбирается программно и равновероятно (crypto.getRandomValues),
 * после чего вычисляется угол остановки, при котором именно этот сектор
 * гарантированно оказывается под стрелкой.
 */
export function useSpin(): SpinApi {
  const [phase, setPhase] = useState<SpinPhase>('idle');
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [spinId, setSpinId] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const targetRef = useRef(0);
  const eligibleRef = useRef<Participant[]>([]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finish = useCallback(() => {
    clearTimer();

    setPhase((current) => {
      if (current !== 'spinning') return current;

      const eligible = eligibleRef.current;
      const index = sectorAtPointer(targetRef.current, eligible.length);
      setWinner(eligible[index] ?? null);
      return 'finished';
    });
  }, [clearTimer]);

  useEffect(() => clearTimer, [clearTimer]);

  const spin = useCallback(
    (participants: Participant[]) => {
      if (phase === 'spinning') return;

      const eligible = participants.filter((p) => p.name.trim() || p.email.trim());

      if (eligible.length < MIN_PARTICIPANTS) {
        setError(
          eligible.length === 0
            ? 'Добавьте хотя бы двух участников, чтобы начать выбор.'
            : 'Нужен как минимум ещё один участник: сейчас подходящих в списке только ' +
                `${eligible.length}.`,
        );
        return;
      }

      clearTimer();
      setError(null);
      setWinner(null);
      setPhase('spinning');
      setSpinId((current) => current + 1);

      const winnerIndex = randomInt(eligible.length);
      const turns = MIN_TURNS + randomInt(EXTRA_TURNS);
      const target = computeTargetRotation(
        rotation,
        eligible.length,
        winnerIndex,
        turns,
        randomFloat,
      );

      eligibleRef.current = eligible;
      targetRef.current = target;
      setRotation(target);

      timerRef.current = setTimeout(finish, SPIN_DURATION_MS + FINISH_GRACE_MS);
    },
    [clearTimer, finish, phase, rotation],
  );

  const reset = useCallback(() => {
    clearTimer();
    setPhase('idle');
    setWinner(null);
    setError(null);
  }, [clearTimer]);

  return {
    phase,
    isSpinning: phase === 'spinning',
    rotation,
    spinDuration: SPIN_DURATION_MS,
    winner,
    spinId,
    error,
    spin,
    finish,
    reset,
  };
}
