import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// VideoModal is rendered at Feed level to avoid being clipped by scale transforms
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
      <div className={styles.topBar}>
        <span className={styles.group}>Group {hTeam.group}</span>
        {isLive && (
          <span className={styles.livePill}>
            <span className={styles.liveDot} />LIVE {elapsed}'
          </span>
        )}
        {isFinished && <span className={styles.ftPill}>FT</span>}
        {!isLive && !isFinished && (
          <span className={styles.kickoff}>{formatDate(kickoff)} · {formatKickoff(kickoff)}</span>
        )}
      </div>

      <div className={styles.body}>
        <AvatarBadge
          participant={hOwner} teamCode={hCode} teamFlag={hTeam.flag}
          state={hState} matchState={matchState}
          hasVideo={hasVideo && (hState === 'losing' || hState === 'draw')}
          onVideoClick={() => onVideoOpen(videoInfo.filename, videoTitle)}
        />
        <div className={styles.scoreBlock}>
          {(isLive || isFinished) ? (
            <div className={styles.score}>
              <span className={hState === 'winning' ? styles.scoreWin : ''}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : ''}>{aGoals}</span>
            </div>
          ) : (
            <div className={styles.vs}>VS</div>
          )}
          <div className={styles.groupFull}>Group {hTeam.group}</div>
        </div>
        <AvatarBadge
          participant={aOwner} teamCode={aCode} teamFlag={aTeam.flag}
          state={aState} matchState={matchState}
          hasVideo={hasVideo && (aState === 'losing' || aState === 'draw')}
          onVideoClick={() => onVideoOpen(videoInfo.filename, videoTitle)}
        />
      </div>

      <div className={styles.teamNames}>
        <span>{hTeam.full}</span>
        <span>{aTeam.full}</span>
      </div>
    </div>
  );
}
