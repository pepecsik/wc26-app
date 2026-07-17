import { useRef, useEffect } from 'react';
import styles from './BracketView.module.css';
import { TEAM_MAP } from '../../data/teamMap';
import { PARTICIPANTS } from '../../data/participants';

const BASE   = 60;
const COLS   = 8;
const COL_H  = COLS * BASE; // 480px
const CARD_W = 88;
const CONN_W = 16;

// Official WC 2026 bracket order (top→bottom within each half)
// Source: FIFA / Wikipedia 2026_FIFA_World_Cup_knockout_stage
const R32L_PAIRS = [
  ['GER','PAR'], ['FRA','SWE'],  // → R16-L slot 0 (M89)
  ['SAF','CAN'], ['NED','MOR'],  // → R16-L slot 1 (M90)
  ['ESP','AUT'], ['POR','CRO'],  // → R16-L slot 2 (M93)
  ['USA','BOS'], ['BEL','SEN'],  // → R16-L slot 3 (M94)
];
const R32R_PAIRS = [
  ['BRA','JPN'], ['CIV','NOR'],  // → R16-R slot 0 (M91)
  ['MEX','ECU'], ['ENG','COD'],  // → R16-R slot 1 (M92)
  ['ARG','CPV'], ['AUS','EGY'],  // → R16-R slot 2 (M95)
  ['SWI','ALG'], ['COL','GHA'],  // → R16-R slot 3 (M96)
];

function ownerLabel(code, ownerMap) {
  if (!code) return '';
  const og    = PARTICIPANTS.filter(p => p.teams.includes(code));
  const extra = (ownerMap[code] || []).filter(o => !og.some(p => p.name === o.name));
  return [...og, ...extra].map(p => p.name.split(' ')[0]).slice(0, 2).join('·');
}

function winner(m) {
  if (!m?.isFinished) return null;
  return m.hState === 'winning' ? m.hCode : m.aState === 'winning' ? m.aCode : null;
}

function loser(m) {
  if (!m?.isFinished) return null;
  return m.hState === 'losing' ? m.hCode : m.aState === 'losing' ? m.aCode : null;
}

function findByTeams(pool, t1, t2) {
  if (!t1 || !t2) return null;
  return pool.find(m =>
    (m.hCode === t1 && m.aCode === t2) || (m.hCode === t2 && m.aCode === t1)
  ) ?? null;
}

function TeamRow({ code, goals, state, isFinished, ownerMap }) {
  const t = TEAM_MAP[code];
  const won  = isFinished && state === 'winning';
  const lost = isFinished && state === 'losing';
  return (
    <div className={`${styles.trow} ${won ? styles.trowWin : lost ? styles.trowLose : ''}`}>
      <span className={styles.tflag}>{t?.flag ?? '·'}</span>
      <div className={styles.tinfo}>
        <span className={styles.tcode}>{code ?? 'TBD'}</span>
        {code && <span className={styles.towner}>{ownerLabel(code, ownerMap)}</span>}
      </div>
      {isFinished && (
        <span className={`${styles.tscore} ${won ? styles.tscoreWin : ''}`}>{goals}</span>
      )}
    </div>
  );
}

function Card({ m, ownerMap }) {
  if (!m) {
    return (
      <div className={`${styles.card} ${styles.cardTbd}`}>
        <div className={styles.trow}><span className={styles.tcode} style={{ color: 'rgba(255,255,255,0.2)' }}>TBD</span></div>
        <div className={styles.divider} />
        <div className={styles.trow}><span className={styles.tcode} style={{ color: 'rgba(255,255,255,0.2)' }}>TBD</span></div>
      </div>
    );
  }
  const statusLabel = m.isFinished && (m.status === 'PEN' || m.status === 'AET') ? m.status : null;
  return (
    <div className={`${styles.card} ${m.isLive ? styles.cardLive : m.isFinished ? styles.cardDone : ''}`}>
      <TeamRow code={m.hCode} goals={m.hGoals} state={m.hState} isFinished={m.isFinished} ownerMap={ownerMap} />
      <div className={styles.divider}>
        {statusLabel && <span className={styles.cardStatus}>{statusLabel}</span>}
      </div>
      <TeamRow code={m.aCode} goals={m.aGoals} state={m.aState} isFinished={m.isFinished} ownerMap={ownerMap} />
    </div>
  );
}

function RoundCol({ matches, n, ownerMap }) {
  const slotH = COL_H / n;
  return (
    <div className={styles.col}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className={styles.slot} style={{ height: slotH }}>
          <Card m={matches[i] ?? null} ownerMap={ownerMap} />
        </div>
      ))}
    </div>
  );
}

function Connector({ fromN, mirror = false }) {
  const fromSlot = COL_H / fromN;
  const toSlot   = COL_H / (fromN / 2);
  const bend     = 10;
  const paths    = [];

  for (let j = 0; j < fromN / 2; j++) {
    const yMid = (j + 0.5) * toSlot;
    const y1   = (j * 2 + 0.5) * fromSlot;
    const y2   = (j * 2 + 1.5) * fromSlot;
    if (!mirror) {
      paths.push(`M 0,${y1} H ${bend} V ${yMid} H ${CONN_W}`);
      paths.push(`M 0,${y2} H ${bend} V ${yMid}`);
    } else {
      paths.push(`M ${CONN_W},${y1} H ${CONN_W - bend} V ${yMid} H 0`);
      paths.push(`M ${CONN_W},${y2} H ${CONN_W - bend} V ${yMid}`);
    }
  }

  return (
    <svg width={CONN_W} height={COL_H} className={styles.connSvg}>
      {paths.map((d, i) => (
        <path key={i} d={d} stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" />
      ))}
    </svg>
  );
}

