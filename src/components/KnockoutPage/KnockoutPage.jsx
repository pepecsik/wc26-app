import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import VideoModal from '../VideoModal/VideoModal';
import { PARTICIPANTS } from '../../data/participants';

const find = (name) => PARTICIPANTS.find(x => x.name === name);
const p = (name, videoFilename = null, drinkEmoji = '', drinks = 0) => ({ ...find(name), videoFilename, drinkEmoji, drinks });

const now  = new Date();
const ago  = (h) => new Date(now - h * 3_600_000);
const from = (h) => new Date(now.getTime() + h * 3_600_000);

const R32_SLOTS = [
  // ── PAST: all losers uploaded → green ALL IN overlay ──
  {
    id: 1, label: 'R32 · Match 1',
    hCode: 'MEX', aCode: 'SAF', hGoals: 2, aGoals: 0,
    hState: 'winning', aState: 'losing',
    isLive: false, isFinished: true, kickoff: ago(48),
    hPlayers: [p('Sabo'), p('Tim')],
    aPlayers: [
      p('Pepe',  'WC001_260611_A_MEX-SAF_2-0_PEPE',  '🍺🍺', 2),
      p('Kimbo', 'WC006_260613_C_BRA-MOR_1-1_RAND',   '🍺',   1),
    ],
  },

  // ── PAST: partial upload — some beer emoji, some play button ──
  {
    id: 2, label: 'R32 · Match 2',
    hCode: 'FRA', aCode: 'ARG', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true, kickoff: ago(30),
    hPlayers: [
      p('Sebastian', 'WC004_260612_D_USA-PAR_4-1_SEBASTIAN', '🍸🍺', 2),
      p('Charlie'),
      p('Blake'),
    ],
    aPlayers: [p('Tobias'), p('Adam'), p('Ali')],
  },

  // ── PAST: draw — both sides partial, 4v4 ──
  {
    id: 3, label: 'R32 · Match 3',
    hCode: 'NED', aCode: 'GER', hGoals: 1, aGoals: 1,
    hState: 'draw', aState: 'draw',
    isLive: false, isFinished: true, kickoff: ago(32),
    hPlayers: [
      p('Purcy',  'WC003_260612_B_CAN-BOS_1-1_PURCY', '🍺🍺', 2),
      p('Russ'),
      p('Jimmy',  'WC009_260614_E_GER-CUR_7-1_MALOU',  '🍺🍺🍺', 3),
      p('Malou'),
    ],
    aPlayers: [
      p('Charlie', 'WC002_260611_A_SKO-CZE_2-1_CHONGA', '🍺',  1),
      p('Emma'),
      p('Michael', 'WC011_260614_E_CIV-ECU_1-0_MICHAEL', '🍷', 1),
      p('Rogier'),
    ],
  },

  // ── PAST: side bet + everyone uploaded ──
  {
    id: 4, label: 'R32 · Match 4',
    hCode: 'ENG', aCode: 'POR', hGoals: 1, aGoals: 2,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true, kickoff: ago(40),
    sideBetDrinks: 2, sideBetDesc: 'Loser does a spicy shot 🌶️',
    hPlayers: [
      p('Emma',    'WC011_260614_E_CIV-ECU_1-0_MICHAEL', '🍺🌶️', 1),
      p('J$',      'WC008_260613_D_AUS-TUR_2-0_J$',      '🍺🌶️', 1),
      p('Malou',   'WC009_260614_E_GER-CUR_7-1_MALOU',   '🍺🌶️', 1),
    ],
    aPlayers: [p('Scotty2Hotty'), p('Nathanial'), p('Rogier')],
  },

  // ── ALARM ZONE: kickoff 23.5h ago — less than 3h left on deadline ──
  {
    id: 5, label: 'R32 · Match 5',
    hCode: 'BRA', aCode: 'URU', hGoals: 3, aGoals: 1,
    hState: 'winning', aState: 'losing',
    isLive: false, isFinished: true, kickoff: ago(23.5),
    hPlayers: [p('Rand'), p('Tobias')],
    aPlayers: [
      p('Malou', 'WC012_260614_F_SWE-TUN_5-1_RAND', '🍺🍺', 2),
      p('Will Hunt'),
    ],
  },

  // ── OVERDUE: kickoff 28h ago — deadline passed ──
  {
    id: 6, label: 'R32 · Match 6',
    hCode: 'ESP', aCode: 'COL', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true, kickoff: ago(28),
    hPlayers: [
      p('Sjaak'),       // overdue — no video
      p('Nathanial'),   // overdue — no video
    ],
    aPlayers: [p('Ali'), p('Jimmy')],
  },

  // ── LIVE: 2v2 — losing side shaking, no videos ──
  {
    id: 7, label: 'R32 · Match 7',
    hCode: 'ARG', aCode: 'USA', hGoals: 1, aGoals: 2,
    hState: 'losing', aState: 'winning',
    isLive: true, isFinished: false, kickoff: ago(1.2), status: '2H', elapsed: 67,
    hPlayers: [p('Tobias'), p('Adam')],
    aPlayers: [p('Blake'), p('Charlie')],
  },

  // ── UPCOMING soon — 4v4 with side bet ──
  {
    id: 8, label: 'R32 · Match 8',
    hCode: 'JPN', aCode: 'MOR', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: from(2),
    sideBetDrinks: 3, sideBetDesc: 'Loser chugs a full pint 🍺',
    hPlayers: [p('Pepe'), p('Tim'), p('Rand'), p('Sabo')].map(q => ({ ...q })),
    aPlayers: [p('Kimbo'), p('Rogier'), p('Michael'), p('Purcy')].map(q => ({ ...q })),
  },

  // ── PAST: 6v6 — losing side partial uploads, side bet ──
  {
    id: 9, label: 'R32 · Match 9',
    hCode: 'GER', aCode: 'BEL', hGoals: 3, aGoals: 1,
    hState: 'winning', aState: 'losing',
    isLive: false, isFinished: true, kickoff: ago(36),
    sideBetDrinks: 1, sideBetDesc: 'Loser sings a song in public 🎤',
    hPlayers: ['Charlie','Emma','Sebastian','J$','Malou','Will Hunt'].map(n => p(n)),
    aPlayers: [
      p('Russ',    'WC001_260611_A_MEX-SAF_2-0_PEPE',  '🍺',   1),
      p('Kimbo',   'WC006_260613_C_BRA-MOR_1-1_RAND',  '🍺🎤', 1),
      p('Sabo'),
      p('Chonga',  'WC003_260612_B_CAN-BOS_1-1_PURCY', '🍺🎤', 1),
      p('Sjaak'),
      p('Rand',    'WC004_260612_D_USA-PAR_4-1_SEBASTIAN','🍺🎤',1),
    ],
  },

  // ── UPCOMING — 6v6 preview ──
  {
    id: 10, label: 'R32 · Match 10',
    hCode: 'ITA', aCode: 'CHI', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: from(5),
    hPlayers: ['Pepe','Tim','Adam','Blake','Tobias','Sebastian'].map(n => p(n)),
    aPlayers: ['Nathanial','Scotty2Hotty','Michael','Emma','J$','Purcy'].map(n => p(n)),
  },

  // ── TBD slots ──
  ...Array.from({ length: 6 }, (_, i) => ({
    id: i + 11, label: `R32 · Match ${i + 11}`,
    hCode: null, aCode: null, hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: null,
    hPlayers: [], aPlayers: [],
  })),
];

