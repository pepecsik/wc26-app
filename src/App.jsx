import { useState, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import AdminPage from './components/AdminPage/AdminPage';
import KnockoutPage from './components/KnockoutPage/KnockoutPage';
import DrinksTicker from './components/DrinksTicker/DrinksTicker';
import AlarmModal from './components/AlarmModal/AlarmModal';
import ShameBanner from './components/ShameBanner/ShameBanner';
import WallOfShame from './components/WallOfShame/WallOfShame';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import { usePlayerStats } from './hooks/usePlayerStats';
import styles from './App.module.css';

const IS_ADMIN    = window.location.pathname.startsWith('/admin');
const IS_KNOCKOUT = new URLSearchParams(window.location.search).has('knockout');
const THEME_PARAM = new URLSearchParams(window.location.search).get('theme');

const STAGES = [
  { id: 'groups', label: 'Groups' },
  { id: 'r32',    label: 'R32' },
  { id: 'r16',    label: 'R16' },
  { id: 'qf',     label: 'QF' },
  { id: 'sf',     label: 'SF' },
  { id: 'final',  label: 'Final' },
];

// Apply theme variable set when ?theme=a (or other future themes)
if (THEME_PARAM) document.documentElement.dataset.theme = THEME_PARAM;

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
  if (IS_ADMIN)    return <AdminPage />;
  if (IS_KNOCKOUT) return <div className={styles.app}><KnockoutPage /></div>;

  const VALID_TABS = ['matches', 'stats', 'shame'];
  const [activeTab, setActiveTab] = useState(() => {
    const stored = localStorage.getItem('wc26-tab');
    return VALID_TABS.includes(stored) ? stored : 'matches';
  });
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [matchStage, setMatchStage]       = useState('groups');
  const stageDetected = useRef(false);

  function handleTabChange(tab) {
    setActiveTab(tab);
    localStorage.setItem('wc26-tab', tab);
  }
  const { matches, loading, error, lastUpdated } = useMatches();
  const { videoMap, sheetLoaded } = useSheetData();
  const players  = usePlayerStats(matches, videoMap);
  const liveCount = matches.filter(m => m.isLive).length;
  const ago = useAgo(lastUpdated);

  // Auto-detect current stage once matches load: if all group games done → R32
  useEffect(() => {
    if (loading || matches.length === 0 || stageDetected.current) return;
    stageDetected.current = true;
    const allDone = matches.every(m => m.isFinished);
    setMatchStage(allDone ? 'r32' : 'groups');
  }, [loading, matches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute alarm + overdue queues once — same video-detection logic as MatchCard
  const [alarmQueue, setAlarmQueue]   = useState(null);
  const [overdueQueue, setOverdueQueue] = useState([]);
  const alarmComputed = useRef(false);
  useEffect(() => {
    if (alarmComputed.current || !sheetLoaded || matches.length === 0) return;
    alarmComputed.current = true;
    const ALARM_MS    = 3 * 60 * 60 * 1000;
    const DEADLINE_MS = 26 * 60 * 60 * 1000;
    const TEST_MODE   = new URLSearchParams(window.location.search).has('testAlarm');
    const now = Date.now();
    const urgent = [];
    const overdue = [];
    matches.forEach(m => {
      if (!m.isFinished) return;
      const deadline = m.kickoff.getTime() + DEADLINE_MS;
      const left = deadline - now;
      const inWindow = TEST_MODE ? true : (left <= ALARM_MS);
      if (!inWindow) return;
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      const hHasVideo = m.hState === 'losing' ? !!(vi?.filename)
                      : m.hState === 'draw'   ? (vi?.drinks1 != null)
                      : false;
      const aHasVideo = m.aState === 'losing' ? !!(vi?.filename)
                      : m.aState === 'draw'   ? (vi?.drinks2 != null)
                      : false;
      const push = (player) => {
        if (player?.name === 'Tim') return; // hospital extension — no banner/alarm for Tim
        const entry = { player, left: TEST_MODE ? ALARM_MS : left, deadline };
        (left <= 0 ? overdue : urgent).push(entry);
      };
      if ((m.hState === 'losing' || m.hState === 'draw') && !hHasVideo && m.hOwner) push(m.hOwner);
      if (m.hState === 'draw' && !aHasVideo && m.aOwner) push(m.aOwner);
      if (m.aState === 'losing' && !aHasVideo && m.aOwner) push(m.aOwner);
    });
    urgent.sort((a, b) => a.left - b.left);
    overdue.sort((a, b) => a.left - b.left);
    setAlarmQueue([...overdue, ...urgent]);
    setOverdueQueue(overdue);
  }, [matches, videoMap, sheetLoaded]);

  const isShame = activeTab === 'shame';

  const [lightMode, setLightMode] = useState(false);
  function toggleMode() {
    setLightMode(m => {
      const next = !m;
      if (next) document.documentElement.dataset.mode = 'light';
      else delete document.documentElement.dataset.mode;
      return next;
    });
  }

  return (
    <div className={styles.app}>
      <ShameBanner overdueQueue={overdueQueue} />
      <AlarmModal queue={alarmQueue} />
      {THEME_PARAM && (
        <button className={styles.modeToggle} onClick={toggleMode} title="Toggle light/dark">
          {lightMode ? '🌙' : '☀️'}
        </button>
      )}
      {!isShame && <DrinksTicker players={players} />}
      {!isShame && <Header liveCount={liveCount} activeTab={activeTab} onTabChange={handleTabChange} />}
      {isShame && (
        <button className={styles.shameBack} onClick={() => handleTabChange('matches')}>✕</button>
      )}
      <main className={isShame ? styles.mainShame : activeTab === 'matches' ? styles.main : styles.mainPadded}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && activeTab === 'matches' && (
          <>
            <div className={styles.stageTabs}>
              {STAGES.map(s => (
                <button
                  key={s.id}
                  className={`${styles.stageTab} ${matchStage === s.id ? styles.stageTabActive : ''}`}
                  onClick={() => setMatchStage(s.id)}
                >{s.label}</button>
              ))}
            </div>
            {matchStage === 'groups'
              ? <Feed matches={matches} videoMap={videoMap} />
              : <KnockoutPage stage={matchStage} />
            }
          </>
        )}
        {!loading && activeTab === 'stats' && <StatsPage players={players} />}
        {!loading && activeTab === 'shame' && <WallOfShame matches={matches} videoMap={videoMap} />}
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
