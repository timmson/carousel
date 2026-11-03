import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.badge} aria-hidden="true">
        📋
      </div>
      <h1 className={styles.title}>Кто ведёт протокол?</h1>
      <p className={styles.subtitle}>
        Справедливый выбор ответственного за договорённости на встрече
      </p>
    </header>
  );
}
