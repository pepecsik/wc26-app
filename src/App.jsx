import { useState, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import { usePlayerStats } from './hooks/usePlayerStats';
import styles from './App.module.css';

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

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const { matches, loading, error, lastUpdated } = useMatches();
  const videoMap = useSheetData();
  const players  = usePlayerStats(matches, videoMap);
  const liveCount = matches.filter(m => m.isLive).length;
  const ago = useAgo(lastUpdated);

  return (
    <div className={styles.app}>
      <Header liveCount={liveCount} activeTab={activeTab} onTabChange={setActiveTab} />
      <main className={styles.main}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && activeTab === 'matches'   && <Feed matches={matches} videoMap={videoMap} />}
        {!loading && activeTab === 'stats'     && <StatsPage players={players} />}
        {!loading && activeTab === 'standings' && <StandingsPage matches={matches} />}
        {activeTab === 'matches' && ago && (
          <div className={styles.updatedPill}>{ago}</div>
        )}
      </main>
    </div>
  );
}
