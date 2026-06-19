import { useState } from 'react';
import styles from './KnockoutStatsPage.module.css';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';
import PlayerModal from '../PlayerModal/PlayerModal';

const find = (name) => PARTICIPANTS.find(x => x.name === name);

// Round order for ranking (higher = better / further in tournament)
const ROUND_RANK = { GS: 0, R32: 1, R16: 2, QF: 3, SF: 4, Final: 5, W: 6 };
const ROUND_LABEL = { GS: 'Groups', R32: 'R32', R16: 'R16', QF: 'QF', SF: 'SF', Final: 'Final', W: '🏆 Champion' };

// Demo data — state: heading into Semi-Finals
// SF teams: 🇺🇸 USA · 🇯🇵 JPN · 🇧🇷 BRA · 🇩🇪 GER
//
// history: array of teams in chronological order
//   { code, type:'o'(riginal)|'r'(edrawn), out: null|'GS'|'R32'|'R16'|'QF'|'SF'|'Final', w, d }
//   out:null = currently active team
//   w = knockout wins while assigned to this team, d = drinks while on this team
//
// videoDebt = drinks not yet uploaded (for demo: everyone has debt proportional to their drinks)

const DEMO = [
  // ── ORIGINAL OWNERS — team(s) still alive ──────────────────────────────
  // Lucky: both original GS out → only 1 team, it goes all the way
  { name:'Pepe',     history:[{code:'SAF',type:'o',out:'GS',w:0,d:0},{code:'JPN',type:'o',out:null,w:3,d:0}] },
  { name:'Adam',     history:[{code:'JOR',type:'o',out:'GS',w:0,d:0},{code:'USA',type:'o',out:null,w:3,d:0}] },
  // Had 1 original out, 1 still alive
  { name:'Charlie',  history:[{code:'NOR',type:'o',out:'R16',w:1,d:2},{code:'GER',type:'o',out:null,w:3,d:0}] },
  { name:'Rand',     history:[{code:'TUN',type:'o',out:'R16',w:1,d:1},{code:'BRA',type:'o',out:null,w:3,d:0}] },
  { name:'Michael',  history:[{code:'SCO',type:'o',out:'R32',w:0,d:1},{code:'ECU',type:'o',out:null,w:3,d:0}] }, // ECU secretly GER bound, pretend ECU = GER alias for demo
  // ── 1 REDRAW — both originals out, now on an SF team ──────────────────
  { name:'Sabo',     history:[{code:'BOS',type:'o',out:'GS',w:0,d:0},{code:'MEX',type:'o',out:'R32',w:0,d:2},{code:'USA',type:'r',out:null,w:2,d:0}] },
  { name:'Kimbo',    history:[{code:'CPV',type:'o',out:'GS',w:0,d:0},{code:'MOR',type:'o',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Tobias',   history:[{code:'EGY',type:'o',out:'GS',w:0,d:0},{code:'ARG',type:'o',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Sebastian',history:[{code:'PAR',type:'o',out:'GS',w:0,d:0},{code:'FRA',type:'o',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Purcy',    history:[{code:'CAN',type:'o',out:'R32',w:0,d:2},{code:'NED',type:'o',out:'QF',w:2,d:0},{code:'JPN',type:'r',out:null,w:0,d:0}] },
  { name:'Malou',    history:[{code:'CUR',type:'o',out:'GS',w:0,d:0},{code:'URU',type:'o',out:'R32',w:0,d:3},{code:'BRA',type:'r',out:null,w:2,d:0}] },
  { name:'Emma',     history:[{code:'CIV',type:'o',out:'R32',w:0,d:1},{code:'ENG',type:'o',out:'R16',w:1,d:2},{code:'GER',type:'r',out:null,w:1,d:0}] },
  // ── 2 REDRAWS — both originals out + first redrawn team also out ───────
  { name:'J$',       history:[{code:'PAN',type:'o',out:'GS',w:0,d:0},{code:'TUR',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Rogier',   history:[{code:'QAT',type:'o',out:'GS',w:0,d:0},{code:'AUT',type:'o',out:'R16',w:1,d:1},{code:'FRA',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Blake',    history:[{code:'SWE',type:'o',out:'R32',w:0,d:2},{code:'CRO',type:'o',out:'QF',w:2,d:1},{code:'JPN',type:'r',out:null,w:0,d:0}] },
  { name:'Jimmy',    history:[{code:'ALG',type:'o',out:'GS',w:0,d:0},{code:'SEN',type:'o',out:'R16',w:1,d:3},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Nathanial',history:[{code:'HAI',type:'o',out:'GS',w:0,d:0},{code:'BEL',type:'o',out:'R32',w:0,d:2},{code:'FRA',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Scotty2Hotty',history:[{code:'GHA',type:'o',out:'R32',w:0,d:1},{code:'POR',type:'o',out:'R16',w:1,d:2},{code:'MOR',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Tim',      history:[{code:'NZL',type:'o',out:'GS',w:0,d:0},{code:'SWI',type:'o',out:'R16',w:1,d:1},{code:'NED',type:'r',out:'QF',w:2,d:0},{code:'JPN',type:'r',out:null,w:0,d:0}], bonusDrinks:1 },
  // ── 3 REDRAWS — kept losing ────────────────────────────────────────────
  { name:'Ali',      history:[{code:'UZB',type:'o',out:'R32',w:0,d:1},{code:'COL',type:'o',out:'R16',w:1,d:2},{code:'NED',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Russ',     history:[{code:'COD',type:'o',out:'GS',w:0,d:0},{code:'IRN',type:'o',out:'R32',w:0,d:1},{code:'MOR',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
  { name:'Sjaak',    history:[{code:'SAU',type:'o',out:'GS',w:0,d:0},{code:'ESP',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'USA',type:'r',out:null,w:0,d:0}] },
  { name:'Will Hunt',history:[{code:'IRQ',type:'o',out:'GS',w:0,d:0},{code:'AUS',type:'o',out:'R32',w:0,d:2},{code:'ARG',type:'r',out:'QF',w:2,d:1},{code:'GER',type:'r',out:null,w:0,d:0}] },
  { name:'Chonga',   history:[{code:'CZE',type:'o',out:'GS',w:0,d:0},{code:'SKO',type:'o',out:'R32',w:0,d:1},{code:'NED',type:'r',out:'QF',w:2,d:1},{code:'BRA',type:'r',out:null,w:0,d:0}] },
];

function buildPlayers() {
  return DEMO.map(d => {
    const p = find(d.name);
    const h = d.history;

    // Active team: last entry with out:null
    const active = h.findLast(t => t.out === null) ?? h[h.length - 1];
    const isAlive = active.out === null;

    // Best round = furthest round reached by any team (active team's status or out-round)
    const bestRound = isAlive
      ? (active.out ?? 'SF') // alive teams are in SF
      : h.reduce((best, t) => {
          const r = t.out ?? 'SF';
          return ROUND_RANK[r] > ROUND_RANK[best] ? r : best;
        }, 'GS');

    // Wins = all knockout wins across all teams
    const totalWins = h.reduce((s, t) => s + (t.w || 0), 0);

    // Losses = teams knocked out in knockout rounds (not GS — those don't require drinks)
    const totalLosses = h.filter(t => t.out && t.out !== 'GS').length;

    // Drinks = sum of all team drinks + bonus
    const totalDrinks = h.reduce((s, t) => s + (t.d || 0), 0) + (d.bonusDrinks || 0);

    // Video debt: for demo, assume 1 overdue video for players with drinks>2
    const videoDebt = totalDrinks > 2 ? 1 : 0;
    const drinksDone = totalDrinks - videoDebt;

    // Win streak: count consecutive wins backwards across all teams (knockout matches only)
    // Build match list chronologically: each team's W/L results in order
    const matchList = [];
    h.forEach(t => {
      if (t.out && t.out !== 'GS') {
        // knocked out in knockout: add W results, then 1 L
        for (let i = 0; i < (t.w || 0); i++) matchList.push('W');
        matchList.push('L');
      } else if (t.out === null) {
        // alive: just W results (SF not played yet)
        for (let i = 0; i < (t.w || 0); i++) matchList.push('W');
      }
      // GS: no knockout matches
    });
    let streak = 0;
    for (let i = matchList.length - 1; i >= 0; i--) {
      if (matchList[i] === 'W') streak++;
      else break;
    }

    // Redraws count
    const redraws = h.filter(t => t.type === 'r').length;

    // Build a compatible `matches` array for PlayerModal
    const matches = h.flatMap(t => {
      if (t.out === 'GS' || !TEAM_MAP[t.code]) return [];
      const team = TEAM_MAP[t.code];
      const results = [];
      for (let i = 0; i < (t.w || 0); i++) {
        results.push({
          id: `${t.code}-W${i}`, kickoff: new Date(), teamCode: t.code, oppCode: '???',
          myGoals: 1, oppGoals: 0, myState: 'winning', isFinished: true, isLive: false,
          myVideo: null, myDrinkCount: 0, myEmoji: '',
        });
      }
      if (t.out && t.out !== 'GS') {
        results.push({
          id: `${t.code}-L`, kickoff: new Date(), teamCode: t.code, oppCode: '???',
          myGoals: 0, oppGoals: 1, myState: 'losing', isFinished: true, isLive: false,
          myVideo: null, myDrinkCount: t.d || 0, myEmoji: '🍺',
        });
      }
      return results;
    });

    return {
      ...p,
      history: h,
      activeTeam: active,
      isAlive,
      bestRound: isAlive ? 'SF' : bestRound,
      wins: totalWins,
      losses: totalLosses,
      draws: 0,
      drinks: totalDrinks,
      drinksDone,
      videoDebt,
      streak,
      redraws,
      bonusDrinks: d.bonusDrinks || 0,
      matches,
    };
  });
}

function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    // 1. Furthest round (alive SF first)
    const rDiff = ROUND_RANK[b.bestRound] - ROUND_RANK[a.bestRound];
    if (rDiff !== 0) return rDiff;
    // 2. Fewest losses (fewer redraws = more loyal to teams = better)
    if (a.losses !== b.losses) return a.losses - b.losses;
    // 3. Most wins
    if (b.wins !== a.wins) return b.wins - a.wins;
    // 4. Fewest drinks
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

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };

// ── Sub-components ───────────────────────────────────────────────────────────

function MiniAvatar({ p }) {
  return p.photo
    ? <img src={p.photo} alt={p.name} className={styles.miniAv} />
    : <div className={styles.miniAvInit} style={{ background: p.color }}>{p.initials}</div>;
}

function StatCard({ emoji, label, rows }) {
  if (!rows?.length) return null;
  return (
    <div className={styles.statCard}>
      <div className={styles.statLabel}>{emoji} {label}</div>
      {rows.map((r, i) => (
        <div key={i} className={styles.statRow}>
          <MiniAvatar p={r} />
          <span className={styles.statName}>{r.name.split(' ')[0]}</span>
          <span className={styles.statVal}>{r.val}</span>
        </div>
      ))}
    </div>
  );
}

function TeamChain({ history }) {
  return (
    <div className={styles.chain}>
      {history.map((t, i) => {
        const isAlive = t.out === null;
        const isGS = t.out === 'GS';
        const flag = TEAM_MAP[t.code]?.flag ?? '🏳️';
        return (
          <span key={t.code} className={styles.chainItem}>
            {i > 0 && t.type === 'r' && <span className={styles.redrawArrow}>↩</span>}
            <span className={`${styles.teamPill} ${isAlive ? styles.pillAlive : isGS ? styles.pillGS : styles.pillOut}`}>
              {flag} {isAlive ? '🔥' : isGS ? 'GS' : ROUND_LABEL[t.out]}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function KnockoutStatsPage() {
  const [selected, setSelected] = useState(null);
  const players = buildPlayers();
  const ranked = rankPlayers(players);

  // Fun stats
  const hasFinished = true;
  const maxStreak = Math.max(...players.map(p => p.streak));
  const topStreakers = maxStreak > 0
    ? players.filter(p => p.streak === maxStreak).map(p => ({ ...p, val: `${p.streak} in a row` }))
    : [];

  const maxDrinks = Math.max(...players.map(p => p.drinks));
  const topDrinkers = maxDrinks > 0
    ? players.filter(p => p.drinks === maxDrinks).map(p => ({ ...p, val: `🍺 ${p.drinks}` }))
    : [];

  const cleanPlayers = players
    .filter(p => p.drinks === 0 && p.losses > 0)
    .map(p => ({ ...p, val: '😇 0 drinks' }));

  const debtPlayers = players
    .filter(p => p.videoDebt > 0)
    .sort((a, b) => b.videoDebt - a.videoDebt)
    .map(p => ({ ...p, val: `owes ${p.videoDebt}` }));

  const alive = ranked.filter(p => p.isAlive);
  const eliminated = ranked.filter(p => !p.isAlive);

  return (
    <div className={styles.page}>

      {/* Fun stat cards — same 4 as group stage */}
      <div className={styles.statGrid}>
        <StatCard emoji="🔥" label="Win Streak"  rows={topStreakers.slice(0, 3)} />
        <StatCard emoji="🍺" label="Most Drinks" rows={topDrinkers.slice(0, 3)} />
        <StatCard emoji="😇" label="Still Clean" rows={cleanPlayers.slice(0, 3)} />
        <StatCard emoji="🎬" label="Video Debt"  rows={debtPlayers.slice(0, 3)} />
      </div>

      {/* Leaderboard table — same structure as group stage */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player · Team History</th>
            <th className={styles.thStat}>W</th>
            <th className={styles.thStat}>L</th>
            <th className={styles.thStat}>🍺</th>
            <th className={styles.thStat}>✓</th>
          </tr>
        </thead>
        <tbody>
          {alive.length > 0 && (
            <tr><td colSpan={6} className={styles.sectionRow}>🔥 Semi-Finals · {alive.length} players</td></tr>
          )}
          {alive.map(p => (
            <PlayerRow key={p.name} p={p} medal={MEDAL[p.rank]} onClick={() => setSelected(p)} />
          ))}
          {eliminated.length > 0 && (
            <tr><td colSpan={6} className={styles.sectionRow}>💀 Eliminated · {eliminated.length} players</td></tr>
          )}
          {eliminated.map(p => (
            <PlayerRow key={p.name} p={p} onClick={() => setSelected(p)} />
          ))}
        </tbody>
      </table>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PlayerRow({ p, medal, onClick }) {
  const isAlive = p.isAlive;
  return (
    <tr className={`${styles.row} ${isAlive ? styles.rowAlive : styles.rowOut}`} onClick={onClick}>
      <td className={styles.rank}>
        {medal ?? <span className={styles.rankNum}>{p.rank}</span>}
      </td>
      <td className={styles.playerCol}>
        <div className={styles.playerInner}>
          {p.photo
            ? <img src={p.photo} alt={p.name} className={styles.avatar} />
            : <div className={styles.avatarInit} style={{ background: p.color }}>{p.initials}</div>
          }
          <div className={styles.playerBlock}>
            <div className={styles.playerName}>
              {p.name}
              {p.redraws > 0 && <span className={styles.redrawBadge}>↩×{p.redraws}</span>}
            </div>
            <TeamChain history={p.history} />
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
