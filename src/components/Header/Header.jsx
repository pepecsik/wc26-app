import styles from './Header.module.css';

export default function Header({ liveCount }) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span>⚽</span>
        <span>WC DRINKING GAME 2026</span>
        <span>🍺</span>
      </div>
      <nav className={styles.tabs}>
        <button className={`${styles.tab} ${styles.active}`}>
          Group Stage
          {liveCount > 0 && <span className={styles.liveBadge}>{liveCount} LIVE</span>}
        </button>
      </nav>
    </header>
  );
}
