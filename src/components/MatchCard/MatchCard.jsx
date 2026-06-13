import { useState, useEffect } from 'react';
import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// 24h after match ends (~26h after noon kickoff placeholder)
const DEADLINE_MS = 26 * 60 * 60 * 1000;

function VideoCountdown({ kickoff, drinkers }) {
  const deadline = kickoff.getTime() + DEADLINE_MS;
  const [remaining, setRemaining] = useState(deadline - Date.now());

  useEffect(() => {
    const t = setInterval(() => setRemaining(deadline - Date.now()), 60_000);
    return () => clearInterval(t);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <div className={styles.countdown + ' ' + styles.countdownOverdue}>
        ⚠️ OVERDUE — {drinkers}
      </div>
    );
  }

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <div className={styles.countdown}>
      🎬 {drinkers} • {timeStr} left to send video
    </div>
  );
}

export default function MatchCard({ match, videoInfo, isFocus, onVideoOpen }) {
  const { hCode, aCode, hGoals, aGoals, hState, aState, hOwner, aOwner,
          isLive, isFinished, kickoff, elapsed } = match;

  const hTeam = TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️', group: '?' };
  const aTeam = TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️', group: '?' };

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
  const hasVideo    = !!(videoInfo?.filename);
  const videoTitle  = `${hTeam.flag} ${hCode} vs ${aCode} ${aTeam.flag}`;
  const aFilename   = videoInfo?.filename2 || videoInfo?.filename;

  // Who needs to send the punishment video
  const drinkers = isFinished && !hasVideo ? (() => {
    if (hState === 'losing' && aState === 'losing') return `${hOwner?.name} & ${aOwner?.name}`;
    if (hState === 'losing') return hOwner?.name ?? hCode;
    if (aState === 'losing') return aOwner?.name ?? aCode;
    return null;
  })() : null;

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
        state={hState} matchState={matchState} isFocus={isFocus}
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

        {drinkers && <VideoCountdown kickoff={kickoff} drinkers={drinkers} />}
      </div>

      <AvatarBadge
        participant={aOwner} teamCode={aCode} teamFlag={aTeam.flag}
        state={aState} matchState={matchState} isFocus={isFocus}
        hasVideo={hasVideo && (aState === 'losing' || aState === 'draw')}
        onVideoClick={() => onVideoOpen(aFilename, videoTitle)}
      />
    </div>
  );
}
