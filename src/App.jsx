import { useState, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import AdminPage from './components/AdminPage/AdminPage';
import DrinksTicker from './components/DrinksTicker/DrinksTicker';
import AlarmModal from './components/AlarmModal/AlarmModal';
import WallOfShame from './components/WallOfShame/WallOfShame';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import { usePlayerStats } from './hooks/usePlayerStats';
import styles from './App.module.css';

const IS_ADMIN = window.location.pathname.startsWith('/admin');

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
  if (IS_ADMIN) return <AdminPage />;

  const [activeTab, setActiveTab]         = useState(() => localStorage.getItem('wc26-tab') || 'matches');
  const [standingsOpen, setStandingsOpen] = useState(false);

  function handleTabChange(tab) {
    setActiveTab(tab);
    localStorage.setItem('wc26-tab', tab);
  }
  const { matches, loading, error, lastUpdated } = useMatches();
  const { videoMap, sheetLoaded } = useSheetData();
  const players  = usePlayerStats(matches, videoMap);
  const liveCount = matches.filter(m => m.isLive).length;
  const ago = useAgo(lastUpdated);

  // Compute alarm queue once — same video-detection logic as MatchCard
  const [alarmQueue, setAlarmQueue] = useState(null);
  const alarmComputed = useRef(false);
  useEffect(() => {
    if (alarmComputed.current || !sheetLoaded || matches.length === 0) return;
    alarmComputed.current = true;
    const ALARM_MS    = 3 * 60 * 60 * 1000;
    const DEADLINE_MS = 26 * 60 * 60 * 1000;
    const TEST_MODE   = new URLSearchParams(window.location.search).has('testAlarm');
    const now = Date.now();
    const urgent = [];
    matches.forEach(m => {
      if (!m.isFinished) return;
      const deadline = m.kickoff.getTime() + DEADLINE_MS;
      const left = deadline - now;
      const inWindow = TEST_MODE ? true : (left > 0 && left <= ALARM_MS);
      if (!inWindow) return;
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      // Mirror MatchCard's hHasVideo / aHasVideo exactly
      const hHasVideo = m.hState === 'losing' ? !!(vi?.filename)
                      : m.hState === 'draw'   ? (vi?.drinks1 != null)
                      : false;
      const aHasVideo = m.aState === 'losing' ? !!(vi?.filename)
                      : m.aState === 'draw'   ? (vi?.drinks2 != null)
                      : false;
      if ((m.hState === 'losing' || m.hState === 'draw') && !hHasVideo && m.hOwner)
        urgent.push({ player: m.hOwner, left: TEST_MODE ? ALARM_MS : left });
      if (m.hState === 'draw' && !aHasVideo && m.aOwner)
        urgent.push({ player: m.aOwner, left: TEST_MODE ? ALARM_MS : left });
      if (m.aState === 'losing' && !aHasVideo && m.aOwner)
        urgent.push({ player: m.aOwner, left: TEST_MODE ? ALARM_MS : left });
    });
    urgent.sort((a, b) => a.left - b.left);
    setAlarmQueue(urgent);
  }, [matches, videoMap, sheetLoaded]);

  const isShame = activeTab === 'shame';

  return (
    <div className={styles.app}>
      <AlarmModal queue={alarmQueue} />
      {!isShame && <DrinksTicker players={players} />}
      {!isShame && <Header liveCount={liveCount} activeTab={activeTab} onTabChange={handleTabChange} />}
      {isShame && (
        <button className={styles.shameBack} onClick={() => handleTabChange('matches')}>✕</button>
      )}
      <main className={isShame ? styles.mainShame : activeTab === 'matches' ? styles.main : styles.mainPadded}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && activeTab === 'matches' && <Feed matches={matches} videoMap={videoMap} />}
        {!loading && activeTab === 'stats'   && <StatsPage players={players} />}
        {!loading && activeTab === 'shame'   && <WallOfShame matches={matches} videoMap={videoMap} />}
        {activeTab === 'matches' && ago && (
          <div className={styles.updatedPill}>{ago}</div>
        )}
      </main>

      {activeTab === 'matches' && (
        <button className={styles.standingsBtn} onClick={() => setStandingsOpen(true)}>
          <img src="/wc26-logo.svg" alt="Standings" className={styles.standingsBtnLogo} />
        </button>
      )}

      {standingsOpen && (
        <div className={styles.standingsModal} onClick={() => setStandingsOpen(false)}>
          <div className={styles.standingsSheet} onClick={e => e.stopPropagation()}>
            <button className={styles.standingsClose} onClick={() => setStandingsOpen(false)}>✕</button>
            <div className={styles.standingsTitle}>WC 2026 Standings</div>
            <StandingsPage matches={matches} />
          </div>
        </div>
      )}
    </div>
  );
}
