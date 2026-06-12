import styles from './Header.module.css';

export default function Header({ activeTab, onTabChange, liveCount }) {
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.trophy}>⚽</span>
        <span>WC2026</span>
        <span className={styles.beer}>🍺</span>
      </div>
      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'feed' ? styles.active : ''}`}
          onClick={() => onTabChange('feed')}
        >
          Feed
          {liveCount > 0 && <span className={styles.liveBadge}>{liveCount} LIVE</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => onTabChange('history')}
        >
          History
        </button>
      </nav>
    </header>
  );
}
