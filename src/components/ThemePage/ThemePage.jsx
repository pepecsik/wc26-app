import styles from './ThemePage.module.css';

// ── Static demo data — no real data, just for visual preview ─────────────────

const MATCHES = [
  {
    id: 1,
    label: 'Group A',
    hFlag: '🇧🇷', hName: 'Brazil',    hGoals: 3, hState: 'winning',
    aFlag: '🇲🇽', aName: 'Mexico',    aGoals: 1, aState: 'losing',
    status: 'FT', kickoff: 'Thu 19 Jun · 20:00',
    hPlayers: [
      { name: 'Adam',  photo: '/avatars/Adam.png',  drinks: 0 },
      { name: 'Rand',  photo: '/avatars/Rand.png',  drinks: 0 },
    ],
    aPlayers: [
      { name: 'Sabo',  photo: '/avatars/Sabo.png',  drinks: 1 },
      { name: 'Kimbo', photo: '/avatars/Kimbo.png', drinks: 0 },
    ],
  },
  {
    id: 2,
    label: 'Group B',
    hFlag: '🇩🇪', hName: 'Germany',   hGoals: 1, hState: 'losing',
    aFlag: '🇫🇷', aName: 'France',    aGoals: 2, aState: 'winning',
    status: 'LIVE', elapsed: '72\'',
    hPlayers: [
      { name: 'Charlie',  photo: '/avatars/Charlie.png',  drinks: 0 },
      { name: 'Sebastian',photo: '/avatars/Sebastian.png',drinks: 0 },
    ],
    aPlayers: [
      { name: 'Emma',    photo: '/avatars/Emma.png',    drinks: 0 },
      { name: 'Rogier',  photo: '/avatars/Rogier.png',  drinks: 0 },
    ],
  },
  {
    id: 3,
    label: 'Group C',
    hFlag: '🇺🇸', hName: 'USA',       hGoals: null, hState: 'neutral',
    aFlag: '🇯🇵', aName: 'Japan',     aGoals: null, aState: 'neutral',
    status: 'upcoming', kickoff: 'Fri 20 Jun · 23:00',
    hPlayers: [
      { name: 'Pepe',  photo: '/avatars/Pepe.png',  drinks: 0 },
      { name: 'Tobias',photo: '/avatars/Tobias.png',drinks: 0 },
    ],
    aPlayers: [
      { name: 'Michael',photo: '/avatars/Michael.png',drinks: 0 },
      { name: 'Blake',  photo: '/avatars/Blake.png',  drinks: 0 },
    ],
  },
];

const PLAYERS = [
  { rank: 1, name: 'Charlie',  photo: '/avatars/Charlie.png',  flags: '🇳🇴 🇩🇪', w: 2, l: 0, d: 0, drinks: 0, done: 0 },
  { rank: 1, name: 'Emma',     photo: '/avatars/Emma.png',     flags: '🇨🇮 🏴󠁧󠁢󠁥󠁮󠁧󠁿', w: 2, l: 0, d: 0, drinks: 0, done: 0 },
  { rank: 3, name: 'Sabo',     photo: '/avatars/Sabo.png',     flags: '🇧🇦 🇲🇽', w: 2, l: 1, d: 1, drinks: 2, done: 2 },
  { rank: 4, name: 'Pepe',     photo: '/avatars/Pepe.png',     flags: '🇿🇦 🇯🇵', w: 1, l: 0, d: 1, drinks: 4, done: 4 },
  { rank: 5, name: 'Adam',     photo: '/avatars/Adam.png',     flags: '🇯🇴 🇺🇸', w: 1, l: 1, d: 0, drinks: 1, done: 1 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ photo, name, size = 'md' }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#06b6d4','#10b981','#f59e0b'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return photo
    ? <img src={photo} alt={name} className={`${styles.av} ${styles[`av_${size}`]}`} />
    : <div className={`${styles.avInit} ${styles[`av_${size}`]}`} style={{ background: color }}>{initials}</div>;
}

