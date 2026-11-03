import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Wheel } from '../components/Wheel';
import { ParticipantTable } from '../components/ParticipantTable';
import { displayName, truncate } from '../lib/display';
import { sectorColor } from '../lib/wheel';
import type { Participant } from '../types';

function makeParticipants(count: number): Participant[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `p${index}`,
    name: `Участник номер ${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
}

const noop = () => {};

describe('Wheel rendering', () => {
  for (const count of [2, 3, 10, 20, 30]) {
    it(`renders ${count} sectors with distinct colors and labels`, () => {
      const participants = makeParticipants(count);
      const html = renderToStaticMarkup(
        <Wheel
          participants={participants}
          rotation={0}
          spinDuration={5000}
          isSpinning={false}
        />,
      );

      const sectorCount = (html.match(/<path d="M 200 200/g) ?? []).length;
      expect(sectorCount).toBe(count);

      for (const participant of participants) {
        expect(html).toContain(participant.name);
      }

      const colors = new Set(participants.map((_, index) => sectorColor(index, count)));
      expect(colors.size).toBe(count);
    });
  }

  it('renders an empty-state placeholder without participants', () => {
    const html = renderToStaticMarkup(
      <Wheel participants={[]} rotation={0} spinDuration={5000} isSpinning={false} />,
    );
    expect(html).toContain('Колесо пусто');
  });

  it('applies rotation and transition duration while spinning', () => {
    const html = renderToStaticMarkup(
      <Wheel
        participants={makeParticipants(4)}
        rotation={1234.5}
        spinDuration={5000}
        isSpinning
      />,
    );
    expect(html).toContain('rotate(1234.5deg)');
    expect(html).toContain('5000ms');
  });

  it('drops a removed participant from the wheel', () => {
    const all = makeParticipants(3);
    const html = renderToStaticMarkup(
      <Wheel
        participants={all.filter((p) => p.id !== 'p1')}
        rotation={0}
        spinDuration={5000}
        isSpinning={false}
      />,
    );
    expect(html).toContain('Участник номер 1');
    expect(html).not.toContain('Участник номер 2');
    expect(html).toContain('Участник номер 3');
  });
});

describe('ParticipantTable rendering', () => {
  it('renumbers rows automatically', () => {
    const html = renderToStaticMarkup(
      <ParticipantTable
        participants={makeParticipants(3)}
        onUpdate={noop}
        onRemove={noop}
        onAddEmpty={noop}
        onClear={noop}
        disabled={false}
      />,
    );

    expect(html).toContain('>1<');
    expect(html).toContain('>2<');
    expect(html).toContain('>3<');
  });

  it('locks all controls while spinning', () => {
    const html = renderToStaticMarkup(
      <ParticipantTable
        participants={makeParticipants(2)}
        onUpdate={noop}
        onRemove={noop}
        onAddEmpty={noop}
        onClear={noop}
        disabled
      />,
    );

    expect((html.match(/disabled=""/g) ?? []).length).toBeGreaterThanOrEqual(8);
  });

  it('shows instructions when the list is empty', () => {
    const html = renderToStaticMarkup(
      <ParticipantTable
        participants={[]}
        onUpdate={noop}
        onRemove={noop}
        onAddEmpty={noop}
        onClear={noop}
        disabled={false}
      />,
    );
    expect(html).toContain('Список пуст');
  });
});

describe('display helpers', () => {
  it('falls back to email when name is missing', () => {
    expect(displayName({ id: '1', name: '   ', email: 'ivan@example.com' })).toBe(
      'ivan@example.com',
    );
  });

  it('truncates long labels for narrow sectors', () => {
    const label = truncate('Долгофамилов Долгосергеевич Долгоотчествович', 12);
    expect(label.length).toBeLessThanOrEqual(12);
    expect(label.endsWith('…')).toBe(true);
  });
});
