import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Feed.module.css';
import MatchCard from '../MatchCard/MatchCard';
import VideoModal from '../VideoModal/VideoModal';

const NOW = () => Date.now();
const HISTORY_CUTOFF_MS = 48 * 60 * 60 * 1000;

export default function Feed({ matches, videoMap, activeTab }) {
  const now         = NOW();
  const scrollRef   = useRef(null);
  const itemRefs    = useRef({});
  const [activeId, setActiveId] = useState(null);
  const [video, setVideo]       = useState(null); // { driveFileId, title }

  const liveMatches    = matches.filter(m => m.isLive);
  const recentFinished = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) < HISTORY_CUTOFF_MS
  );
  const upcoming = matches.filter(m => !m.isLive && !m.isFinished);
  const history  = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) >= HISTORY_CUTOFF_MS
  );

  const focusId = liveMatches[0]?.id
    ?? recentFinished[recentFinished.length - 1]?.id
    ?? null;

  const feedMatches = [
    ...recentFinished,
    ...liveMatches,
    ...upcoming.slice(0, 8),
  ];

  // Scroll to focus card once matches are loaded and DOM is painted
  useLayoutEffect(() => {
    if (!focusId) return;
    const frame = requestAnimationFrame(() => {
      const el = itemRefs.current[focusId];
      if (!el || !scrollRef.current) return;
      const container = scrollRef.current;
      const offset = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTop = offset;
      setActiveId(focusId);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId, matches.length]);

  // Update active card while scrolling
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      const containerCenter = container.scrollTop + container.clientHeight / 2;
      let closestId = null;
      let closestDist = Infinity;
      Object.entries(itemRefs.current).forEach(([id, el]) => {
        if (!el) return;
        const elCenter = el.offsetTop + el.clientHeight / 2;
        const dist = Math.abs(containerCenter - elCenter);
        if (dist < closestDist) { closestDist = dist; closestId = Number(id); }
      });
      if (closestId !== null) setActiveId(closestId);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [feedMatches.length]);

  if (activeTab === 'history') {
    return (
      <div className={styles.feed}>
        {history.length === 0
          ? <div className={styles.empty}>No finished matches yet</div>
          : history.map(m => (
              <MatchCard key={m.id} match={m}
                videoInfo={videoMap[`${m.hCode}-${m.aCode}`]}
                isFocus={false}
                onVideoOpen={(filename, title) => setVideo({ filename, title })}
              />
            ))
        }
        {video && <VideoModal {...video} onClose={() => setVideo(null)} />}
      </div>
    );
  }

  return (
    <>
      <div className={styles.slotContainer} ref={scrollRef}>
        {feedMatches.length === 0
          ? <div className={styles.empty}>Loading matches…</div>
          : feedMatches.map(m => {
              const isActive = m.id === activeId;
              return (
                <div
                  key={m.id}
                  ref={el => { itemRefs.current[m.id] = el; }}
                  className={`${styles.slotItem} ${isActive ? styles.slotFocus : styles.slotSmall}`}
                >
                  <MatchCard
                    match={m}
                    videoInfo={videoMap[`${m.hCode}-${m.aCode}`]}
                    isFocus={isActive}
                    onVideoOpen={(filename, title) => setVideo({ filename, title })}
                  />
                </div>
              );
            })
        }
      </div>
      {video && <VideoModal {...video} onClose={() => setVideo(null)} />}
    </>
  );
}
