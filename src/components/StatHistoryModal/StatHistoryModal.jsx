import { useState, useMemo } from 'react';
import styles from './StatHistoryModal.module.css';

const STATS = [
  { k: 'drinks',  icon: '🍺', label: 'Drinks',       note: 'cumulative drinks owed' },
  { k: 'wins',    icon: '🏆', label: 'Wins',         note: 'cumulative wins' },
  { k: 'wStreak', icon: '🔥', label: 'Win Streak',   note: 'resets on a loss or draw' },
  { k: 'dStreak', icon: '🍻', label: 'Drink Streak', note: 'resets on a win' },
];

// Monotone cubic spline — guaranteed no overshoot
function monotonePath(pts) {
  const n = pts.length;
  if (n < 2) return `M${pts[0]?.x ?? 0},${pts[0]?.y ?? 0}`;
  const dx = [], s = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    s[i]  = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  m[0] = s[0]; m[n - 1] = s[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = s[i-1] * s[i] <= 0 ? 0 : (s[i-1] + s[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(s[i]) < 1e-9) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / s[i], b = m[i + 1] / s[i], h = a*a + b*b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t*a*s[i]; m[i + 1] = t*b*s[i]; }
  }
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i].x+h).toFixed(1)},${(pts[i].y+m[i]*h).toFixed(1)} ${(pts[i+1].x-h).toFixed(1)},${(pts[i+1].y-m[i+1]*h).toFixed(1)} ${pts[i+1].x.toFixed(1)},${pts[i+1].y.toFixed(1)}`;
  }
  return d;
}

function dayOf(kickoff) {
  const d = kickoff instanceof Date ? kickoff : new Date(kickoff);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildHistoryData(players) {
  const allDays = [...new Set(
    players.flatMap(p =>
      (p.matches ?? []).filter(m => m.isFinished && m.kickoff).map(m => dayOf(m.kickoff))
    )
  )].sort((a, b) => a - b);

  if (allDays.length === 0) return null;

  const playerData = players.map(p => {
    const sorted = [...(p.matches ?? [])]
      .filter(m => m.isFinished && m.kickoff)
      .sort((a, b) => a.kickoff - b.kickoff);

    let wins = 0, drinks = 0, wStreak = 0, dStreak = 0, idx = 0;
    const hist = [{ wins: 0, drinks: 0, wStreak: 0, dStreak: 0 }];

    allDays.forEach(dayTs => {
      while (idx < sorted.length && dayOf(sorted[idx].kickoff) <= dayTs) {
        const { myState, myVideo, myDrinkCount, sideBetDrinks } = sorted[idx];
        if (myState === 'winning') { wins++; wStreak++; dStreak = 0; }
        else if (myState === 'losing' || myState === 'draw') {
          drinks += myVideo ? (myDrinkCount ?? 1) : (1 + (sideBetDrinks ?? 0));
          dStreak++; wStreak = 0;
        }
        idx++;
      }
      hist.push({ wins, drinks, wStreak, dStreak });
    });

    return { ...p, hist };
  });

  const labels = ['', ...allDays.map(ts =>
    new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  )];

  return { labels, playerData };
}

// SVG chart constants
const W = 320, H = 195;
const PL = 24, PR = 72, PT = 10, PB = 26;
const CW = W - PL - PR, CH = H - PT - PB;

export default function StatHistoryModal({ players, initialStat = 'drinks', onClose }) {
  const [stat, setStat]   = useState(initialStat);
  const [selName, setSel] = useState(null);

  const history = useMemo(() => buildHistoryData(players), [players]);
  if (!history) return null;

  const { labels, playerData } = history;
  const N = labels.length;

  const maxVal = Math.max(1, ...playerData.map(p => Math.max(...p.hist.map(v => v[stat]))));
  const xp = i  => PL + i * CW / (N - 1);
  const yp = v  => PT + CH - v * CH / maxVal;

  const selPlayer = selName ? playerData.find(p => p.name === selName) : null;
  const topPlayer = [...playerData].sort(
    (a, b) => Math.max(...b.hist.map(v => v[stat])) - Math.max(...a.hist.map(v => v[stat]))
  )[0];

  const yTicks = Array.from(
    { length: Math.min(maxVal, 5) + 1 },
    (_, i) => Math.round(i * maxVal / Math.min(maxVal, 5))
  );

  // X label indices: show ~5 evenly spaced (skip index 0 which is the blank start)
  const xStep = Math.max(1, Math.ceil((N - 1) / 4));
  const xLabelIs = Array.from({ length: N }, (_, i) => i).filter(
    i => i > 0 && (i === 1 || i % xStep === 0 || i === N - 1)
  );

  // Sort: selected player drawn last (on top)
  const sorted = [...playerData].sort((a, b) => {
    if (selName) {
      if (a.name === selName) return 1;
      if (b.name === selName) return -1;
    }
    return Math.max(...a.hist.map(v => v[stat])) - Math.max(...b.hist.map(v => v[stat]));
  });

  const statInfo = STATS.find(s => s.k === stat) ?? STATS[0];

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <button className={styles.back} onClick={onClose}>←</button>
          <span className={styles.title}>{statInfo.label} History</span>
        </div>

        <div className={styles.tabs}>
          {STATS.map(s => (
            <button
              key={s.k}
              className={`${styles.tab} ${s.k === stat ? styles.tabOn : ''}`}
              onClick={() => { setStat(s.k); setSel(null); }}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <p className={styles.note}>{statInfo.note}</p>

        <div className={styles.chartWrap}>
          <svg viewBox={`0 0 ${W} ${H}`} className={styles.chart}>
            <defs>
              <clipPath id="shClip">
                <rect x={PL} y={PT} width={CW} height={CH} />
              </clipPath>
              {selPlayer && (
                <linearGradient id="shGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={selPlayer.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={selPlayer.color} stopOpacity="0"    />
                </linearGradient>
              )}
            </defs>

            {/* Y grid + labels */}
            {yTicks.map(v => (
              <g key={v}>
                <line
                  x1={PL} x2={W - PR}
                  y1={yp(v).toFixed(1)} y2={yp(v).toFixed(1)}
                  stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
                <text
                  x={PL - 4} y={(yp(v) + 4).toFixed(1)}
                  textAnchor="end" fill="#3a3a52" fontSize="9"
                >{v}</text>
              </g>
            ))}
            <line x1={PL} x2={W - PR} y1={PT + CH} y2={PT + CH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* X axis labels */}
            {xLabelIs.map(i => (
              <text
                key={i}
                x={xp(i).toFixed(1)} y={PT + CH + 16}
                textAnchor="middle" fill="#2e2e48" fontSize="8"
              >{labels[i]}</text>
            ))}

            {/* Player lines */}
            {sorted.map(p => {
              const pk    = Math.max(...p.hist.map(v => v[stat]));
              const isSel = p.name === selName;
              const isTop = !selName && p.name === topPlayer.name && pk > 0;

              let opacity, strokeWidth;
              if (selName) { opacity = isSel ? 1 : 0.07; strokeWidth = isSel ? 2.5 : 1; }
              else         { opacity = isTop ? 0.88 : 0.19; strokeWidth = isTop ? 2.2 : 1; }

              const pts  = p.hist.map((v, i) => ({ x: xp(i), y: yp(v[stat]) }));
              const path = monotonePath(pts);
              const endV = p.hist[N - 1][stat];
              const pkIdx = p.hist.map(v => v[stat]).lastIndexOf(pk);

              return (
                <g key={p.name}>
                  {/* Gradient fill for selected player */}
                  {isSel && (
                    <path
                      d={`${path} V${(PT + CH).toFixed(1)} H${PL} Z`}
                      fill="url(#shGrad)" stroke="none"
                      clipPath="url(#shClip)"
                    />
                  )}
                  {/* Glow */}
                  {(isSel || isTop) && (
                    <path
                      d={path} fill="none" stroke={p.color}
                      strokeWidth={isSel ? 8 : 5}
                      opacity={isSel ? 0.12 : 0.07}
                      strokeLinecap="round"
                      clipPath="url(#shClip)"
                    />
                  )}
                  {/* Main line */}
                  <path
                    d={path} fill="none" stroke={p.color}
                    strokeWidth={strokeWidth} opacity={opacity}
                    strokeLinecap="round" strokeLinejoin="round"
                    clipPath="url(#shClip)"
                  />
                  {/* End-of-line name label */}
                  {(isSel || isTop) && (
                    <text
                      x={(xp(N - 1) + 5).toFixed(1)}
                      y={(yp(endV) + 4).toFixed(1)}
                      fill={p.color} fontSize={isSel ? 10 : 9}
                      fontWeight={isSel ? '700' : '500'}
                      opacity={opacity}
                    >
                      {p.name.split(' ')[0]}
                    </text>
                  )}
                  {/* Peak dot + value badge for selected */}
                  {isSel && pk > 0 && (
                    <g>
                      <circle
                        cx={xp(pkIdx).toFixed(1)} cy={yp(pk).toFixed(1)}
                        r="4" fill={p.color} opacity="0.95"
                      />
                      <rect
                        x={(xp(pkIdx) - 13).toFixed(1)} y={(yp(pk) - 18).toFixed(1)}
                        width="26" height="14" rx="4"
                        fill={p.color} opacity="0.95"
                      />
                      <text
                        x={xp(pkIdx).toFixed(1)} y={(yp(pk) - 8).toFixed(1)}
                        textAnchor="middle" fill="#fff" fontSize="9" fontWeight="700"
                      >{pk}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Player chips */}
        <div className={styles.legend}>
          {playerData.map(p => (
            <button
              key={p.name}
              className={`${styles.chip} ${selName === p.name ? styles.chipOn : ''}`}
              style={selName === p.name ? { borderColor: p.color, color: '#fff' } : {}}
              onClick={() => setSel(prev => prev === p.name ? null : p.name)}
            >
              <span className={styles.dot} style={{ background: p.color }} />
              {p.name}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
