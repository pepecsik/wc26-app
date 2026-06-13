import { useState } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import { usePlayerStats } from './hooks/usePlayerStats';
import styles from './App.module.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const { matches, loading, error, lastUpdated } = useMatches();
  const videoMap = useSheetData();
  const players  = usePlayerStats(matches, videoMap);
  const liveCount = matches.filter(m => m.isLive).length;

  return (
    <div className={styles.app}>
      <Header liveCount={liveCount} activeTab={activeTab} onTabChange={setActiveTab} lastUpdated={lastUpdated} />
      <main className={styles.main}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && activeTab === 'matches'   && <Feed matches={matches} videoMap={videoMap} />}
        {!loading && activeTab === 'stats'     && <StatsPage players={players} />}
        {!loading && activeTab === 'standings' && <StandingsPage matches={matches} />}
      </main>
    </div>
  );
}
