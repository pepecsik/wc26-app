import { useState } from 'react';
import styles from './KnockoutStatsPage.module.css';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';

const find = (name) => PARTICIPANTS.find(x => x.name === name);

// Round order for ranking (higher index = better)
const ROUND_ORDER = { GS: 0, R32: 1, R16: 2, QF: 3, SF: 4, Final: 5, alive: 6 };
const ROUND_LABEL = { GS: 'Group Stage', R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', Final: 'Final', alive: 'Still in! 🔥' };

// Demo: simulated state mid-QF stage
// team: { code, status: 'GS'|'R32'|'R16'|'QF'|'SF'|'Final'|'alive', drinks: N }
const DEMO = [
  { name: 'Pepe',         teams: [{ code: 'SAF', status: 'R32', drinks: 3 }, { code: 'JPN', status: 'alive', drinks: 0 }] },
  { name: 'Sabo',         teams: [{ code: 'BOS', status: 'GS',  drinks: 0 }, { code: 'MEX', status: 'alive', drinks: 0 }] },
  { name: 'Adam',         teams: [{ code: 'JOR', status: 'GS',  drinks: 0 }, { code: 'USA', status: 'alive', drinks: 1 }] },
  { name: 'Charlie',      teams: [{ code: 'NOR', status: 'R16', drinks: 2 }, { code: 'GER', status: 'alive', drinks: 0 }] },
  { name: 'Rand',         teams: [{ code: 'TUN', status: 'R16', drinks: 1 }, { code: 'BRA', status: 'SF',  drinks: 0 }] },
  { name: 'Kimbo',        teams: [{ code: 'CPV', status: 'GS',  drinks: 0 }, { code: 'MOR', status: 'QF',  drinks: 2 }] },
  { name: 'Sebastian',    teams: [{ code: 'PAR', status: 'GS',  drinks: 0 }, { code: 'FRA', status: 'QF',  drinks: 1 }] },
  { name: 'Purcy',        teams: [{ code: 'CAN', status: 'R32', drinks: 2 }, { code: 'NED', status: 'QF',  drinks: 0 }] },
  { name: 'Blake',        teams: [{ code: 'SWE', status: 'R16', drinks: 1 }, { code: 'CRO', status: 'R32', drinks: 2 }] },
  { name: 'Emma',         teams: [{ code: 'CIV', status: 'R32', drinks: 1 }, { code: 'ENG', status: 'R16', drinks: 2 }] },
  { name: 'Rogier',       teams: [{ code: 'QAT', status: 'GS',  drinks: 0 }, { code: 'AUT', status: 'R16', drinks: 1 }] },
  { name: 'Tobias',       teams: [{ code: 'EGY', status: 'GS',  drinks: 0 }, { code: 'ARG', status: 'R16', drinks: 3 }] },
  { name: 'Ali',          teams: [{ code: 'UZB', status: 'R32', drinks: 1 }, { code: 'COL', status: 'R16', drinks: 2 }] },
  { name: 'Michael',      teams: [{ code: 'SCO', status: 'R32', drinks: 2 }, { code: 'ECU', status: 'R16', drinks: 1 }] },
  { name: 'J$',           teams: [{ code: 'PAN', status: 'GS',  drinks: 0 }, { code: 'TUR', status: 'R32', drinks: 2 }] },
  { name: 'Jimmy',        teams: [{ code: 'ALG', status: 'GS',  drinks: 0 }, { code: 'SEN', status: 'R16', drinks: 3 }] },
  { name: 'Malou',        teams: [{ code: 'CUR', status: 'GS',  drinks: 0 }, { code: 'URU', status: 'R32', drinks: 3 }] },
  { name: 'Nathanial',    teams: [{ code: 'HAI', status: 'GS',  drinks: 0 }, { code: 'BEL', status: 'R32', drinks: 2 }] },
  { name: 'Scotty2Hotty', teams: [{ code: 'GHA', status: 'R32', drinks: 1 }, { code: 'POR', status: 'R16', drinks: 2 }] },
  { name: 'Russ',         teams: [{ code: 'COD', status: 'GS',  drinks: 0 }, { code: 'IRN', status: 'R32', drinks: 1 }] },
  { name: 'Sjaak',        teams: [{ code: 'SAU', status: 'GS',  drinks: 0 }, { code: 'ESP', status: 'R32', drinks: 2 }] },
  { name: 'Tim',          teams: [{ code: 'NZL', status: 'GS',  drinks: 0 }, { code: 'SWI', status: 'R16', drinks: 1 }], bonusDrinks: 1 },
  { name: 'Will Hunt',    teams: [{ code: 'IRQ', status: 'GS',  drinks: 0 }, { code: 'AUS', status: 'R32', drinks: 2 }] },
  { name: 'Chonga',       teams: [{ code: 'CZE', status: 'GS',  drinks: 0 }, { code: 'SKO', status: 'R32', drinks: 1 }] },
];

function buildPlayers() {
  return DEMO.map(d => {
    const p = find(d.name);
    const bestRound = d.teams.reduce((best, t) =>
      ROUND_ORDER[t.status] > ROUND_ORDER[best] ? t.status : best, 'GS');
    const totalDrinks = d.teams.reduce((s, t) => s + (t.drinks || 0), 0) + (d.bonusDrinks || 0);
    return { ...p, ...d, bestRound, totalDrinks };
  }).sort((a, b) => {
    const rDiff = ROUND_ORDER[b.bestRound] - ROUND_ORDER[a.bestRound];
    if (rDiff !== 0) return rDiff;
    return a.totalDrinks - b.totalDrinks; // fewer drinks = better rank
  });
}

const MEDAL = ['🥇', '🥈', '🥉'];

function TeamPill({ team }) {
  const flag = TEAM_MAP[team.code]?.flag ?? '🏳️';
  const isAlive = team.status === 'alive';
  const isGS = team.status === 'GS';
  return (
    <span className={`${styles.pill} ${isAlive ? styles.pillAlive : isGS ? styles.pillGS : styles.pillOut}`}>
      {flag} {isAlive ? '🔥' : ROUND_LABEL[team.status]}
    </span>
  );
}

function StatMini({ emoji, label, rows }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{emoji} {label}</div>
      {rows.map((r, i) => (
        <div key={i} className={styles.statRow}>
          {r.photo
            ? <img src={r.photo} alt={r.name} className={styles.statAvatar} />
            : <div className={styles.statAvatarInit} style={{ background: r.color }}>{r.initials}</div>
          }
          <span className={styles.statName}>{r.name.split(' ')[0]}</span>
          <span className={styles.statVal}>{r.val}</span>
        </div>
      ))}
    </div>
  );
}

