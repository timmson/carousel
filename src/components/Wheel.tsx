import { memo } from 'react';
import type { Participant } from '../types';
import { sectorColor, sliceAngle } from '../lib/wheel';
import { displayName, truncate } from '../lib/display';
import styles from './Wheel.module.css';

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = CENTER - 6;
const INNER_RADIUS = 52;

function pointAt(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

function sectorPath(startAngle: number, endAngle: number): string {
  const start = pointAt(startAngle, RADIUS);
  const end = pointAt(endAngle, RADIUS);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z`;
}

function fontSizeFor(count: number): number {
  if (count <= 3) return 22;
  if (count <= 6) return 18;
  if (count <= 10) return 15;
  if (count <= 16) return 12.5;
  if (count <= 22) return 11;
  return 9.5;
}

interface SectorProps {
  participant: Participant;
  index: number;
  count: number;
}

const Sector = memo(function Sector({ participant, index, count }: SectorProps) {
  const slice = sliceAngle(count);
  const start = index * slice;
  const middle = start + slice / 2;
  const color = sectorColor(index, count);
  const fontSize = fontSizeFor(count);

  const available = RADIUS - INNER_RADIUS - 14;
  const maxChars = Math.max(4, Math.floor(available / (fontSize * 0.56)));
  const full = displayName(participant);
  const label = truncate(full, maxChars);

  // Текст идёт вдоль радиуса; в левой половине колеса переворачиваем его,
  // чтобы надписи не оказывались вверх ногами.
  const flipped = middle > 90 && middle < 270;
  const anchorRadius = flipped ? RADIUS - 14 : INNER_RADIUS;
  const origin = pointAt(middle, anchorRadius);
  const direction = flipped ? 90 - middle + 180 : 90 - middle;

  return (
    <g>
      <path d={sectorPath(start, start + slice)} fill={color} stroke="#ffffff" strokeWidth={1.2} />
      <text
        transform={`translate(${origin.x.toFixed(2)} ${origin.y.toFixed(2)}) rotate(${direction.toFixed(2)})`}
        x={0}
        y={0}
        dy={fontSize * 0.35}
        textAnchor="start"
        className={styles.label}
        fontSize={fontSize}
      >
        <title>{full}</title>
        {label}
      </text>
    </g>
  );
});

export interface WheelProps {
  participants: Participant[];
  rotation: number;
  spinDuration: number;
  isSpinning: boolean;
  /** Вызывается, когда анимация вращения реально завершилась. */
  onSpinEnd?: () => void;
  /** Вызывается при клике на колесо. */
  onSpin?: () => void;
  /** Сообщение, которое показывается вместо кнопки. */
  message?: string;
}

export const Wheel = memo(function Wheel({
  participants,
  rotation,
  spinDuration,
  isSpinning,
  onSpinEnd,
  onSpin,
  message,
}: WheelProps) {
  const count = participants.length;
  const canSpin = count >= 2 && !isSpinning;

  return (
    <div className={styles.stage}>
      <div className={styles.pointer} aria-hidden="true">
        <svg viewBox="0 0 44 46" width="44" height="46" focusable="false">
          <path d="M22 46 L2 10 A22 22 0 0 1 42 10 Z" fill="#312e81" />
          <circle cx="22" cy="14" r="7" fill="#eef2ff" />
        </svg>
      </div>

      <svg
        className={`${styles.svg} ${canSpin ? styles.svgClickable : ''}`}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role={canSpin ? 'button' : 'img'}
        aria-label={
          count > 0
            ? `Колесо выбора: ${count} ${count === 1 ? 'участник' : 'участников'}` +
              (canSpin ? '. Нажмите, чтобы крутить' : '')
            : 'Колесо выбора: список участников пуст'
        }
        onClick={onSpin}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSpin?.();
          }
        }}
        tabIndex={canSpin ? 0 : -1}
      >
        <circle className={styles.rim} cx={CENTER} cy={CENTER} r={CENTER - 1} />

        {count === 0 ? (
          <g className={styles.placeholder}>
            <circle cx={CENTER} cy={CENTER} r={RADIUS} className={styles.emptyDisc} />
            <text x={CENTER} y={CENTER - 8} textAnchor="middle" className={styles.emptyText}>
              Колесо пусто
            </text>
            <text x={CENTER} y={CENTER + 20} textAnchor="middle" className={styles.emptyHint}>
              добавьте участников
            </text>
          </g>
        ) : (
          <g
            className={styles.disc}
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: isSpinning ? `${spinDuration}ms` : '0ms',
            }}
            onTransitionEnd={(event) => {
              if (event.propertyName === 'transform') onSpinEnd?.();
            }}
          >
            {participants.map((participant, index) => (
              <Sector
                key={participant.id}
                participant={participant}
                index={index}
                count={count}
              />
            ))}
            <circle cx={CENTER} cy={CENTER} r={RADIUS} className={styles.innerShadow} />
          </g>
        )}

        <g className={styles.hub}>
          <circle cx={CENTER} cy={CENTER} r={44} />
          <circle cx={CENTER} cy={CENTER} r={36} className={styles.hubInner} />
          <text x={CENTER} y={CENTER + 12} textAnchor="middle" className={styles.hubIcon}>
            🎯
          </text>
        </g>
      </svg>

      {message ? (
        <p className={styles.hint} role={isSpinning ? undefined : 'status'}>
          {message}
        </p>
      ) : null}
    </div>
  );
});
