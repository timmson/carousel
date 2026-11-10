import { useMemo } from 'react';
import { getQueryParam } from '../lib/url';
import styles from './Header.module.css';

const DEFAULT_TITLE = 'Кто ведёт протокол?';
const DEFAULT_SUBTITLE = 'Три простых шага для выбора';

export function Header() {
  const title = useMemo(
    () => getQueryParam('name') || DEFAULT_TITLE,
    [],
  );
  return (
    <header className={styles.header}>
      <div className={styles.badge} aria-hidden="true">
        📋
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{DEFAULT_SUBTITLE}</p>
    </header>
  );
}
