import styles from './Header.module.css';

export default function Header({ liveCount, activeTab, onTabChange }) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>⚽</span>
        <span className={styles.titleText}>WC Drinking Game 2026</span>
        <span className={styles.titleIcon}>🍺</span>
      </div>
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'matches' ? styles.active : ''}`}
          onClick={() => onTabChange('matches')}
        >
          Group Stage
          {liveCount > 0 && <span className={styles.liveBadge}>{liveCount} LIVE</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'stats' ? styles.active : ''}`}
          onClick={() => onTabChange('stats')}
        >
          Leaderboard / Stats
        </button>
      </nav>
    </header>
  );
}
