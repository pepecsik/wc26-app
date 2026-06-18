import styles from './AvatarBadge.module.css';

export default function AvatarBadge({
  participant, teamCode, teamFlag, state, matchState, isFocus,
  hasVideo, hasVideo2, onVideoClick,
  drinkEmoji, sideBetDrinks, sideBetEmoji,
}) {
  const isLive     = matchState === 'live';
  const isFinished = matchState === 'finished';
  const isLoser    = isFinished && (state === 'losing' || state === 'draw');
  const isWinner   = isFinished && state === 'winning';
  const isShaking  = isLive && state === 'losing';
  const isDraw     = isFinished && state === 'draw';

  const name = participant?.name ?? teamCode;
  const color = participant?.color ?? '#555';
  const initials = participant?.initials ?? '?';

  const wrapClasses = [
    styles.wrap,
    isShaking ? styles.shake : '',
    isWinner  && isFocus ? styles.winner  : isWinner  ? styles.winnerStill  : '',
    isLoser && !isDraw && isFocus ? styles.loser : isLoser && !isDraw ? styles.loserStill : '',
    isDraw    && isFocus ? styles.draw    : isDraw    ? styles.drawStill    : '',
    !isFinished && !isLive ? styles.upcoming : '',
    isLoser && hasVideo ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  // Build the animated waiting emojis (shown when no video yet)
  const waitingEmojis = (() => {
    if (!sideBetEmoji && (!sideBetDrinks || sideBetDrinks === 0)) return ['🍺'];
    if (sideBetEmoji && sideBetEmoji.length > 0) {
      // Split emoji string into individual emojis
      return [...sideBetEmoji];
    }
    return ['🍺'];
  })();
  const hasHalf = sideBetDrinks % 1 === 0.5;

  // Build drink emoji display (shown when video uploaded)
  const uploadedEmojis = drinkEmoji ? [...drinkEmoji] : [];

  return (
    <div
      className={wrapClasses}
      onClick={isLoser && hasVideo ? onVideoClick : undefined}
      role={isLoser && hasVideo ? 'button' : undefined}
    >
      {isWinner && <span className={styles.crown}>👑</span>}

      <div className={styles.inner}>
      <div className={styles.photoArea}>
        {participant?.photo
          ? <img src={participant.photo} alt={name} className={styles.photo} />
          : <span className={styles.initials} style={{ color }}>{initials}</span>
        }
        {/* Play button overlay when video uploaded */}
        {isLoser && hasVideo && (
          <div className={styles.playOverlay}>
            <span className={styles.playBtn}>▶</span>
            {hasVideo2 && <span className={styles.video2Badge}>×2</span>}
          </div>
        )}
      </div>

      {isShaking && <span className={styles.sweat}>😰</span>}

      {/* Waiting: animated emojis */}
      {isLoser && !hasVideo && (
        <div className={styles.beerWrap}>
          {waitingEmojis.map((e, i) => (
            <span key={i} className={styles.beer} style={{ animationDelay: `${i * 0.18}s` }}>{e}</span>
          ))}
          {hasHalf && <span className={styles.halfLabel}>+½</span>}
        </div>
      )}

      {/* Uploaded: small drink emojis bottom-right */}
      {isLoser && hasVideo && uploadedEmojis.length > 0 && (
        <div className={styles.drinkCorner}>
          {uploadedEmojis.map((e, i) => <span key={i}>{e}</span>)}
          {hasHalf && <span className={styles.halfSmall}>+½</span>}
        </div>
      )}

      <div className={styles.chin} style={{ background: color }}>
        <span className={styles.chinName}>{name}</span>
      </div>
      </div>
    </div>
  );
}
