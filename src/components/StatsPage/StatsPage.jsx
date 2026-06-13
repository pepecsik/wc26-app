import { useState } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';

const COLS = [
  { key: 'wins',   label: 'W' },
  { key: 'losses', label: 'L' },
  { key: 'draws',  label: 'D' },
  { key: 'drinks', label: '🍺' },
];

export default function StatsPage({ players }) {
  const [sortKey, setSortKey]     = useState('wins');
  const [sortDir, setSortDir]     = useState('desc');
  const [selected, setSelected]   = useState(null);

  function handleSort(key) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...players].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortDir === 'desc' ? -diff : diff;
  });

  return (
    <div className={styles.page}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player</th>
            {COLS.map(c => (
              <th
                key={c.key}
                className={`${styles.thStat} ${sortKey === c.key ? styles.active : ''}`}
                onClick={() => handleSort(c.key)}
              >
                {c.label}
                {sortKey === c.key && (
                  <span className={styles.arrow}>{sortDir === 'desc' ? '↓' : '↑'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={p.name} className={styles.row} onClick={() => setSelected(p)}>
              <td className={styles.rank}>{i + 1}</td>
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
