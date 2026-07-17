import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import VideoModal from '../VideoModal/VideoModal';

const ROUNDS_FOR_TAB = {
  r32: ['R32'],
  r16: ['R16'],
  qf:  ['QF'],
  sf:  ['SF', 'FIN', '3P'],
};

const TABS = [
  { id: 'r32', label: 'R32' },
  { id: 'r16', label: 'R16' },
  { id: 'qf',  label: 'QF' },
  { id: 'sf',  label: 'SF · Final' },
];

export default function KnockoutPage({ stage: stageProp, matches = [], koVideos = {} }) {
  const scrollRef = useRef(null);
  const itemRefs  = useRef({});
  const [activeId, setActiveId] = useState(null);
  const [video, setVideo]       = useState(null);
  const [tab, setTab]           = useState(stageProp ?? 'r32');
  const controlled = !!stageProp;

  useEffect(() => { if (stageProp) setTab(stageProp); }, [stageProp]);

  const rounds = ROUNDS_FOR_TAB[tab] || [];
  const tabMatches = matches
    .filter(m => rounds.includes(m.round))
    .sort((a, b) => a.kickoff - b.kickoff);

  const slots = tabMatches.map((m, i) => {
    const matchKey = `${m.hCode}-${m.aCode}`;
    const kvMap    = koVideos[matchKey] || {};
    const hOwners  = [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean);
    const aOwners  = [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
    const toPlayer = owner => {
      const kv = kvMap[owner.name];
      return {
        ...owner,
        videoFilename:  kv?.filename  ? `${kv.folder}/${kv.filename}`  : null,
        videoFilename2: kv?.filename2 ? `${kv.folder}/${kv.filename2}` : null,
        drinkEmoji:    kv?.emoji || '',
        drinks:        kv?.drinks ?? 0,
      };
    };
    return {
      ...m,
      label:    `${m.round} · Match ${i + 1}`,
      hPlayers: hOwners.map(toPlayer),
      aPlayers: aOwners.map(toPlayer),
    };
  });

  const liveSlots     = slots.filter(m => m.isLive);
  const finishedSlots = slots.filter(m => m.isFinished);
  const focusId = liveSlots[0]?.id
    ?? finishedSlots[finishedSlots.length - 1]?.id
    ?? slots.find(m => !m.isFinished && !m.isLive)?.id
    ?? slots[0]?.id;

  useLayoutEffect(() => {
    if (!focusId) return;
    const frame = requestAnimationFrame(() => {
      const el = itemRefs.current[focusId];
      if (!el || !scrollRef.current) return;
      const container = scrollRef.current;
      container.scrollTop = el.offsetTop - container.clientHeight * 0.35;
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
      {!controlled && (
        <div className={styles.tabBar}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
              onClick={() => setTab(t.id)}
            >{t.label}</button>
          ))}
        </div>
      )}

      <div className={styles.slotContainer} ref={scrollRef}>
        {slots.length === 0
          ? <div className={styles.comingSoon}>No matches yet</div>
          : slots.map(m => {
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
            })
        }
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
