import { useState, useEffect } from 'react';
import styles from './KnockoutStatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';

const KO_SET    = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);
const ROUND_RANK = { GS: 0, R32: 1, R16: 2, QF: 3, SF: 4, '3P': 4, FIN: 5 };
const ROUND_LABEL = { GS: 'GS', R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', '3P': '3P', FIN: 'Final' };

function buildPlayers(matches, koVideos, ownerMap, realPlayers) {
  const koMatches  = matches.filter(m => KO_SET.has(m.round));
  const koFinished = koMatches.filter(m => m.isFinished);

  // Which round each team was eliminated in, and which rounds they appeared in
  const eliminated   = {};
  const roundPlayed  = {};
  koMatches.forEach(m => {
    [m.hCode, m.aCode].forEach(code => {
      if (!code) return;
      if (!roundPlayed[code] || ROUND_RANK[m.round] > ROUND_RANK[roundPlayed[code]]) {
        roundPlayed[code] = m.round;
      }
    });
    if (!m.isFinished) return;
    if (m.hState === 'losing') eliminated[m.hCode] = m.round;
    if (m.aState === 'losing') eliminated[m.aCode] = m.round;
  });

  return PARTICIPANTS.map(p => {
    const realP = realPlayers.find(r => r.name === p.name) || {};

    // Original draw teams (Teams 1-2 from participants.js)
    const origCodes    = p.teams || [];
    // Redraw teams (Teams 3-8 from Teams tab via ownerMap)
    const redrawnCodes = Object.entries(ownerMap)
      .filter(([, owners]) => owners.some(o => o.name === p.name))
      .map(([code]) => code);

    const allTeams = [
      ...origCodes.map(c => ({ code: c, type: 'o' })),
      ...redrawnCodes.map(c => ({ code: c, type: 'r' })),
    ];

    const aliveTeams     = allTeams.filter(t => !eliminated[t.code]);
    const isAlive        = aliveTeams.length > 0;
    const aliveOriginals = allTeams.filter(t => t.type === 'o' && !eliminated[t.code]);
    const activeTeam     = aliveTeams[0] || allTeams[allTeams.length - 1] || { code: null, type: 'o' };

    // Best round: highest round any of this player's teams appeared in
    let bestRound = 'GS';
    allTeams.forEach(t => {
      const r = roundPlayed[t.code];
      if (r && (ROUND_RANK[r] || 0) > (ROUND_RANK[bestRound] || 0)) bestRound = r;
    });

    // KO match stats
    let koWins = 0, koLosses = 0, koDrinks = 0, koVideoDebt = 0;

    const playerKOMatches = koFinished
      .filter(m => {
        const all = [m.hOwner, ...(m.hCoOwners || []), m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
        return all.some(o => o.name === p.name);
      })
      .sort((a, b) => a.kickoff - b.kickoff);

    playerKOMatches.forEach(m => {
      const matchKey = `${m.hCode}-${m.aCode}`;
      const hOwners  = [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean);
      const aOwners  = [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
      const ownsH    = hOwners.some(o => o.name === p.name);
      const ownsA    = aOwners.some(o => o.name === p.name);

      if (m.hState === 'winning' && ownsH) koWins++;
      if (m.aState === 'winning' && ownsA) koWins++;
      if (m.hState === 'losing'  && ownsH) koLosses++;
      if (m.aState === 'losing'  && ownsA) koLosses++;

      const kv = (koVideos[matchKey] || {})[p.name];
      if (kv?.drinks) koDrinks += kv.drinks;

      const isLoser = (m.hState === 'losing' && ownsH) || (m.aState === 'losing' && ownsA);
      if (isLoser && !kv?.filename) koVideoDebt++;
    });

    // Win streak (consecutive wins from end of match list)
    let streak = 0;
    for (let i = playerKOMatches.length - 1; i >= 0; i--) {
      const m       = playerKOMatches[i];
      const hOwners = [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean);
      const aOwners = [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
      const won = (m.hState === 'winning' && hOwners.some(o => o.name === p.name))
               || (m.aState === 'winning' && aOwners.some(o => o.name === p.name));
      if (won) streak++;
      else break;
    }

    const gsDrinks    = realP.drinksTotal ?? realP.drinks ?? 0;
    const gsDrinksDone = realP.drinksDone ?? 0;
    const gsVideoDebt = realP.videoDebt   ?? 0;
    const totalDrinks  = gsDrinks + koDrinks;
    const drinksDone   = gsDrinksDone + koDrinks;
    const videoDebt    = gsVideoDebt + koVideoDebt;

    return {
      ...p,
      history: allTeams.map(t => ({ ...t, out: eliminated[t.code] || null })),
      activeTeam,
      activeTeamCode: activeTeam.code,
      isAlive,
      bestRound,
      wins:         koWins,
      losses:       koLosses,
      drinks:       totalDrinks,
      drinksDone,
      drinksTotal:  totalDrinks,
      videoDebt,
      streak,
      redraws:      redrawnCodes.length,
      isRedrawn:    redrawnCodes.length > 0,
      aliveOriginals,
      matches:      realP.matches || [],
      teams:        allTeams.map(t => t.code),
    };
  });
}

function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    const rDiff = (ROUND_RANK[b.bestRound] || 0) - (ROUND_RANK[a.bestRound] || 0);
    if (rDiff !== 0) return rDiff;
    if (a.losses !== b.losses) return a.losses - b.losses;
    if (b.wins   !== a.wins)   return b.wins   - a.wins;
    return a.drinks - b.drinks;
  });
  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (p.bestRound !== prev.bestRound || p.losses !== prev.losses || p.wins !== prev.wins) rank = i + 1;
    }
    return { ...p, rank };
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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
  const flag = p.activeTeam?.code ? (TEAM_MAP[p.activeTeam.code]?.flag ?? '') : '';
  return <span className={styles.teamFlags}>{flag}</span>;
}

