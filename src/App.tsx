import { useMemo, useState } from 'react';
import { Header } from './components/Header';
import { ParticipantInput } from './components/ParticipantInput';
import { ParticipantTable } from './components/ParticipantTable';
import { Wheel } from './components/Wheel';
import { ResultCard } from './components/ResultCard';
import { useParticipants } from './hooks/useParticipants';
import { useSpin } from './hooks/useSpin';
import styles from './App.module.css';

export function App() {
  const [text, setText] = useState('');
  const { participants, load, addEmpty, update, remove, clear } = useParticipants();
  const { isSpinning, rotation, spinDuration, winner, spinId, error, spin, finish } = useSpin();

  // Колесо и выбор работают по одному и тому же списку: пустые строки таблицы
  // не должны создавать сектор без имени.
  const wheelParticipants = useMemo(
    () => participants.filter((p) => p.name.trim() || p.email.trim()),
    [participants],
  );

  const canSpin = wheelParticipants.length >= 2 && !isSpinning;
  const showInstruction = participants.length === 0;
  const showTooFew = !isSpinning && wheelParticipants.length > 0 && wheelParticipants.length < 2;

  const handleSpin = () => {
    if (!canSpin) return;
    spin(wheelParticipants);
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Header />

        <div className={styles.layout}>
          <div className={styles.column}>
            <ParticipantInput text={text} setText={setText} onLoad={load} disabled={isSpinning} />
          </div>

          <div className={styles.column}>
            <ParticipantTable
              participants={participants}
              onUpdate={update}
              onRemove={remove}
              onAddEmpty={addEmpty}
              onClear={clear}
              disabled={isSpinning}
            />
          </div>

          <div className={styles.column}>
            <section className={styles.card} aria-labelledby="wheel-title">
              <h2 id="wheel-title" className={styles.cardTitle}>
                3. Крути колесо
              </h2>

              <Wheel
                participants={wheelParticipants}
                rotation={rotation}
                spinDuration={spinDuration}
                isSpinning={isSpinning}
                onSpinEnd={finish}
              />

              <button
                type="button"
                className={styles.spinButton}
                onClick={handleSpin}
                disabled={!canSpin}
                aria-busy={isSpinning}
              >
                {isSpinning ? 'Крутится…' : 'КРУТИТЬ!'}
              </button>

              {showInstruction ? (
                <p className={styles.note}>
                  Добавьте минимум двух участников — и колесо оживет.
                </p>
              ) : null}

              {showTooFew ? (
                <p className={styles.warning} role="alert">
                  Для выбора нужен хотя бы один дополнительный участник.
                </p>
              ) : null}

              {error ? (
                <p className={styles.warning} role="alert">
                  {error}
                </p>
              ) : null}

              <ResultCard
                winner={winner}
                visible={winner !== null && !isSpinning}
                spinId={spinId}
                onSpinAgain={handleSpin}
                disabled={!canSpin}
              />
            </section>
          </div>
        </div>

        <footer className={styles.footer}>
          Все данные обрабатываются в браузере и не покидают ваш компьютер.
        </footer>
      </div>
    </div>
  );
}
