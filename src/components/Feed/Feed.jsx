import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import styles from './Feed.module.css';
import MatchCard from '../MatchCard/MatchCard';
import VideoModal from '../VideoModal/VideoModal';

export default function Feed({ matches, videoMap }) {
  const scrollRef = useRef(null);
  const itemRefs  = useRef({});
  const [activeId, setActiveId] = useState(null);
  const [video, setVideo]       = useState(null);

  const liveMatches    = matches.filter(m => m.isLive);
  const recentFinished = matches.filter(m => m.isFinished);

  // Focus: live match, or last finished, or first upcoming
  const focusId = liveMatches[0]?.id
    ?? recentFinished[recentFinished.length - 1]?.id
    ?? matches[0]?.id
    ?? null;

  // All matches chronological — scroll up for past, down for future
  const allMatches = [...matches].sort((a, b) => a.kickoff - b.kickoff);

  // Scroll to focus card on load
  useLayoutEffect(() => {
    if (!focusId) return;
    const frame = requestAnimationFrame(() => {
      const el = itemRefs.current[focusId];
      if (!el || !scrollRef.current) return;
      const container = scrollRef.current;
      const offset = el.offsetTop - container.clientHeight * 0.62 + el.clientHeight / 2;
      container.scrollTop = offset;
      setActiveId(focusId);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusId, matches.length]);

  // Track active card while scrolling
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const onScroll = () => {
      const center = container.scrollTop + container.clientHeight / 2;
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
  }, [allMatches.length]);

  return (
    <>
      <div className={styles.slotContainer} ref={scrollRef}>
        {allMatches.length === 0
          ? <div className={styles.empty}>Loading matches…</div>
          : allMatches.map(m => {
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
