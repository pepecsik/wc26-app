import styles from './KnockoutMatchCard.module.css';
import TeamAvatarGroup from '../TeamAvatarGroup/TeamAvatarGroup';
import VideoCountdown from '../VideoCountdown/VideoCountdown';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function KnockoutMatchCard({ match, isFocus, onVideoOpen }) {
  const {
    hCode, aCode, hGoals, aGoals, hState, aState,
    isLive, isFinished, kickoff, status, elapsed,
    hPlayers = [], aPlayers = [],
    label, sideBetDrinks = 0, sideBetDesc = '',
  } = match;

  const hTeam = hCode ? (TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️' }) : null;
  const aTeam = aCode ? (TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️' }) : null;

  // Show states during live AND finished (fix: was only finished before)
  const hAvatarState = (isLive || isFinished) ? hState : 'neutral';
  const aAvatarState = (isLive || isFinished) ? aState : 'neutral';

  // All uploaded videos from this match (h side first), in order — for left/right browsing
  const allMatchVideos = [
    ...hPlayers.filter(p => p.videoFilename).map(p => p.videoFilename),
    ...aPlayers.filter(p => p.videoFilename).map(p => p.videoFilename),
  ];

  // Drink emoji banner
  const hEmojis = hPlayers.filter(p => p.videoFilename && p.drinkEmoji).map(p => p.drinkEmoji).join('');
  const aEmojis = aPlayers.filter(p => p.videoFilename && p.drinkEmoji).map(p => p.drinkEmoji).join('');
  const hasEmojis = hEmojis || aEmojis;

  // Video upload counter per side (for loser/draw sides only)
  const hIsLoser = hAvatarState === 'losing' || hAvatarState === 'draw';
  const aIsLoser = aAvatarState === 'losing' || aAvatarState === 'draw';
  const hUploaded = hIsLoser ? hPlayers.filter(p => p.videoFilename).length : 0;
  const hTotal    = hIsLoser ? hPlayers.length : 0;
  const aUploaded = aIsLoser ? aPlayers.filter(p => p.videoFilename).length : 0;
  const aTotal    = aIsLoser ? aPlayers.length : 0;
  const showCounter = (hTotal > 0 || aTotal > 0) && isFinished;

  // Who still needs to upload (for VideoCountdown)
  const pending = [
    ...(hIsLoser ? hPlayers.filter(p => !p.videoFilename).map(p => p.name.split(' ')[0]) : []),
    ...(aIsLoser ? aPlayers.filter(p => !p.videoFilename).map(p => p.name.split(' ')[0]) : []),
  ];
  const drinkers = pending.length > 0 ? pending.join(' & ') : null;

  const cardCls = [
    styles.card,
    isLive          ? styles.live     : '',
    isFinished      ? styles.finished : '',
    isFocus         ? styles.focus    : '',
    sideBetDrinks > 0 ? styles.sideBet : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardCls}>
      {label && <div className={styles.stageLabel}>{label}</div>}
      <div className={styles.cardRow}>

        <TeamAvatarGroup
          players={hPlayers} state={hAvatarState} isLive={isLive}
          allMatchVideos={allMatchVideos}
          onVideoOpen={(vids, name, idx) => onVideoOpen?.(vids, `${hTeam?.flag ?? ''} vs ${aTeam?.flag ?? ''}`, idx)}
        />

        <div className={styles.center}>
          <div className={styles.meta}>
            {isLive && (
              <div className={styles.livePill}>
                <span className={styles.liveDot} />
                {status === 'HT' ? 'HT' : elapsed != null ? `${elapsed}'` : 'LIVE'}
              </div>
            )}
            {isFinished && <span className={styles.ftPill}>FT</span>}
          </div>

          <div className={styles.vsRow}>
            <span className={styles.vsFlag}>{hTeam?.flag ?? '🏳️'}</span>
            {!isLive && !isFinished && <span className={styles.vs}>VS</span>}
            <span className={styles.vsFlag}>{aTeam?.flag ?? '🏳️'}</span>
          </div>

          {(isLive || isFinished) && hGoals != null ? (
            <div className={styles.scoreRow}>
              <span className={hState === 'winning' ? styles.scoreWin : styles.scoreNum}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : styles.scoreNum}>{aGoals}</span>
            </div>
          ) : kickoff ? (
            <>
              <div className={styles.kickoffDate}>{formatDate(kickoff)}</div>
              <div className={styles.kickoffTime}>{formatKickoff(kickoff)}</div>
            </>
          ) : (
            <div className={styles.kickoffTime}>TBD</div>
          )}

          {(hTeam || aTeam) && (
            <div className={styles.teamsRow}>
              <span className={styles.teamName}>{hTeam?.full ?? 'TBD'}</span>
              <span className={styles.teamName}>{aTeam?.full ?? 'TBD'}</span>
            </div>
          )}
        </div>

        <TeamAvatarGroup
          players={aPlayers} state={aAvatarState} isLive={isLive}
          allMatchVideos={allMatchVideos}
          onVideoOpen={(vids, name, idx) => onVideoOpen?.(vids, `${hTeam?.flag ?? ''} vs ${aTeam?.flag ?? ''}`, idx)}
        />

      </div>

      {/* Drink emoji + upload counter banner */}
      {(hasEmojis || showCounter) && (
        <div className={styles.drinkBanner}>
          <span className={styles.drinkSide}>{hEmojis || (hIsLoser ? '–' : '')}</span>
          {showCounter && (
            <span className={styles.uploadCounter}>
              {hIsLoser && `${hUploaded}/${hTotal}`}
              {hIsLoser && aIsLoser && ' · '}
              {aIsLoser && `${aUploaded}/${aTotal}`}
              {' '}✓
            </span>
          )}
          <span className={styles.drinkSide}>{aEmojis || (aIsLoser ? '–' : '')}</span>
        </div>
      )}

      {sideBetDrinks > 0 && (
        <div className={styles.sideBetBanner}>
          💰 SIDE BET · {sideBetDesc || `+${sideBetDrinks} extra drink${sideBetDrinks > 1 ? 's' : ''}`}
        </div>
      )}

      {drinkers && kickoff && (
        <VideoCountdown kickoff={kickoff} drinkers={drinkers} cardStyles={styles} />
      )}
    </div>
  );
}
