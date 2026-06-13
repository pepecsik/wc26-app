import { useState, useEffect, useRef } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import { TEAM_MAP } from '../../data/teamMap';

const LS_KEY = 'wc26-ranks';

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

  // Read previous ranks once on mount (frozen baseline for this session)
  const [prevRanks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); }
    catch { return null; }
  });

  // On unmount (tab switch / close), save current ranks for next session
  const rankedRef = useRef(ranked);
  useEffect(() => { rankedRef.current = ranked; });
  useEffect(() => {
    return () => {
      const map = {};
      rankedRef.current.forEach(p => { map[p.name] = p.rank; });
      localStorage.setItem(LS_KEY, JSON.stringify(map));
    };
  }, []);

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
                {prevRanks?.[p.name] != null && prevRanks[p.name] !== p.rank && (
                  <span className={prevRanks[p.name] > p.rank ? styles.rankUp : styles.rankDown}>
                    {prevRanks[p.name] > p.rank ? '↑' : '↓'}
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
