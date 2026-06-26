import { useState, useEffect } from 'react';
import styles from './KnockoutStatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';

const find = (name) => PARTICIPANTS.find(x => x.name === name);

const ROUND_RANK  = { GS: 0, R32: 1, R16: 2, QF: 3, SF: 4, Final: 5, W: 6 };
const ROUND_LABEL = { R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', Final: 'Final', W: '🏆' };

// Demo data — heading into Semi-Finals
// SF teams alive: 🇺🇸 USA · 🇯🇵 JPN · 🇧🇷 BRA · 🇩🇪 GER
//
// history entry: { code, type:'o'|'r', out:null|'GS'|'R32'|'R16'|'QF'|'SF', w, d }
// out:null = currently active team alive in the tournament
const DEMO = [
  { name:'Pepe',        history:[{code:'SAF',type:'o',out:'GS',w:0,d:0},{code:'JPN',type:'o',out:null,w:3,d:0}] },
  { name:'Adam',        history:[{code:'JOR',type:'o',out:'GS',w:0,d:0},{code:'USA',type:'o',out:null,w:3,d:0}] },
  { name:'Charlie',     history:[{code:'NOR',type:'o',out:'R16',w:1,d:2},{code:'GER',type:'o',out:null,w:3,d:0}] },
  { name:'Rand',        history:[{code:'TUN',type:'o',out:'R16',w:1,d:1},{code:'BRA',type:'o',out:null,w:3,d:0}] },
  { name:'Michael',     history:[{code:'SCO',type:'o',out:'R32',w:0,d:1},{code:'ECU',type:'o',out:null,w:3,d:0}] },
  { name:'Sabo',        history:[{code:'BOS',type:'o',out:'GS',w:0,d:0},{code:'MEX',type:'o',out:'R32',w:0,d:2},{code:'USA',type:'r',out:null,w:2,d:0}] },
  { name:'Kimbo',       history:[{code:'CPV',type:'o',out:'GS',w:0,d:0},{code:'MOR',type:'o',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Tobias',      history:[{code:'EGY',type:'o',out:'GS',w:0,d:0},{code:'ARG',type:'o',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Sebastian',   history:[{code:'PAR',type:'o',out:'GS',w:0,d:0},{code:'FRA',type:'o',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Purcy',       history:[{code:'CAN',type:'o',out:'R32',w:0,d:2},{code:'NED',type:'o',out:'QF',w:2,d:0},{code:'JPN',type:'r',out:null,w:0,d:0}] },
  { name:'Malou',       history:[{code:'CUR',type:'o',out:'GS',w:0,d:0},{code:'URU',type:'o',out:'R32',w:0,d:3},{code:'BRA',type:'r',out:null,w:2,d:0}] },
  { name:'Emma',        history:[{code:'CIV',type:'o',out:'R32',w:0,d:1},{code:'ENG',type:'o',out:'R16',w:1,d:2},{code:'GER',type:'r',out:null,w:1,d:0}] },
  { name:'J$',          history:[{code:'PAN',type:'o',out:'GS',w:0,d:0},{code:'TUR',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Rogier',      history:[{code:'QAT',type:'o',out:'GS',w:0,d:0},{code:'AUT',type:'o',out:'R16',w:1,d:1},{code:'FRA',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Blake',       history:[{code:'SWE',type:'o',out:'R32',w:0,d:2},{code:'CRO',type:'o',out:'QF',w:2,d:1},{code:'JPN',type:'r',out:null,w:0,d:0}] },
  { name:'Jimmy',       history:[{code:'ALG',type:'o',out:'GS',w:0,d:0},{code:'SEN',type:'o',out:'R16',w:1,d:3},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Nathanial',   history:[{code:'HAI',type:'o',out:'GS',w:0,d:0},{code:'BEL',type:'o',out:'R32',w:0,d:2},{code:'FRA',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Scotty2Hotty',history:[{code:'GHA',type:'o',out:'R32',w:0,d:1},{code:'POR',type:'o',out:'R16',w:1,d:2},{code:'MOR',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Tim',         history:[{code:'NZL',type:'o',out:'GS',w:0,d:0},{code:'SWI',type:'o',out:'R16',w:1,d:1},{code:'NED',type:'r',out:'QF',w:2,d:0},{code:'JPN',type:'r',out:null,w:0,d:0}], bonusDrinks:1 },
  { name:'Ali',         history:[{code:'UZB',type:'o',out:'R32',w:0,d:1},{code:'COL',type:'o',out:'R16',w:1,d:2},{code:'NED',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Russ',        history:[{code:'COD',type:'o',out:'GS',w:0,d:0},{code:'IRN',type:'o',out:'R32',w:0,d:1},{code:'MOR',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Sjaak',       history:[{code:'SAU',type:'o',out:'GS',w:0,d:0},{code:'ESP',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Will Hunt',   history:[{code:'IRQ',type:'o',out:'GS',w:0,d:0},{code:'AUS',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Chonga',      history:[{code:'CZE',type:'o',out:'GS',w:0,d:0},{code:'SKO',type:'o',out:'R32',w:0,d:1},{code:'NED',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
];

function buildPlayers(realPlayers = []) {
  return DEMO.map(d => {
    const p = find(d.name);
    const h = d.history;
    const real = realPlayers.find(r => r.name === d.name);

    const active = h.findLast(t => t.out === null) ?? h[h.length - 1];
    const isAlive = active.out === null;

    const bestRound = isAlive ? 'SF'
      : h.reduce((best, t) => {
          const r = t.out ?? 'SF';
          return ROUND_RANK[r] > ROUND_RANK[best] ? r : best;
        }, 'GS');

    const koWins   = h.reduce((s, t) => s + (t.w || 0), 0);
    const koLosses = h.filter(t => t.out && t.out !== 'GS').length;
    const koDrinks = h.reduce((s, t) => s + (t.d || 0), 0);
    const redraws  = h.filter(t => t.type === 'r').length;

    const gsDrinksTotal = real ? (real.drinksTotal ?? real.drinks) : (d.bonusDrinks || 0);
    const totalDrinks   = gsDrinksTotal + koDrinks;

    const videoDebt   = real ? (real.videoDebt ?? 0) : (totalDrinks > 2 ? 1 : 0);
    const gsDrinksDone = real ? (real.drinksDone ?? 0) : (totalDrinks - videoDebt);
    const drinksDone  = gsDrinksDone + koDrinks;

    // Win streak — knockout matches only
    const matchList = [];
    h.forEach(t => {
      if (t.out === 'GS') return;
      for (let i = 0; i < (t.w || 0); i++) matchList.push('W');
      if (t.out && t.out !== 'GS') matchList.push('L');
    });
    let streak = 0;
    for (let i = matchList.length - 1; i >= 0; i--) {
      if (matchList[i] === 'W') streak++;
      else break;
    }

    // Which original team flags to show (alive originals, or current redrawn)
    const aliveOriginals = h.filter(t => t.type === 'o' && t.out === null);
    const isRedrawn = redraws > 0;

    return {
      ...p,
      history: h,
      activeTeam: active,
      isAlive,
      bestRound,
      wins: koWins,
      losses: koLosses,
      draws: 0,
      drinks: totalDrinks,
      drinksDone,
      drinksTotal: totalDrinks,
      videoDebt,
      streak,
      redraws,
      isRedrawn,
      aliveOriginals,
      bonusDrinks: d.bonusDrinks || 0,
      matches: real?.matches ?? [],
      teams: h.map(t => t.code),
      activeTeamCode: active.code,
    };
  });
}

function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    const rDiff = ROUND_RANK[b.bestRound] - ROUND_RANK[a.bestRound];
    if (rDiff !== 0) return rDiff;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.drinks - b.drinks;
  });

  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (p.bestRound !== prev.bestRound || p.losses !== prev.losses || p.wins !== prev.wins) {
        rank = i + 1;
      }
    }
    return { ...p, rank };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MiniAvatar({ p }) {
  return p.photo
    ? <img src={p.photo} alt={p.name} className={styles.miniAvatar} />
    : <div className={styles.miniAvatarInitials} style={{ background: p.color }}>{p.initials}</div>;
}

function StatCard({ emoji, label, children }) {
  if (!children) return null;
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardLabel}>{emoji} {label}</div>
      <div className={styles.statCardBody}>{children}</div>
    </div>
  );
}

// OG holders: flag gets a subtle green border. Redrawn: plain flag.
function TeamFlags({ p }) {
  if (!p.isRedrawn && p.aliveOriginals.length > 0) {
    return (
      <>
        {p.aliveOriginals.map(t => (
          <span key={t.code} className={styles.ogFlag}>{TEAM_MAP[t.code]?.flag ?? ''}</span>
        ))}
      </>
    );
  }
  const flag = TEAM_MAP[p.activeTeam.code]?.flag ?? '';
  return <span className={styles.teamFlags}>{flag}</span>;
}

function DrawBoard({ players }) {
  const alive = players.filter(p => p.isAlive);
  const teamCodes = [...new Set(alive.map(p => p.activeTeam.code))];

  const byTeam = {};
  teamCodes.forEach(code => {
    byTeam[code] = alive
      .filter(p => p.activeTeam.code === code)
      .sort((a, b) => {
        const aOG = a.activeTeam.type === 'o';
        const bOG = b.activeTeam.type === 'o';
        return aOG === bOG ? 0 : aOG ? -1 : 1;
      });
  });

  const sortedCodes = [...teamCodes].sort((a, b) => byTeam[b].length - byTeam[a].length);

  return (
    <div className={styles.drawBoard}>
      {sortedCodes.map(code => {
        const team = TEAM_MAP[code];
        const teamPlayers = byTeam[code];
        return (
          <div key={code} className={styles.drawTeamCard}>
            <div className={styles.drawHeader}>
              <span className={styles.drawFlag}>{team?.flag}</span>
              <span className={styles.drawTeamName}>{team?.full ?? code}</span>
              <span className={styles.drawCount}>{teamPlayers.length} {teamPlayers.length === 1 ? 'player' : 'players'}</span>
            </div>
            <div className={styles.drawPlayers}>
              {teamPlayers.map(p => {
                const isOG = p.activeTeam.type === 'o';
                const entryIdx = p.history.indexOf(p.activeTeam);
                const drawnFrom = !isOG && entryIdx > 0 ? p.history[entryIdx - 1]?.out : null;
                return (
                  <div key={p.name} className={`${styles.drawPlayer} ${isOG ? styles.drawPlayerOG : ''}`}>
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className={styles.drawAvatar} />
                      : <div className={styles.drawAvatarInit} style={{ background: p.color }}>{p.initials}</div>
                    }
                    <span className={styles.drawName}>{p.name}</span>
                    {isOG
                      ? <span className={styles.drawOGBadge}>OG</span>
                      : drawnFrom && <span className={styles.drawSince}>since {drawnFrom}</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const LS_KEY = 'wc26-ko-ranks';
const TTL_MS = 24 * 60 * 60 * 1000;

export default function KnockoutStatsPage({ realPlayers = [], view = 'leaderboard' }) {
  const [selected, setSelected] = useState(null);
  const [arrows,   setArrows]   = useState({});
  const players  = buildPlayers(realPlayers);
  const ranked   = rankPlayers(players);

  useEffect(() => {
    if (ranked.length === 0) return;
    const now = Date.now();
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch {}
    const newStored = {};
    const newArrows = {};
    ranked.forEach(({ name, rank }) => {
      let { baseRank = rank, lastKnownRank = rank, lastMovedAt = null } = stored[name] ?? {};
      if (rank !== lastKnownRank) { lastMovedAt = now; lastKnownRank = rank; }
      const withinWindow = lastMovedAt !== null && (now - lastMovedAt) < TTL_MS;
      if (!withinWindow) { baseRank = rank; lastMovedAt = null; }
      newStored[name] = { baseRank, lastKnownRank, lastMovedAt };
      newArrows[name] = withinWindow && rank !== baseRank ? (rank < baseRank ? '↑' : '↓') : null;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(newStored));
    setArrows(newArrows);
  }, [ranked.length]);

  const hasFinished = true;
  const totalDrinks     = players.reduce((s, p) => s + p.drinks, 0);
  const totalDrinksDone = players.reduce((s, p) => s + p.drinksDone, 0);

  const maxDrinks   = Math.max(...players.map(p => p.drinksDone));
  const topDrinkers = maxDrinks > 0 ? players.filter(p => p.drinksDone === maxDrinks) : [];

  const cleanPlayers = players.filter(p => p.drinks === 0 && p.losses > 0);

  const maxStreak   = Math.max(...players.map(p => p.streak));
  const topStreakers = maxStreak > 0 ? players.filter(p => p.streak === maxStreak) : [];

  const debtPlayers = players.filter(p => p.videoDebt > 0).sort((a, b) => b.videoDebt - a.videoDebt);

  const alive      = ranked.filter(p => p.isAlive);
  const eliminated = ranked.filter(p => !p.isAlive);

  if (view === 'draw') {
    return (
      <div className={styles.page}>
        <DrawBoard players={players} />
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {hasFinished && (
        <div className={styles.funStats}>
          <div className={styles.funStatsTitle}>Knockout Stats</div>
          {totalDrinks > 0 && (
            <div className={styles.totalDrinks}>
              🍺 <span>{totalDrinks}</span> drinks owed · <span>{totalDrinksDone}</span> done
            </div>
          )}
          <div className={styles.statGrid}>
            {topDrinkers.length > 0 && (
              <StatCard emoji="🍺" label="Most Drinks">
                {topDrinkers.map(p => (
                  <div key={p.name} className={styles.debtRow}>
                    <MiniAvatar p={p} />
                    <span className={styles.statCardName}>{p.name}</span>
                    <span className={styles.statCardVal}>{p.drinksDone}x</span>
                  </div>
                ))}
              </StatCard>
            )}
            {cleanPlayers.length > 0 && (
              <StatCard emoji="😇" label="Still Clean">
                {cleanPlayers.map(p => (
                  <div key={p.name} className={styles.debtRow}>
                    <MiniAvatar p={p} />
                    <span className={styles.statCardName}>{p.name}</span>
                    <span className={styles.statCardVal}>
                      <TeamFlags p={p} />
                    </span>
                  </div>
                ))}
              </StatCard>
            )}
            {topStreakers.length > 0 && (
              <StatCard emoji="🔥" label="Win Streak">
                {topStreakers.map(p => (
                  <div key={p.name} className={styles.debtRow}>
                    <MiniAvatar p={p} />
                    <span className={styles.statCardName}>{p.name}</span>
                    <span className={styles.statCardVal}>{p.streak} in a row</span>
                  </div>
                ))}
              </StatCard>
            )}
            {debtPlayers.length > 0 && (
              <StatCard emoji="🎬" label="Video Debt">
                {debtPlayers.map(p => (
                  <div key={p.name} className={styles.debtRow}>
                    <MiniAvatar p={p} />
                    <span className={styles.statCardName}>{p.name}</span>
                    <span className={styles.statCardVal}>owes {p.videoDebt}</span>
                  </div>
                ))}
              </StatCard>
            )}
          </div>
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player</th>
            <th className={styles.thStat}>W</th>
            <th className={styles.thStat}>L</th>
            <th className={styles.thStat}>🍺</th>
            <th className={styles.thStat}>✓</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(p => <PlayerRow key={p.name} p={p} onClick={() => setSelected(p)} arrow={arrows[p.name]} />)}
        </tbody>
      </table>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PlayerRow({ p, onClick, arrow }) {
  return (
    <tr className={`${styles.row} ${p.isAlive ? styles.rowAlive : styles.rowEliminated}`} onClick={onClick}>
      <td className={styles.rank}>
        {p.rank}
        {arrow && (
          <span className={`${styles.rankArrow} ${arrow === '↑' ? styles.rankUp : styles.rankDown}`}>
            {arrow === '↑' ? '▲' : '▼'}
          </span>
        )}
      </td>
      <td className={styles.player}>
        <div className={styles.playerInner}>
          {p.photo
            ? <img src={p.photo} alt={p.name} className={styles.avatar} />
            : <div className={styles.avatarInitials} style={{ background: p.color }}>{p.initials}</div>
          }
          <div className={styles.playerNameBlock}>
            <span className={styles.playerName}>{p.name}</span>
            <TeamFlags p={p} />
          </div>
        </div>
      </td>
      <td className={`${styles.stat} ${styles.win}`}>{p.wins}</td>
      <td className={`${styles.stat} ${styles.loss}`}>{p.losses || ''}</td>
      <td className={`${styles.stat} ${styles.drink}`}>{p.drinks || ''}</td>
      <td className={`${styles.stat} ${styles.done}`}>{p.drinksDone || ''}</td>
    </tr>
  );
}
