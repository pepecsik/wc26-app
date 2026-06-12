import { useState } from 'react';
import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import VideoModal from '../VideoModal/VideoModal';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function MatchCard({ match, videoInfo, isFocus }) {
  const [modal, setModal] = useState(false);
  const { hCode, aCode, hGoals, aGoals, hState, aState, hOwner, aOwner,
          isLive, isFinished, kickoff, elapsed, status } = match;

  const hTeam = TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️', group: '?' };
  const aTeam = TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️', group: '?' };

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
  const hasVideo   = !!(videoInfo?.driveFileId);
  const videoTitle = `${hTeam.flag} ${hCode} vs ${aCode} ${aTeam.flag}`;

  const cardClass = [
    styles.card,
    isLive     ? styles.live     : '',
    isFinished ? styles.finished : '',
    isFocus    ? styles.focus    : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      <div className={cardClass}>
        {/* Group badge */}
        <div className={styles.topBar}>
          <span className={styles.group}>Group {hTeam.group}</span>
          {isLive && (
            <span className={styles.livePill}>
              <span className={styles.liveDot} />
              LIVE {elapsed}'
            </span>
          )}
          {isFinished && <span className={styles.ftPill}>FT</span>}
          {!isLive && !isFinished && (
            <span className={styles.kickoff}>
              {formatDate(kickoff)} · {formatKickoff(kickoff)}
            </span>
          )}
        </div>

        {/* Main content */}
        <div className={styles.body}>
          <AvatarBadge
            participant={hOwner}
            teamCode={hCode}
            teamFlag={hTeam.flag}
            state={hState}
            matchState={matchState}
            hasVideo={hasVideo && (hState === 'losing' || hState === 'draw')}
            onVideoClick={() => setModal(true)}
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
            participant={aOwner}
            teamCode={aCode}
            teamFlag={aTeam.flag}
            state={aState}
            matchState={matchState}
            hasVideo={hasVideo && (aState === 'losing' || aState === 'draw')}
            onVideoClick={() => setModal(true)}
          />
        </div>

        {/* Bottom: team names */}
        <div className={styles.teamNames}>
          <span>{hTeam.full}</span>
          <span>{aTeam.full}</span>
        </div>
      </div>

      {modal && hasVideo && (
        <VideoModal
          driveFileId={videoInfo.driveFileId}
          title={videoTitle}
          onClose={() => setModal(false)}
        />
      )}
    </>
  );
}
