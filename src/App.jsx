import { useState, useEffect, useRef } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import AdminPage from './components/AdminPage/AdminPage';
import KnockoutPage from './components/KnockoutPage/KnockoutPage';
import KnockoutStatsPage from './components/KnockoutStatsPage/KnockoutStatsPage';
import DrinksTicker from './components/DrinksTicker/DrinksTicker';
import AlarmModal from './components/AlarmModal/AlarmModal';
import ShameBanner from './components/ShameBanner/ShameBanner';
import WallOfShame from './components/WallOfShame/WallOfShame';
import { useMatches } from './hooks/useMatches';
import { useSheetData } from './hooks/useSheetData';
import { usePlayerStats } from './hooks/usePlayerStats';
import { useTeamOwners } from './hooks/useTeamOwners';
import { useKOVideos } from './hooks/useKOVideos';
import styles from './App.module.css';

const IS_ADMIN    = window.location.pathname.startsWith('/admin');
const IS_KNOCKOUT = new URLSearchParams(window.location.search).has('knockout');
const THEME_PARAM = new URLSearchParams(window.location.search).get('theme');

const ALL_STAGES = [
  { id: 'groups', label: 'Groups' },
  { id: 'r32',    label: 'R32' },
  { id: 'r16',    label: 'R16' },
  { id: 'qf',     label: 'QF' },
  { id: 'sf',     label: 'SF · Final' },
];
const KO_ROUNDS    = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);
const TAB_FOR_ROUND = { R32: 'r32', R16: 'r16', QF: 'qf', SF: 'sf', FIN: 'sf', '3P': 'sf' };

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
  const [statsView,  setStatsView]        = useState('leaderboard');
  const stageDetected = useRef(false);

  function handleTabChange(tab) {
    setActiveTab(tab);
    localStorage.setItem('wc26-tab', tab);
  }
  const { matches: rawMatches, loading, error, lastUpdated } = useMatches();
  const { videoMap, sheetLoaded } = useSheetData();
  const { ownerMap } = useTeamOwners();
  const { koVideos } = useKOVideos();

  // Apply dynamic KO owner overrides from the Teams tab (falls back to static participants.js)
  // ownerMap (redrawn teams) only applies to KO matches — never bleed into group stage cards
  const matches = rawMatches.map(m => {
    const hExtra = KO_ROUNDS.has(m.round) ? (ownerMap[m.hCode] || []) : [];
    const aExtra = KO_ROUNDS.has(m.round) ? (ownerMap[m.aCode] || []) : [];
    return {
      ...m,
      hOwner: m.hOwner ?? hExtra[0] ?? null,
      aOwner: m.aOwner ?? aExtra[0] ?? null,
      hCoOwners: hExtra.filter(p => p.name !== m.hOwner?.name),
      aCoOwners: aExtra.filter(p => p.name !== m.aOwner?.name),
    };
  });

  const players  = usePlayerStats(matches, videoMap);
  const liveCount = matches.filter(m => m.isLive).length;
  const ago = useAgo(lastUpdated);

  const groupMatches = matches.filter(m => !KO_ROUNDS.has(m.round));
  const koTabsPresent = new Set(matches.map(m => TAB_FOR_ROUND[m.round]).filter(Boolean));
  const stages = ALL_STAGES.filter(s => s.id === 'groups' || koTabsPresent.has(s.id));

  // Auto-detect current stage: if all GROUP games done → R32
  useEffect(() => {
    if (loading || matches.length === 0 || stageDetected.current) return;
    stageDetected.current = true;
    const allGroupsDone = groupMatches.length > 0 && groupMatches.every(m => m.isFinished);
    setMatchStage(allGroupsDone ? 'r32' : 'groups');
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
      const hAllOwners = [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean);
      const aAllOwners = [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
      if ((m.hState === 'losing' || m.hState === 'draw') && !hHasVideo) hAllOwners.forEach(push);
      if (m.hState === 'draw' && !aHasVideo) aAllOwners.forEach(push);
      if (m.aState === 'losing' && !aHasVideo) aAllOwners.forEach(push);
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
      <main className={isShame ? styles.mainShame : (activeTab === 'matches' || activeTab === 'stats') ? styles.main : styles.mainPadded}>
        {loading && <div className={styles.status}>Loading matches…</div>}
        {error   && <div className={styles.error}>⚠️ {error}</div>}
        {!loading && activeTab === 'matches' && (
          <>
            <div className={styles.stageTabs}>
              {stages.map(s => (
                <button
                  key={s.id}
                  className={`${styles.stageTab} ${matchStage === s.id ? styles.stageTabActive : ''}`}
                  onClick={() => setMatchStage(s.id)}
                >{s.label}</button>
              ))}
            </div>
            {matchStage === 'groups'
              ? <Feed matches={groupMatches} videoMap={videoMap} koVideos={koVideos} />
              : <KnockoutPage stage={matchStage} matches={matches} koVideos={koVideos} />
            }
          </>
        )}
        {!loading && activeTab === 'stats' && (
          <>
            <div className={styles.stageTabs}>
              <button
                className={`${styles.stageTab} ${statsView === 'leaderboard' ? styles.stageTabActive : ''}`}
                onClick={() => setStatsView('leaderboard')}
              >Leaderboard</button>
              <button
                className={`${styles.stageTab} ${statsView === 'draw' ? styles.stageTabActive : ''}`}
                onClick={() => setStatsView('draw')}
              >Draw Board</button>
            </div>
            <KnockoutStatsPage realPlayers={players} view={statsView} matches={matches} koVideos={koVideos} ownerMap={ownerMap} />
          </>
        )}
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