function HConn() {
  const y = COL_H / 2;
  return (
    <svg width={CONN_W} height={COL_H} className={styles.connSvg}>
      <line x1={0} y1={y} x2={CONN_W} y2={y} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
    </svg>
  );
}

// Center x of each round column, used for auto-scroll
function roundCenter(round) {
  const col = (n) => n * (CARD_W + CONN_W) + CARD_W / 2;
  return { R32: col(0), R16: col(1), QF: col(2), SF: col(3), FIN: col(4), '3P': col(4) }[round] ?? col(4);
}

export default function BracketView({ matches = [], ownerMap = {} }) {
  const scrollRef = useRef(null);

  const byRound = (r) => matches.filter(m => m.round === r);
  const r32All  = byRound('R32');
  const r16All  = byRound('R16');
  const qfAll   = byRound('QF');
  const sfAll   = byRound('SF');
  const fin     = byRound('FIN')[0] ?? null;
  const p3      = byRound('3P')[0]  ?? null;

  // Build R32 columns in official bracket order using team-code lookups
  const r32L = R32L_PAIRS.map(([h, a]) => findByTeams(r32All, h, a));
  const r32R = R32R_PAIRS.map(([h, a]) => findByTeams(r32All, h, a));

  // R16: find match by which teams the R32 winners produced
  const r16L = [
    findByTeams(r16All, winner(r32L[0]), winner(r32L[1])),
    findByTeams(r16All, winner(r32L[2]), winner(r32L[3])),
    findByTeams(r16All, winner(r32L[4]), winner(r32L[5])),
    findByTeams(r16All, winner(r32L[6]), winner(r32L[7])),
  ];
  const r16R = [
    findByTeams(r16All, winner(r32R[0]), winner(r32R[1])),
    findByTeams(r16All, winner(r32R[2]), winner(r32R[3])),
    findByTeams(r16All, winner(r32R[4]), winner(r32R[5])),
    findByTeams(r16All, winner(r32R[6]), winner(r32R[7])),
  ];

  // QF
  const qfL = [
    findByTeams(qfAll, winner(r16L[0]), winner(r16L[1])),
    findByTeams(qfAll, winner(r16L[2]), winner(r16L[3])),
  ];
  const qfR = [
    findByTeams(qfAll, winner(r16R[0]), winner(r16R[1])),
    findByTeams(qfAll, winner(r16R[2]), winner(r16R[3])),
  ];

  // SF
  const sfL = findByTeams(sfAll, winner(qfL[0]), winner(qfL[1]));
  const sfR = findByTeams(sfAll, winner(qfR[0]), winner(qfR[1]));

  const currentRound = (() => {
    for (const r of ['R32', 'R16', 'QF', 'SF', 'FIN']) {
      const ms = matches.filter(m => m.round === r);
      if (ms.length === 0) return r;
      if (ms.some(m => !m.isFinished)) return r;
    }
    return 'FIN';
  })();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = Math.max(0, roundCenter(currentRound) - el.clientWidth / 2);
    });
  }, [currentRound]);

  return (
    <div className={styles.wrap}>
      <div className={styles.scroll} ref={scrollRef}>
        {/* Round headers */}
        <div className={styles.hdrRow}>
          {['R32', 'R16', 'QF', 'SF', 'Final', 'SF', 'QF', 'R16', 'R32'].map((lbl, i) => (
            <span key={i} className={styles.hdr} style={{ width: CARD_W }}>
              {i > 0 && <span style={{ display: 'inline-block', width: CONN_W }} />}
              {lbl}
            </span>
          ))}
        </div>

        <div className={styles.bracket}>
          {/* ── Left half ── */}
          <RoundCol matches={r32L} n={8} ownerMap={ownerMap} />
          <Connector fromN={8} />
          <RoundCol matches={r16L} n={4} ownerMap={ownerMap} />
          <Connector fromN={4} />
          <RoundCol matches={qfL}  n={2} ownerMap={ownerMap} />
          <Connector fromN={2} />
          <RoundCol matches={[sfL]} n={1} ownerMap={ownerMap} />
          <HConn />

          {/* ── Final (center) ── */}
          <div className={styles.finalCol}>
            <div className={styles.slot} style={{ height: COL_H / 2 }}>
              <Card m={fin} ownerMap={ownerMap} />
            </div>
            {p3 && (
              <div className={styles.slot} style={{ height: COL_H / 2 }}>
                <div>
                  <div className={styles.p3Lbl}>3rd place</div>
                  <Card m={p3} ownerMap={ownerMap} />
                </div>
              </div>
            )}
          </div>

          {/* ── Right half (mirror) ── */}
          <HConn />
          <RoundCol matches={[sfR]}  n={1} ownerMap={ownerMap} />
          <Connector fromN={2} mirror />
          <RoundCol matches={qfR}    n={2} ownerMap={ownerMap} />
          <Connector fromN={4} mirror />
          <RoundCol matches={r16R}   n={4} ownerMap={ownerMap} />
          <Connector fromN={8} mirror />
          <RoundCol matches={r32R}   n={8} ownerMap={ownerMap} />
        </div>
      </div>
    </div>
  );
}
