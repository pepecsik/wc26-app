import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import VideoModal from '../VideoModal/VideoModal';
import { PARTICIPANTS } from '../../data/participants';

const find = (name) => PARTICIPANTS.find(x => x.name === name);
const with_ = (name, videoFilename = null, drinkEmoji = '') => ({ ...find(name), videoFilename, drinkEmoji });

const now   = new Date();
const ago   = (h) => new Date(now - h * 3_600_000);
const from  = (h) => new Date(now.getTime() + h * 3_600_000);

const R32_SLOTS = [
  // Past — FT — loser all uploaded
  {
    id: 1, label: 'R32 · Match 1',
    hCode: 'MEX', aCode: 'SAF', hGoals: 2, aGoals: 0,
    hState: 'winning', aState: 'losing',
    isLive: false, isFinished: true, kickoff: ago(30),
    hPlayers: [with_('Sabo'), with_('Tim')],
    aPlayers: [
      with_('Pepe',  'WC001_260611_A_MEX-SAF_2-0_PEPE',  '🍺🍺'),
      with_('Kimbo', 'WC006_260613_C_BRA-MOR_1-1_RAND',   '🍺'),
    ],
  },
  // Past — FT — loser partial upload
  {
    id: 2, label: 'R32 · Match 2',
    hCode: 'FRA', aCode: 'ARG', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true, kickoff: ago(28),
    hPlayers: [
      with_('Sebastian', 'WC004_260612_D_USA-PAR_4-1_SEBASTIAN', '🍸🍺'),
      with_('Charlie'),   // still owes
      with_('Blake'),     // still owes
    ],
    aPlayers: [with_('Tobias'), with_('Adam'), with_('Ali')],
  },
  // Past — FT draw — mixed both sides
  {
    id: 3, label: 'R32 · Match 3',
    hCode: 'NED', aCode: 'GER', hGoals: 1, aGoals: 1,
    hState: 'draw', aState: 'draw',
    isLive: false, isFinished: true, kickoff: ago(32),
    hPlayers: [
      with_('Purcy',  'WC003_260612_B_CAN-BOS_1-1_PURCY', '🍺🍺'),
      with_('Russ'),
      with_('Jimmy',  'WC009_260614_E_GER-CUR_7-1_MALOU',  '🍺🍺🍺'),
    ],
    aPlayers: [
      with_('Charlie', 'WC002_260611_A_SKO-CZE_2-1_CHONGA', '🍺'),
      with_('Emma'),
      with_('Michael', 'WC011_260614_E_CIV-ECU_1-0_MICHAEL', '🍷'),
    ],
  },
  // LIVE — 2v2 losing side shivering, no videos yet
  {
    id: 4, label: 'R32 · Match 4',
    hCode: 'ESP', aCode: 'BRA', hGoals: 1, aGoals: 2,
    hState: 'losing', aState: 'winning',
    isLive: true, isFinished: false, kickoff: ago(1.2), status: '2H', elapsed: 67,
    hPlayers: [with_('Sjaak'), with_('Nathanial')],
    aPlayers: [with_('Rand'), with_('Tobias')],
  },
  // Upcoming soon — 4v4
  {
    id: 5, label: 'R32 · Match 5',
    hCode: 'ENG', aCode: 'POR', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: from(2.5),
    hPlayers: [with_('Emma'), with_('J$'), with_('Malou'), with_('Scotty2Hotty')],
    aPlayers: [with_('Scotty2Hotty'), with_('Rogier'), with_('Michael'), with_('Pepe')],
  },
  // Upcoming — 6v6 (semi-final territory preview)
  {
    id: 6, label: 'R32 · Match 6',
    hCode: 'ARG', aCode: 'USA', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: from(5),
    hPlayers: ['Tobias','Ali','Sabo','Will Hunt','Chonga','Malou'].map(n => with_(n)),
    aPlayers: ['Adam','Blake','Jimmy','Rand','Rogier','Sebastian'].map(n => with_(n)),
  },
  // TBD
  ...Array.from({ length: 10 }, (_, i) => ({
    id: i + 7, label: `R32 · Match ${i + 7}`,
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
      const offset = el.offsetTop + el.clientHeight - container.clientHeight * 0.53;
      container.scrollTop = offset;
      setActiveId(focusId);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const center = container.scrollTop + container.clientHeight * 0.36;
      let closestId = null, closestDist = Infinity;
      Object.entries(itemRefs.current).forEach(([id, el]) => {
        if (!el) return;
        const dist = Math.abs((el.offsetTop + el.clientHeight / 2) - center);
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
                onVideoOpen={(filenames, title) => setVideo({ filenames, title })}
              />
            </div>
          );
        })}
      </div>

      {video && <VideoModal {...video} onClose={() => setVideo(null)} />}
    </>
  );
}