export default function KnockoutPage() {
  const scrollRef = useRef(null);
  const itemRefs  = useRef({});
  const [activeId, setActiveId] = useState(null);
  const [video, setVideo] = useState(null);

  const liveMatches    = R32_SLOTS.filter(m => m.isLive);
  const recentFinished = R32_SLOTS.filter(m => m.isFinished);
  const focusId = liveMatches[0]?.id
    ?? recentFinished[recentFinished.length - 1]?.id
    ?? R32_SLOTS.find(m => !m.isFinished && !m.isLive)?.id
    ?? R32_SLOTS[0]?.id;

  useLayoutEffect(() => {
    if (!focusId) return;
    const frame = requestAnimationFrame(() => {
      const el = itemRefs.current[focusId];
      if (!el || !scrollRef.current) return;
      const container = scrollRef.current;
      const offset = el.offsetTop - container.clientHeight * 0.35;
      container.scrollTop = offset;
      setActiveId(focusId);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const snapLine = container.scrollTop + container.clientHeight * 0.35;
      let closestId = null, closestDist = Infinity;
      Object.entries(itemRefs.current).forEach(([id, el]) => {
        if (!el) return;
        const dist = Math.abs(el.offsetTop - snapLine);
        if (dist < closestDist) { closestDist = dist; closestId = Number(id); }
      });
      if (closestId !== null) setActiveId(closestId);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className={styles.header}>
        <span className={styles.title}>Round of 32</span>
        <span className={styles.badge}>PREVIEW</span>
      </div>

      <div className={styles.slotContainer} ref={scrollRef}>
        {R32_SLOTS.map(m => {
          const isActive = m.id === activeId;
          return (
            <div
              key={m.id}
              ref={el => { itemRefs.current[m.id] = el; }}
              className={`${styles.slotItem} ${isActive ? styles.slotFocus : styles.slotSmall}`}
            >
              <KnockoutMatchCard
                match={m}
                isFocus={isActive}
                onVideoOpen={(filenames, title, startIdx) => setVideo({ filenames, title, startIdx })}
              />
            </div>
          );
        })}
      </div>

      {video && (
        <VideoModal
          filenames={video.filenames}
          title={video.title}
          startIdx={video.startIdx ?? 0}
          onClose={() => setVideo(null)}
        />
      )}
    </>
  );
}