function MatchCard({ m }) {
  const isLive     = m.status === 'LIVE';
  const isFinished = m.status === 'FT';
  const isUpcoming = m.status === 'upcoming';

  return (
    <div className={`${styles.matchCard} ${isLive ? styles.matchLive : ''}`}>
      {/* Status pill */}
      <div className={styles.matchMeta}>
        <span className={styles.matchGroup}>{m.label}</span>
        {isLive && <span className={styles.livePill}>● {m.elapsed}</span>}
        {isFinished && <span className={styles.ftPill}>FT</span>}
        {isUpcoming && <span className={styles.upcomingPill}>{m.kickoff}</span>}
      </div>

      {/* Score row */}
      <div className={styles.scoreRow}>
        {/* Home */}
        <div className={styles.side}>
          <div className={styles.playerAvatars}>
            {m.hPlayers.map(p => <Avatar key={p.name} photo={p.photo} name={p.name} size="sm" />)}
          </div>
        </div>

        <div className={styles.scoreCenter}>
          <span className={`${styles.scoreFlag} ${m.hState === 'losing' ? styles.scoreFlagDim : ''}`}>{m.hFlag}</span>
          <div className={styles.scoreBox}>
            {isUpcoming
              ? <span className={styles.scoreTime}>{m.kickoff?.split('·')[1]?.trim()}</span>
              : <>
                  <span className={`${styles.scoreNum} ${m.hState === 'winning' ? styles.scoreWin : m.hState === 'losing' ? styles.scoreLoss : ''}`}>{m.hGoals}</span>
                  <span className={styles.scoreSep}>–</span>
                  <span className={`${styles.scoreNum} ${m.aState === 'winning' ? styles.scoreWin : m.aState === 'losing' ? styles.scoreLoss : ''}`}>{m.aGoals}</span>
                </>
            }
          </div>
          <span className={`${styles.scoreFlag} ${m.aState === 'losing' ? styles.scoreFlagDim : ''}`}>{m.aFlag}</span>
        </div>

        {/* Away */}
        <div className={`${styles.side} ${styles.sideRight}`}>
          <div className={styles.playerAvatars}>
            {m.aPlayers.map(p => <Avatar key={p.name} photo={p.photo} name={p.name} size="sm" />)}
          </div>
        </div>
      </div>

      {/* Team names */}
      <div className={styles.teamNames}>
        <span>{m.hName}</span>
        <span>{m.aName}</span>
      </div>
    </div>
  );
}

function LeaderboardRow({ p, i }) {
  return (
    <div className={`${styles.lbRow} ${i === 0 ? styles.lbRowFirst : ''}`}>
      <span className={styles.lbRank}>{p.rank}</span>
      <Avatar photo={p.photo} name={p.name} size="sm" />
      <div className={styles.lbName}>
        <span>{p.name}</span>
        <span className={styles.lbFlags}>{p.flags}</span>
      </div>
      <span className={`${styles.lbStat} ${styles.lbW}`}>{p.w}</span>
      <span className={`${styles.lbStat} ${styles.lbL}`}>{p.l}</span>
      <span className={`${styles.lbStat} ${styles.lbD}`}>{p.d}</span>
      <span className={`${styles.lbStat} ${styles.lbDrink}`}>{p.drinks || ''}</span>
      <span className={`${styles.lbStat} ${styles.lbDone}`}>{p.done || ''}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ThemePage() {
  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerEmoji}>⚽</span>
          <div>
            <div className={styles.headerMain}>WC Drinking Game</div>
            <div className={styles.headerSub}>2026 · Theme Preview</div>
          </div>
        </div>
        <span className={styles.previewBadge}>THEME A</span>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['Matches', 'Stats'].map((t, i) => (
          <button key={t} className={`${styles.tab} ${i === 0 ? styles.tabActive : ''}`}>{t}</button>
        ))}
      </div>

      {/* Match cards */}
      <div className={styles.feed}>
        {MATCHES.map(m => <MatchCard key={m.id} m={m} />)}
      </div>

      {/* Leaderboard preview */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Leaderboard</div>
        <div className={styles.lbHeader}>
          <span className={styles.lbRank}>#</span>
          <span className={styles.lbNameHead}>Player</span>
          <span className={styles.lbStat}>W</span>
          <span className={styles.lbStat}>L</span>
          <span className={styles.lbStat}>D</span>
          <span className={styles.lbStat}>🍺</span>
          <span className={styles.lbStat}>✓</span>
        </div>
        {PLAYERS.map((p, i) => <LeaderboardRow key={p.name} p={p} i={i} />)}
      </div>

    </div>
  );
}