function DrawBoard({ players }) {
  const alive      = players.filter(p => p.isAlive);
  const teamCodes  = [...new Set(alive.map(p => p.activeTeam?.code).filter(Boolean))];
  const byTeam     = {};
  teamCodes.forEach(code => {
    byTeam[code] = alive
      .filter(p => p.activeTeam?.code === code)
      .sort((a, b) => (a.activeTeam.type === 'o') === (b.activeTeam.type === 'o') ? 0 : a.activeTeam.type === 'o' ? -1 : 1);
  });
  const sortedCodes = [...teamCodes].sort((a, b) => byTeam[b].length - byTeam[a].length);

  if (sortedCodes.length === 0) {
    return <div className={styles.comingSoon}>Redraws not yet finalised</div>;
  }

  return (
    <div className={styles.drawBoard}>
      {sortedCodes.map(code => {
        const team        = TEAM_MAP[code];
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
                const isOG      = p.activeTeam.type === 'o';
                const teamIdx   = p.history.findIndex(t => t.code === p.activeTeam.code);
                const drawnFrom = !isOG && teamIdx > 0 ? p.history[teamIdx - 1]?.out : null;
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

export default function KnockoutStatsPage({ realPlayers = [], view = 'leaderboard', matches = [], koVideos = {}, ownerMap = {} }) {
  const [selected, setSelected] = useState(null);
  const [arrows,   setArrows]   = useState({});

  const players = buildPlayers(matches, koVideos, ownerMap, realPlayers);
  const ranked  = rankPlayers(players);

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

  const hasKOData      = players.some(p => p.wins > 0 || p.losses > 0);
  const totalDrinks     = players.reduce((s, p) => s + p.drinks, 0);
  const totalDrinksDone = players.reduce((s, p) => s + p.drinksDone, 0);
  const maxDrinks       = Math.max(0, ...players.map(p => p.drinksDone));
  const topDrinkers     = maxDrinks > 0 ? players.filter(p => p.drinksDone === maxDrinks) : [];
  const cleanPlayers    = players.filter(p => p.drinks === 0 && p.losses > 0);
  const maxStreak       = Math.max(0, ...players.map(p => p.streak));
  const topStreakers    = maxStreak > 0 ? players.filter(p => p.streak === maxStreak) : [];
  const debtPlayers     = players.filter(p => p.videoDebt > 0).sort((a, b) => b.videoDebt - a.videoDebt);

  if (view === 'draw') {
    return (
      <div className={styles.page}>
        <DrawBoard players={players} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {hasKOData && (
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
                    <span className={styles.statCardVal}><TeamFlags p={p} /></span>
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
      <td className={`${styles.stat} ${styles.win}`}>{p.wins  || ''}</td>
      <td className={`${styles.stat} ${styles.loss}`}>{p.losses || ''}</td>
      <td className={`${styles.stat} ${styles.drink}`}>{p.drinks || ''}</td>
      <td className={`${styles.stat} ${styles.done}`}>{p.drinksDone || ''}</td>
    </tr>
  );
}
