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
    ...hPlayers.filter(p => p.videoFilename).flatMap(p => [p.videoFilename, p.videoFilename2].filter(Boolean)),
    ...aPlayers.filter(p => p.videoFilename).flatMap(p => [p.videoFilename, p.videoFilename2].filter(Boolean)),
  ];

  function emojiForDrinks(emoji, drinks) {
    const cnt = Math.max(1, Math.floor(drinks || 1));
    const arr = [...emoji];
    if (arr.length >= cnt) return emoji;
    const pad = arr[arr.length - 1] || '🍺';
    while (arr.length < cnt) arr.push(pad);
    return arr.join('');
  }

  // Drink emoji banner
  const hEmojis = hPlayers.filter(p => p.videoFilename && p.drinkEmoji).map(p => emojiForDrinks(p.drinkEmoji, p.drinks)).join('');
  const aEmojis = aPlayers.filter(p => p.videoFilename && p.drinkEmoji).map(p => emojiForDrinks(p.drinkEmoji, p.drinks)).join('');
  const hasEmojis = hEmojis || aEmojis;

  // Upload + drink counter per side (loser/draw only)
  const hIsLoser = hAvatarState === 'losing' || hAvatarState === 'draw';
  const aIsLoser = aAvatarState === 'losing' || aAvatarState === 'draw';
  const hUploaded = hPlayers.filter(p => p.videoFilename).length;
  const hTotal    = hPlayers.length;
  const aUploaded = aPlayers.filter(p => p.videoFilename).length;
  const aTotal    = aPlayers.length;

  const hDrinkTotal = hIsLoser
    ? hPlayers.reduce((sum, p) => sum + (p.videoFilename && p.drinks ? p.drinks : 0), 0)
    : 0;
  const aDrinkTotal = aIsLoser
    ? aPlayers.reduce((sum, p) => sum + (p.videoFilename && p.drinks ? p.drinks : 0), 0)
    : 0;

  const hCounter = isFinished && hIsLoser ? { uploaded: hUploaded, total: hTotal, drinkTotal: hDrinkTotal } : null;
  const aCounter = isFinished && aIsLoser ? { uploaded: aUploaded, total: aTotal, drinkTotal: aDrinkTotal } : null;

  // Who still needs to upload (only relevant once game is finished)
  const pending = isFinished ? [
    ...(hIsLoser ? hPlayers.filter(p => !p.videoFilename).map(p => p.name.split(' ')[0]) : []),
    ...(aIsLoser ? aPlayers.filter(p => !p.videoFilename).map(p => p.name.split(' ')[0]) : []),
  ] : [];
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
          allMatchVideos={allMatchVideos} counter={hCounter}
          onVideoOpen={(vids, name, idx) => onVideoOpen?.(vids, `${hTeam?.flag ?? ''} vs ${aTeam?.flag ?? ''}`, idx)}
        />

        <div className={styles.center}>
          <div className={styles.meta}>
            {kickoff && <span className={styles.kickoffDate}>{formatDate(kickoff)}</span>}
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
            <div className={styles.kickoffTime}>{formatKickoff(kickoff)}</div>
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
          allMatchVideos={allMatchVideos} counter={aCounter}
          onVideoOpen={(vids, name, idx) => onVideoOpen?.(vids, `${hTeam?.flag ?? ''} vs ${aTeam?.flag ?? ''}`, idx)}
        />

      </div>

      {/* Drink emoji banner */}
      {hasEmojis && (
        <div className={styles.drinkBanner}>
          <span className={styles.drinkSide}>{hEmojis || '–'}</span>
          <span className={styles.drinkDivider}>🍻</span>
          <span className={styles.drinkSide}>{aEmojis || '–'}</span>
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
