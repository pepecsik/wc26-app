import { useState, useEffect } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import { TEAM_MAP } from '../../data/teamMap';

function MiniAvatar({ p }) {
  return p.photo
    ? <img src={p.photo} alt={p.name} className={styles.miniAvatar} />
    : <div className={styles.miniAvatarInitials} style={{ background: p.color }}>{p.initials}</div>;
}

function StatCard({ emoji, label, children }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardLabel}>{emoji} {label}</div>
      <div className={styles.statCardBody}>{children}</div>
    </div>
  );
}

function FunStats({ players }) {
  const finished = players.filter(p => p.matches.some(m => m.isFinished));
  if (finished.length === 0) return null;

  const mostDrinks   = [...players].sort((a, b) => b.drinks - a.drinks)[0];
  const cleanPlayers = players.filter(p => p.drinks === 0 && p.matches.some(m => m.isFinished));
  const bestStreak   = [...players].sort((a, b) => b.streak - a.streak)[0];
  const mostDraws    = [...players].sort((a, b) => b.draws - a.draws)[0];
  const debtPlayers  = players.filter(p => p.videoDebt > 0).sort((a, b) => b.videoDebt - a.videoDebt);

  return (
    <div className={styles.funStats}>
      <div className={styles.funStatsTitle}>Group Stats</div>

      <div className={styles.statGrid}>
        {mostDrinks?.drinks > 0 && (
          <StatCard emoji="🍺" label="Most Drinks">
            <MiniAvatar p={mostDrinks} />
            <span className={styles.statCardName}>{mostDrinks.name}</span>
            <span className={styles.statCardVal}>{mostDrinks.drinks}x</span>
          </StatCard>
        )}

        {cleanPlayers.length > 0 && (
          <StatCard emoji="😇" label="Still Clean">
            <div className={styles.statCardAvatars}>
              {cleanPlayers.map(p => <MiniAvatar key={p.name} p={p} />)}
            </div>
          </StatCard>
        )}

        {bestStreak?.streak > 0 && (
          <StatCard emoji="🔥" label="Win Streak">
            <MiniAvatar p={bestStreak} />
            <span className={styles.statCardName}>{bestStreak.name}</span>
            <span className={styles.statCardVal}>{bestStreak.streak} in a row</span>
          </StatCard>
        )}

        {mostDraws?.draws > 0 && (
          <StatCard emoji="🤝" label="Most Draws">
            <MiniAvatar p={mostDraws} />
            <span className={styles.statCardName}>{mostDraws.name}</span>
            <span className={styles.statCardVal}>{mostDraws.draws}x</span>
          </StatCard>
        )}

        {debtPlayers.length > 0 && (
          <StatCard emoji="🎬" label="Video Debt">
            <div className={styles.statCardDebt}>
              {debtPlayers.map(p => (
                <div key={p.name} className={styles.debtRow}>
                  <MiniAvatar p={p} />
                  <span className={styles.statCardName}>{p.name}</span>
                  <span className={styles.statCardVal}>owes {p.videoDebt}</span>
                </div>
              ))}
            </div>
          </StatCard>
        )}
      </div>
    </div>
  );
}

const LS_KEY    = 'wc26-ranks';
const TTL_MS    = 24 * 60 * 60 * 1000;

function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    if (b.wins   !== a.wins)   return b.wins   - a.wins;
    if (a.losses !== b.losses) return a.losses  - b.losses;
    return a.draws - b.draws;
  });

  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (p.wins !== prev.wins || p.losses !== prev.losses || p.draws !== prev.draws) {
        rank = i + 1;
      }
    }
    return { ...p, rank };
  });
}

export default function StatsPage({ players }) {
  const [selected, setSelected] = useState(null);
  const ranked = rankPlayers(players);

  const [arrows, setArrows] = useState({});

  useEffect(() => {
    if (ranked.length === 0) return;
    const now = Date.now();
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch {}

    const newStored = {};
    const newArrows = {};

    ranked.forEach(({ name, rank }) => {
      let { baseRank = rank, lastKnownRank = rank, lastMovedAt = null } = stored[name] ?? {};

      // Detect movement since last poll → restart personal 24h clock
      if (rank !== lastKnownRank) {
        lastMovedAt = now;
        lastKnownRank = rank;
      }

      const withinWindow = lastMovedAt !== null && (now - lastMovedAt) < TTL_MS;

      if (!withinWindow) {
        // 24h without movement → arrow expires, new baseline
        baseRank    = rank;
        lastMovedAt = null;
      }

      newStored[name] = { baseRank, lastKnownRank, lastMovedAt };
      newArrows[name]  = withinWindow && rank !== baseRank
        ? (rank < baseRank ? '↑' : '↓')
        : null;
    });

    localStorage.setItem(LS_KEY, JSON.stringify(newStored));
    setArrows(newArrows);
  }, [ranked]);

  return (
    <div className={styles.page}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player</th>
            <th className={styles.thStat}>W</th>
            <th className={styles.thStat}>L</th>
            <th className={styles.thStat}>D</th>
            <th className={styles.thStat}>🍺</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(p => (
            <tr key={p.name} className={styles.row} onClick={() => setSelected(p)}>
              <td className={styles.rank}>
                {p.rank}
                {arrows[p.name] && (
                  <span className={arrows[p.name] === '↑' ? styles.rankUp : styles.rankDown}>
                    {arrows[p.name]}
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
                    <span className={styles.teamFlags}>
                      {p.teams.map(code => (TEAM_MAP[code]?.flag ?? '')).join('  ')}
                    </span>
                  </div>
                </div>
              </td>
              <td className={`${styles.stat} ${styles.win}`}>{p.wins}</td>
              <td className={`${styles.stat} ${styles.loss}`}>{p.losses}</td>
              <td className={`${styles.stat} ${styles.draw}`}>{p.draws}</td>
              <td className={`${styles.stat} ${styles.drink}`}>{p.drinks}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <FunStats players={ranked} />
      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
