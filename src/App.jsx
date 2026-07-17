import { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header/Header';
import Feed from './components/Feed/Feed';
import StatsPage from './components/StatsPage/StatsPage';
import StandingsPage from './components/StandingsPage/StandingsPage';
import BracketView from './components/BracketView/BracketView';
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
  const [standingsTab,  setStandingsTab]  = useState('groups');
  const [matchStage, setMatchStage]       = useState('groups');
  const [statsView,  setStatsView]        = useState('leaderboard');
  const stageDetected = useRef(false);

  function handleTabChange(tab) {
    setActiveTab(tab);
    localStorage.setItem('wc26-tab', tab);
  }
  const { matches: rawMatches, loading, error, lastUpdated } = useMatches();
  const { videoMap, sheetLoaded } = useSheetData();
  const { ownerMap, ownersByRound } = useTeamOwners();
  const { koVideos } = useKOVideos();

  // Apply dynamic KO owner overrides from the Teams tab (falls back to static participants.js)
  // Use ownersByRound so R32 cards only show R32 redraw owners, not R16/QF/etc.
  const matches = useMemo(() => rawMatches.map(m => {
    const roundMap = KO_ROUNDS.has(m.round) ? (ownersByRound[m.round] || {}) : {};
    const hExtra = roundMap[m.hCode] || [];
    const aExtra = roundMap[m.aCode] || [];
    return {
      ...m,
      hOwner: m.hOwner ?? hExtra[0] ?? null,
      aOwner: m.aOwner ?? aExtra[0] ?? null,
      hCoOwners: hExtra.filter(p => p.name !== m.hOwner?.name),
      aCoOwners: aExtra.filter(p => p.name !== m.aOwner?.name),
    };
  }), [rawMatches, ownersByRound]);

  const rawPlayers = usePlayerStats(matches, videoMap);

  // Enrich players with KO video data and redraw team matches (usePlayerStats only sees
  // original teams + group stage videoMap, so KO videos and redrawn teams need patching here)
  const B2_KO_BASE = 'https://f005.backblazeb2.com/file/wc26-videos';
  const players = useMemo(() => rawPlayers.map(p => {
    const redrawnByRound = {};
    Object.entries(ownersByRound).forEach(([round, codeMap]) => {
      Object.entries(codeMap).forEach(([code, owners]) => {
        if (owners.some(o => o.name === p.name)) {
          if (!redrawnByRound[round]) redrawnByRound[round] = [];
          redrawnByRound[round].push(code);
        }
      });
    });

    function koEntry(hCode, aCode) {
      return koVideos[`${hCode}-${aCode}`]?.[p.name] ?? null;
    }

    // Patch KO videos onto existing matches (original teams in KO rounds)
    let updatedMatches = p.matches.map(m => {
      if (m.myVideo || !m.isFinished || (m.myState !== 'losing' && m.myState !== 'draw')) return m;
      const e = koEntry(m.teamCode, m.oppCode) ?? koEntry(m.oppCode, m.teamCode);
      if (!e?.filename) return m;
      const folder = e.folder || '02_R32';
      return {
        ...m,
        myVideo: e.filename,
        myVideo2: e.filename2 || null,
        myDrinkCount: e.drinks ?? 1,
        myEmoji: e.emoji || '🍺',
        myEmoji2: e.emoji2 || '',
        videoUrl: `${B2_KO_BASE}/${folder}/${encodeURIComponent(e.filename)}.mp4`,
        videoUrl2: e.filename2 ? `${B2_KO_BASE}/${folder}/${encodeURIComponent(e.filename2)}.mp4` : null,
      };
    });

    // Add matches for redrawn teams not yet in the list (only for the correct round)
    const seenIds = new Set(updatedMatches.map(m => `${m.id}-${m.teamCode}`));
    Object.entries(redrawnByRound).forEach(([round, codes]) => {
      codes.forEach(teamCode => {
      matches.forEach(m => {
        if (m.round !== round || seenIds.has(`${m.id}-${teamCode}`)) return;
        const isHome = m.hCode === teamCode;
        const isAway = m.aCode === teamCode;
        if (!isHome && !isAway) return;

        const myState  = isHome ? m.hState  : m.aState;
        const oppCode  = isHome ? m.aCode   : m.hCode;
        const myGoals  = isHome ? m.hGoals  : m.aGoals;
        const oppGoals = isHome ? m.aGoals  : m.hGoals;

        const e = koEntry(m.hCode, m.aCode);
        let myVideo = null, myVideo2 = null, videoUrl = null, videoUrl2 = null, myDrinkCount = 1, myEmoji = '🍺', myEmoji2 = '';
        if (e?.filename && m.isFinished && (myState === 'losing' || myState === 'draw')) {
          const f = e.folder || '02_R32';
          myVideo = e.filename;
          myDrinkCount = e.drinks ?? 1;
          myEmoji = e.emoji || '🍺';
          videoUrl = `${B2_KO_BASE}/${f}/${encodeURIComponent(e.filename)}.mp4`;
          if (e.filename2) {
            myVideo2 = e.filename2;
            myEmoji2 = e.emoji2 || '';
            videoUrl2 = `${B2_KO_BASE}/${f}/${encodeURIComponent(e.filename2)}.mp4`;
          }
        }

        updatedMatches.push({
          id: m.id, kickoff: m.kickoff,
          teamCode, oppCode, myGoals, oppGoals, myState,
          isFinished: m.isFinished, isLive: m.isLive,
          myVideo, myVideo2, myDrinkCount, myEmoji, myEmoji2,
          sideBetDrinks: m.sideBetDrinks ?? 0,
          videoUrl, videoUrl2,
        });
        seenIds.add(`${m.id}-${teamCode}`);
      });
      });
    });

    updatedMatches.sort((a, b) => a.kickoff - b.kickoff);

    const videosSent = updatedMatches.filter(m => m.myVideo).length;
    const drinksDone = (p.bonusDrinks ?? 0) + updatedMatches
      .filter(m => m.myVideo)
      .reduce((sum, m) => sum + (m.myDrinkCount ?? 1), 0);

    // Recalculate all counters from full match list (includes redrawn team matches)
    const finishedMs = updatedMatches.filter(m => m.isFinished);
    const wins   = finishedMs.filter(m => m.myState === 'winning').length;
    const losses = finishedMs.filter(m => m.myState === 'losing').length;
    const draws  = finishedMs.filter(m => m.myState === 'draw').length;
    const drinks = losses + draws;
    const drinksTotal = (p.bonusDrinks ?? 0) + finishedMs
      .filter(m => m.myState === 'losing' || m.myState === 'draw')
      .reduce((sum, m) => sum + (m.myVideo ? (m.myDrinkCount ?? 1) : 1 + (m.sideBetDrinks ?? 0)), 0);
    let streak = 0;
    for (let i = finishedMs.length - 1; i >= 0; i--) {
      if (finishedMs[i].myState === 'winning') streak++;
      else break;
    }

    // Recalculate side-bet and extra-drink counters to include KO matches
    const withVideo = updatedMatches.filter(m => m.myVideo);
    const sideBetDrinkCount = withVideo.reduce((sum, m) => sum + (m.sideBetDrinks ?? 0), 0);
    const extraVideoDrinks  = withVideo.reduce((sum, m) => sum + Math.max(0, (m.myDrinkCount ?? 1) - 1 - (m.sideBetDrinks ?? 0)), 0);

    return { ...p, matches: updatedMatches, wins, losses, draws, drinks, drinksTotal, videosSent, drinksDone, videoDebt: drinks - videosSent, streak, sideBetDrinkCount, extraVideoDrinks };
  }), [rawPlayers, koVideos, ownersByRound, matches]);

  const liveCount = matches.filter(m => m.isLive).length;
  const ago = useAgo(lastUpdated);

  const groupMatches = matches.filter(m => !KO_ROUNDS.has(m.round));
  const koTabsPresent = new Set(matches.map(m => TAB_FOR_ROUND[m.round]).filter(Boolean));

  // Teams that appear in any KO match but haven't lost one yet → green flag border in leaderboard
  const eliminatedCodes = new Set();
  matches.filter(m => KO_ROUNDS.has(m.round) && m.isFinished).forEach(m => {
    if (m.hState === 'losing') eliminatedCodes.add(m.hCode);
    if (m.aState === 'losing') eliminatedCodes.add(m.aCode);
  });
  const koTeamCodes = new Set(
    matches.filter(m => KO_ROUNDS.has(m.round)).flatMap(m => [m.hCode, m.aCode]).filter(Boolean)
  );
  const aliveCodes = new Set([...koTeamCodes].filter(c => !eliminatedCodes.has(c)));
  const stages = ALL_STAGES.filter(s => s.id === 'groups' || koTabsPresent.has(s.id));

  // Auto-detect current stage: advance to the most recent KO round with live/finished matches
  useEffect(() => {
    if (loading || matches.length === 0 || stageDetected.current) return;
    stageDetected.current = true;
    const allGroupsDone = groupMatches.length > 0 && groupMatches.every(m => m.isFinished);
    if (!allGroupsDone) { setMatchStage('groups'); return; }
    let detected = 'r32';
    ['r32', 'r16', 'qf', 'sf'].forEach(stage => {
      if (matches.some(m => TAB_FOR_ROUND[m.round] === stage && (m.isLive || m.isFinished))) detected = stage;
    });
    setMatchStage(detected);
  }, [loading, matches.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Compute alarm + overdue queues once — checks both group stage (videoMap) and KO (koVideos)
  const [alarmQueue, setAlarmQueue]   = useState(null);
  const [overdueQueue, setOverdueQueue] = useState([]);
  const alarmComputed = useRef(false);
  useEffect(() => {
    if (alarmComputed.current || !sheetLoaded || matches.length === 0) return;
    // Wait for KO video data before firing if there are finished KO matches
    const hasFinishedKO = matches.some(m => m.isFinished && KO_ROUNDS.has(m.round));
    if (hasFinishedKO && Object.keys(koVideos).length === 0) return;
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
      const push = (player) => {
        if (player?.name === 'Tim') return;
        const entry = { player, left: TEST_MODE ? ALARM_MS : left, deadline };
        (left <= 0 ? overdue : urgent).push(entry);
      };
      const hAllOwners = [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean);
      const aAllOwners = [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
      if (KO_ROUNDS.has(m.round)) {
        // KO: check per owner via koVideos
        const koMatch = koVideos[`${m.hCode}-${m.aCode}`] || {};
        if (m.hState === 'losing' || m.hState === 'draw')
          hAllOwners.forEach(o => { if (!koMatch[o.name]?.filename) push(o); });
        if (m.aState === 'losing' || m.aState === 'draw')
          aAllOwners.forEach(o => { if (!koMatch[o.name]?.filename) push(o); });
      } else {
        // Group stage: check via videoMap
        const vi = videoMap[`${m.hCode}-${m.aCode}`];
        const hHasVideo = m.hState === 'losing' ? !!(vi?.filename)
                        : m.hState === 'draw'   ? (vi?.drinks1 != null) : false;
        const aHasVideo = m.aState === 'losing' ? !!(vi?.filename)
                        : m.aState === 'draw'   ? (vi?.drinks2 != null) : false;
        if ((m.hState === 'losing' || m.hState === 'draw') && !hHasVideo) hAllOwners.forEach(push);
        if (m.hState === 'draw' && !aHasVideo) aAllOwners.forEach(push);
        if (m.aState === 'losing' && !aHasVideo) aAllOwners.forEach(push);
      }
    });
    urgent.sort((a, b) => a.left - b.left);
    overdue.sort((a, b) => a.left - b.left);
    // Only show banner/popup for entries overdue by less than 72h (older overdue is already dealt with)
    const MAX_OVERDUE_MS = 72 * 60 * 60 * 1000;
    const freshOverdue = overdue.filter(e => e.left >= -MAX_OVERDUE_MS);
    const combined = [...freshOverdue, ...urgent];
    setAlarmQueue(combined.length > 0 ? combined : null);
    setOverdueQueue(freshOverdue);
  }, [matches, videoMap, koVideos, sheetLoaded]);

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
            {statsView === 'leaderboard'
              ? <StatsPage players={players} aliveCodes={aliveCodes} ownerMap={ownerMap} />
              : <KnockoutStatsPage matches={matches} koVideos={koVideos} ownerMap={ownerMap} />
            }
          </>
        )}
        {!loading && activeTab === 'shame' && <WallOfShame matches={matches} videoMap={videoMap} />}
        {activeTab === 'matches' && ago && (
          <div className={styles.updatedPill}>{ago}</div>
        )}
      </main>

      {activeTab === 'matches' && (
        <button className={styles.standingsBtn} onClick={() => {
          // Auto-select bracket tab when KO is underway
          setStandingsTab(matchStage === 'groups' ? 'groups' : 'bracket');
          setStandingsOpen(true);
        }}>
          <img src="/wc26-logo.svg" alt="Standings" className={styles.standingsBtnLogo} />
        </button>
      )}

      {standingsOpen && (
        <div className={styles.standingsModal} onClick={() => setStandingsOpen(false)}>
          <div className={styles.standingsSheet} onClick={e => e.stopPropagation()}>
            <button className={styles.standingsClose} onClick={() => setStandingsOpen(false)}>✕</button>
            <div className={styles.standingsTitle}>WC 2026</div>
            <div className={styles.standingsTabs}>
              <button
                className={`${styles.standingsTabBtn} ${standingsTab === 'groups' ? styles.standingsTabActive : ''}`}
                onClick={() => setStandingsTab('groups')}
              >Groups</button>
              <button
                className={`${styles.standingsTabBtn} ${standingsTab === 'bracket' ? styles.standingsTabActive : ''}`}
                onClick={() => setStandingsTab('bracket')}
              >Bracket</button>
            </div>
            {standingsTab === 'groups'
              ? <StandingsPage matches={matches} />
              : <BracketView matches={matches} ownerMap={ownerMap} />
            }
          </div>
        </div>
      )}
    </div>
  );
}