export default function KnockoutStatsPage() {
  const [view, setView] = useState('leaderboard'); // 'leaderboard' | 'shame'
  const players = buildPlayers();

  const alive = players.filter(p => p.bestRound === 'alive');
  const eliminated = players.filter(p => p.bestRound !== 'alive');

  // Fun stat: most drinks
  const topDrinkers = [...players].sort((a, b) => b.totalDrinks - a.totalDrinks).slice(0, 3)
    .filter(p => p.totalDrinks > 0)
    .map(p => ({ ...p, val: `🍺 ${p.totalDrinks}` }));

  // Fun stat: still alive
  const survivors = alive.map(p => ({
    ...p,
    val: p.teams.filter(t => t.status === 'alive').map(t => TEAM_MAP[t.code]?.flag ?? '').join(' '),
  }));

  // Fun stat: pain index (most drinks among eliminated)
  const mostPain = [...eliminated].sort((a, b) => b.totalDrinks - a.totalDrinks).slice(0, 3)
    .filter(p => p.totalDrinks > 0)
    .map(p => ({ ...p, val: `😵 ${p.totalDrinks} drinks` }));

  // Fun stat: clean (no drinks yet)
  const cleanPlayers = players.filter(p => p.totalDrinks === 0)
    .map(p => ({ ...p, val: '😇 0 drinks' }));

  const shameList = [...players].sort((a, b) => b.totalDrinks - a.totalDrinks);

  let rank = 0;
  let lastBest = null, lastDrinks = null;
  const ranked = players.map((p, i) => {
    if (p.bestRound !== lastBest || p.totalDrinks !== lastDrinks) {
      rank = i + 1;
      lastBest = p.bestRound;
      lastDrinks = p.totalDrinks;
    }
    return { ...p, rank };
  });

  return (
    <div className={styles.page}>
      {/* Sub-view toggle */}
      <div className={styles.toggle}>
        <button className={`${styles.toggleBtn} ${view === 'leaderboard' ? styles.toggleActive : ''}`}
          onClick={() => setView('leaderboard')}>🏆 Leaderboard</button>
        <button className={`${styles.toggleBtn} ${view === 'shame' ? styles.toggleActive : ''}`}
          onClick={() => setView('shame')}>🍺 Drinks</button>
      </div>

      {/* Fun stat cards */}
      <div className={styles.statGrid}>
        {survivors.length > 0 && <StatMini emoji="🔥" label="Still alive" rows={survivors.slice(0, 3)} />}
        {topDrinkers.length > 0 && <StatMini emoji="🍺" label="Most drunk" rows={topDrinkers} />}
        {mostPain.length > 0    && <StatMini emoji="😵" label="Most pain" rows={mostPain} />}
        {cleanPlayers.length > 0 && <StatMini emoji="😇" label="Still clean" rows={cleanPlayers.slice(0, 3)} />}
      </div>

      {/* LEADERBOARD view */}
      {view === 'leaderboard' && (
        <div className={styles.list}>
          {alive.length > 0 && <div className={styles.sectionHeader}>🔥 Still in the tournament</div>}
          {ranked.filter(p => p.bestRound === 'alive').map((p, i) => (
            <PlayerRow key={p.name} p={p} rank={p.rank} medal={MEDAL[i]} />
          ))}
          {eliminated.length > 0 && <div className={styles.sectionHeader}>💀 Eliminated</div>}
          {ranked.filter(p => p.bestRound !== 'alive').map(p => (
            <PlayerRow key={p.name} p={p} rank={p.rank} />
          ))}
        </div>
      )}

      {/* DRINKS view */}
      {view === 'shame' && (
        <div className={styles.list}>
          <div className={styles.sectionHeader}>🍺 Hall of Shame</div>
          {shameList.map((p, i) => (
            <ShameRow key={p.name} p={p} rank={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ p, rank, medal }) {
  const isAlive = p.bestRound === 'alive';
  return (
    <div className={`${styles.row} ${isAlive ? styles.rowAlive : styles.rowOut}`}>
      <div className={styles.rankCell}>
        {medal ?? <span className={styles.rankNum}>{rank}</span>}
      </div>
      <div className={styles.avatarCell}>
        {p.photo
          ? <img src={p.photo} alt={p.name} className={styles.avatar} />
          : <div className={styles.avatarInit} style={{ background: p.color }}>{p.initials}</div>
        }
      </div>
      <div className={styles.infoCell}>
        <span className={styles.playerName}>{p.name}</span>
        <div className={styles.pills}>
          {p.teams.map(t => <TeamPill key={t.code} team={t} />)}
        </div>
      </div>
      <div className={styles.drinkCell}>
        {p.totalDrinks > 0 && <><span className={styles.drinkEmoji}>🍺</span><span className={styles.drinkNum}>{p.totalDrinks}</span></>}
        {p.bonusDrinks ? <span className={styles.bonusNote}>+{p.bonusDrinks} bonus</span> : null}
      </div>
    </div>
  );
}

function ShameRow({ p, rank }) {
  const barMax = 8;
  const width = Math.min(100, (p.totalDrinks / barMax) * 100);
  return (
    <div className={styles.shameRow}>
      <span className={styles.shameRank}>{rank}</span>
      <div className={styles.avatarCell}>
        {p.photo
          ? <img src={p.photo} alt={p.name} className={styles.avatar} />
          : <div className={styles.avatarInit} style={{ background: p.color }}>{p.initials}</div>
        }
      </div>
      <div className={styles.shameInfo}>
        <div className={styles.shameTop}>
          <span className={styles.playerName}>{p.name}</span>
          <span className={styles.shameCount}>{p.totalDrinks > 0 ? `${p.totalDrinks} 🍺` : '0'}</span>
        </div>
        <div className={styles.barTrack}>
          <div className={styles.barFill} style={{ width: `${width}%`, background: p.totalDrinks >= 5 ? '#ff3b3b' : p.totalDrinks >= 3 ? '#ff9500' : '#00c844' }} />
        </div>
      </div>
    </div>
  );
}
