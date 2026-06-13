import styles from './AvatarBadge.module.css';

export default function AvatarBadge({ participant, teamCode, teamFlag, state, matchState, isFocus, hasVideo, onVideoClick }) {
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
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapClasses}
      onClick={isLoser && hasVideo ? onVideoClick : undefined}
      role={isLoser && hasVideo ? 'button' : undefined}
    >
      {isWinner && <span className={styles.crown}>👑</span>}

      <div className={styles.photoArea}>
        {participant?.photo
          ? <img src={participant.photo} alt={name} className={styles.photo} />
          : <span className={styles.initials} style={{ color }}>{initials}</span>
        }
      </div>

      {isLoser && <span className={styles.beer}>🍺</span>}
      {isLoser && hasVideo && (
        <button className={styles.videoBadge} onClick={e => { e.stopPropagation(); onVideoClick(); }}>🎬</button>
      )}

      <div className={styles.chin} style={{ background: color }}>
        <span className={styles.chinName}>{name}</span>
      </div>
    </div>
  );
}
