import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function MatchCard({ match, videoInfo, isFocus, onVideoOpen }) {
  const { hCode, aCode, hGoals, aGoals, hState, aState, hOwner, aOwner,
          isLive, isFinished, kickoff, elapsed } = match;

  const hTeam = TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️', group: '?' };
  const aTeam = TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️', group: '?' };

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
  const hasVideo   = !!(videoInfo?.filename);
  const videoTitle = `${hTeam.flag} ${hCode} vs ${aCode} ${aTeam.flag}`;

  const cardClass = [
    styles.card,
    isLive     ? styles.live     : '',
    isFinished ? styles.finished : '',
    isFocus    ? styles.focus    : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <AvatarBadge
        participant={hOwner} teamCode={hCode} teamFlag={hTeam.flag}
        state={hState} matchState={matchState}
        hasVideo={hasVideo && (hState === 'losing' || hState === 'draw')}
        onVideoClick={() => onVideoOpen(videoInfo.filename, videoTitle)}
      />

      <div className={styles.center}>
        <div className={styles.meta}>
          <span className={styles.groupLabel}>Group {hTeam.group}</span>
          {isLive && (
            <span className={styles.livePill}>
              <span className={styles.liveDot} />LIVE {elapsed}'
            </span>
          )}
          {isFinished && <span className={styles.ftPill}>FT</span>}
          {!isLive && !isFinished && (
            <span className={styles.kickoffLabel}>{formatDate(kickoff)}</span>
          )}
        </div>

        <div className={styles.vs}>VS</div>

        <div className={styles.scoreRow}>
          {(isLive || isFinished) ? (
            <>
              <span className={hState === 'winning' ? styles.scoreWin : styles.scoreNum}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : styles.scoreNum}>{aGoals}</span>
            </>
          ) : (
            <span className={styles.kickoffTime}>{formatKickoff(kickoff)}</span>
          )}
        </div>

        <div className={styles.teamsRow}>
          <span>{hTeam.flag} {hCode}</span>
          <span>{aCode} {aTeam.flag}</span>
        </div>
      </div>

      <AvatarBadge
        participant={aOwner} teamCode={aCode} teamFlag={aTeam.flag}
        state={aState} matchState={matchState}
        hasVideo={hasVideo && (aState === 'losing' || aState === 'draw')}
        onVideoClick={() => onVideoOpen(videoInfo.filename, videoTitle)}
      />
    </div>
  );
}
