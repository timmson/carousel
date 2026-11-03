/**
 * Лёгкое конфетти на Canvas без внешних зависимостей.
 * Canvas накладывается поверх контейнера результата и удаляется по завершении.
 */

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  spin: number;
  color: string;
  tilt: number;
}

const COLORS = [
  '#4f46e5',
  '#0891b2',
  '#059669',
  '#ca8a04',
  '#ea580c',
  '#dc2626',
  '#db2777',
  '#7c3aed',
];

const GRAVITY = 0.16;
const LIFETIME = 3200;
const PIECE_COUNT = 140;

function createPieces(width: number, height: number): Piece[] {
  const pieces: Piece[] = [];
  for (let index = 0; index < PIECE_COUNT; index += 1) {
    const fromLeft = index % 2 === 0;
    pieces.push({
      x: fromLeft ? width * 0.08 : width * 0.92,
      y: height * 0.55,
      vx: (fromLeft ? 1 : -1) * (2.5 + Math.random() * 4.5),
      vy: -(5 + Math.random() * 6),
      size: 6 + Math.random() * 7,
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      tilt: Math.random() * Math.PI * 2,
    });
  }
  return pieces;
}

export function fireConfetti(container: HTMLElement): () => void {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return () => {};
  }

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return () => {};

  const rect = container.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;';
  context.scale(dpr, dpr);

  container.appendChild(canvas);

  const pieces = createPieces(rect.width, rect.height);
  const startedAt = performance.now();
  let frameId = 0;

  const render = (now: number) => {
    const elapsed = now - startedAt;
    context.clearRect(0, 0, rect.width, rect.height);

    for (const piece of pieces) {
      piece.vy += GRAVITY;
      piece.vx *= 0.995;
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.spin;
      piece.tilt += 0.12;

      const fade = Math.max(0, 1 - elapsed / LIFETIME);
      context.save();
      context.globalAlpha = fade;
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.scale(1, Math.cos(piece.tilt) * 0.6 + 0.4);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context.restore();
    }

    if (elapsed < LIFETIME) {
      frameId = requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  };

  frameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frameId);
    canvas.remove();
  };
}
