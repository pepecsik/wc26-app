import { useState, useEffect } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import { TEAM_MAP } from '../../data/teamMap';

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

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
