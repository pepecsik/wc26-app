import { useEffect, useRef } from 'react';
import styles from './Feed.module.css';
import MatchCard from '../MatchCard/MatchCard';

const NOW = () => Date.now();
const HISTORY_CUTOFF_MS = 48 * 60 * 60 * 1000;

export default function Feed({ matches, videoMap, activeTab }) {
  const now       = NOW();
  const scrollRef = useRef(null);
  const focusRef  = useRef(null);

  const liveMatches    = matches.filter(m => m.isLive);
  const recentFinished = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) < HISTORY_CUTOFF_MS
  );
  const upcoming = matches.filter(m => !m.isLive && !m.isFinished);
  const history  = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) >= HISTORY_CUTOFF_MS
  );

  // Focus: live game OR most recently finished (last in chronological order)
  const focusId = liveMatches[0]?.id
    ?? recentFinished[recentFinished.length - 1]?.id
    ?? null;

  // Order: oldest finished first → live → upcoming (focus card ends up near center)
  const feedMatches = [
    ...recentFinished,          // chronological: MEX first, then SKO, etc.
    ...liveMatches,
    ...upcoming.slice(0, 8),
  ];

  // Scroll focus card into center on load
  useEffect(() => {
    if (focusRef.current && scrollRef.current) {
      focusRef.current.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }, [focusId, matches.length]);

  if (activeTab === 'history') {
    return (
      <div className={styles.feed}>
        {history.length === 0 ? (
          <div className={styles.empty}>No finished matches yet</div>
        ) : (
          history.map(m => (
            <MatchCard key={m.id} match={m}
              videoInfo={videoMap[`${m.hCode}-${m.aCode}`]} isFocus={false} />
          ))
        )}
      </div>
    );
  }

  return (
    <div className={styles.slotContainer} ref={scrollRef}>
      {feedMatches.length === 0 ? (
        <div className={styles.empty}>Loading matches…</div>
      ) : (
        feedMatches.map(m => {
          const isFocus = m.id === focusId;
          return (
            <div
              key={m.id}
              className={`${styles.slotItem} ${isFocus ? styles.slotFocus : styles.slotSmall}`}
              ref={isFocus ? focusRef : null}
            >
              <MatchCard
                match={m}
                videoInfo={videoMap[`${m.hCode}-${m.aCode}`]}
                isFocus={isFocus}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
