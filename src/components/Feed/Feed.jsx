import styles from './Feed.module.css';
import MatchCard from '../MatchCard/MatchCard';

const NOW = () => Date.now();
const HISTORY_CUTOFF_MS = 48 * 60 * 60 * 1000; // 48 hours

export default function Feed({ matches, videoMap, activeTab }) {
  const now = NOW();

  const liveMatches    = matches.filter(m => m.isLive);
  const recentFinished = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) < HISTORY_CUTOFF_MS
  );
  const upcoming       = matches.filter(m => !m.isLive && !m.isFinished);
  const history        = matches.filter(m =>
    m.isFinished && (now - m.kickoff.getTime()) >= HISTORY_CUTOFF_MS
  );

  // Focus game: current live OR last finished (< 48h)
  const focusId = liveMatches[0]?.id
    ?? recentFinished[recentFinished.length - 1]?.id
    ?? null;

  const feedMatches = [
    ...liveMatches,
    ...recentFinished.slice().reverse(),
    ...upcoming.slice(0, 8),
  ];

  if (activeTab === 'history') {
    return (
      <div className={styles.feed}>
        {history.length === 0 ? (
          <div className={styles.empty}>No finished matches yet</div>
        ) : (
          history.slice().reverse().map(m => (
            <MatchCard
              key={m.id}
              match={m}
              videoInfo={videoMap[`${m.hCode}-${m.aCode}`]}
              isFocus={false}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className={styles.feed}>
      {feedMatches.length === 0 ? (
        <div className={styles.empty}>Loading matches…</div>
      ) : (
        feedMatches.map(m => (
          <MatchCard
            key={m.id}
            match={m}
            videoInfo={videoMap[`${m.hCode}-${m.aCode}`]}
            isFocus={m.id === focusId}
          />
        ))
      )}
    </div>
  );
}
