import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import VideoCountdown from '../VideoCountdown/VideoCountdown';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function MatchCard({ match, videoInfo, isFocus, onVideoOpen }) {
  const { hCode, aCode, hGoals, aGoals, hState, aState, hOwner, aOwner,
          isLive, isFinished, kickoff, elapsed, sideBetDrinks, sideBetDesc, sideBetEmoji } = match;

  const hTeam = TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️', group: '?' };
  const aTeam = TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️', group: '?' };

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
  const videoTitle  = `${hTeam.flag} ${hCode} vs ${aCode} ${aTeam.flag}`;

  // For draws, use drinks (written only on actual upload) not filename (formula auto-populates both)
  const hHasVideo = hState === 'losing' ? !!(videoInfo?.filename)
                  : hState === 'draw'   ? (videoInfo?.drinks1 != null)
                  : false;
  const aHasVideo = aState === 'losing' ? !!(videoInfo?.filename)
                  : aState === 'draw'   ? (videoInfo?.drinks2 != null)
                  : false;
  const aFilename = videoInfo?.filename2 || videoInfo?.filename;

  // Extra videos — col X (filename3) for home/loser, col Y (filename4) for away in draws
  const hHasVideo2 = hState === 'losing' ? !!(videoInfo?.filename3)
                   : hState === 'draw'   ? !!(videoInfo?.filename3)
                   : false;
  const aHasVideo2 = aState === 'losing' ? !!(videoInfo?.filename3)
                   : aState === 'draw'   ? !!(videoInfo?.filename4)
                   : false;

  const hFilenames = [
    ...(videoInfo?.filename ? [videoInfo.filename] : []),
    ...(hState === 'draw' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
    ...(hState === 'losing' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
  ];
  const aFilenames = aState === 'draw'
    ? [
        ...(aFilename ? [aFilename] : []),
        ...(videoInfo?.filename4 ? [videoInfo.filename4] : []),
      ]
    : [
        ...(aFilename ? [aFilename] : []),
        ...(aState === 'losing' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
      ];

  // Who still needs to send a punishment video
  const drinkers = (() => {
    if (!isFinished) return null;
    if (hState === 'draw') {
      if (hHasVideo && aHasVideo) return null;
      if (hHasVideo) return aOwner?.name ?? aCode;
      if (aHasVideo) return hOwner?.name ?? hCode;
      return `${hOwner?.name ?? hCode} & ${aOwner?.name ?? aCode}`;
    }
    if (hState === 'losing' && !hHasVideo) return hOwner?.name ?? hCode;
    if (aState === 'losing' && !aHasVideo) return aOwner?.name ?? aCode;
    return null;
  })();

  const cardClass = [
    styles.card,
    isLive          ? styles.live     : '',
    isFinished      ? styles.finished : '',
    isFocus         ? styles.focus    : '',
    sideBetDrinks > 0 ? styles.sideBet : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClass}>
      <div className={styles.cardRow}>
      <AvatarBadge
        participant={hOwner} teamCode={hCode} teamFlag={hTeam.flag}
        state={hState} matchState={matchState} isFocus={isFocus}
        hasVideo={hHasVideo} hasVideo2={hHasVideo2}
        onVideoClick={() => onVideoOpen(hFilenames, videoTitle)}
        drinkEmoji={videoInfo?.emoji1 || ''}
        sideBetDrinks={sideBetDrinks}
        sideBetEmoji={sideBetEmoji}
      />

      <div className={styles.center}>
        <div className={styles.meta}>
          <span className={styles.groupLabel}>Group {hTeam.group}</span>
          {isLive && (
            <span className={styles.livePill}>
              <span className={styles.liveDot} />
              {match.status === 'HT' ? 'HT' : elapsed != null ? `${elapsed}'` : 'LIVE'}
            </span>
          )}
          {isFinished && <span className={styles.ftPill}>FT</span>}
          {!isLive && !isFinished && (
            <span className={styles.kickoffLabel}>{formatDate(kickoff)}</span>
          )}
        </div>

        <div className={styles.vsRow}>
          <span className={styles.vsFlag}>{hTeam.flag}</span>
          <span className={styles.vs}>VS</span>
          <span className={styles.vsFlag}>{aTeam.flag}</span>
        </div>

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
          <span className={styles.teamName}>{hTeam.full}</span>
          <span className={styles.teamName}>{aTeam.full}</span>
        </div>

      </div>

      <AvatarBadge
        participant={aOwner} teamCode={aCode} teamFlag={aTeam.flag}
        state={aState} matchState={matchState} isFocus={isFocus}
        hasVideo={aHasVideo} hasVideo2={aHasVideo2}
        onVideoClick={() => onVideoOpen(aFilenames, videoTitle)}
        drinkEmoji={aState === 'draw' ? (videoInfo?.emoji2 || '') : (videoInfo?.emoji1 || '')}
        sideBetDrinks={sideBetDrinks}
        sideBetEmoji={sideBetEmoji}
      />
      </div>

      {sideBetDrinks > 0 && (
        <div className={styles.sideBetBanner}>
          💰 SIDE BET · {sideBetDesc || `+${sideBetDrinks} extra drink${sideBetDrinks > 1 ? 's' : ''}`}
        </div>
      )}
      {drinkers && <VideoCountdown kickoff={kickoff} drinkers={drinkers} cardStyles={styles} />}
    </div>
  );
}
