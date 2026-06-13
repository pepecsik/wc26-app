import { useState } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';

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
              <td className={styles.rank}>{p.rank}</td>
              <td className={styles.player}>
                <div className={styles.playerInner}>
                  {p.photo
                    ? <img src={p.photo} alt={p.name} className={styles.avatar} />
                    : <div className={styles.avatarInitials} style={{ background: p.color }}>{p.initials}</div>
                  }
                  <span className={styles.playerName}>{p.name}</span>
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
