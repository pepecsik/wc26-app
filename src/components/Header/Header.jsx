import { useState, useEffect } from 'react';
import styles from './Header.module.css';

function useAgo(lastUpdated) {
  const [ago, setAgo] = useState('');
  useEffect(() => {
    if (!lastUpdated) return;
    const tick = () => {
      const s = Math.floor((Date.now() - lastUpdated) / 1000);
      setAgo(s < 5 ? 'just now' : s < 60 ? `${s}s ago` : `${Math.floor(s / 60)}m ago`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);
  return ago;
}

export default function Header({ liveCount, activeTab, onTabChange, lastUpdated }) {
  const ago = useAgo(lastUpdated);
  return (
    <header className={styles.header}>
      <div className={styles.title}>
        <span className={styles.titleIcon}>⚽</span>
        <span className={styles.titleText}>WC Drinking Game 2026</span>
        <span className={styles.titleIcon}>🍺</span>
        {ago && <span className={styles.updatedPill}>{ago}</span>}
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
          Leaderboard
        </button>
        <button
          className={`${styles.tab} ${styles.tabSmall} ${activeTab === 'standings' ? styles.active : ''}`}
          onClick={() => onTabChange('standings')}
        >
          <img src="/wc26-logo.svg" alt="WC 2026" className={styles.standingsLogo} />
        </button>
      </nav>
    </header>
  );
}
