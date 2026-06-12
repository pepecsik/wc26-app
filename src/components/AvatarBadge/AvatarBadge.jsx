import styles from './AvatarBadge.module.css';

export default function AvatarBadge({ participant, teamCode, teamFlag, state, matchState, hasVideo, onVideoClick }) {
  if (!participant) {
    return (
      <div className={styles.wrap}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar} style={{ background: '#555' }}>?</div>
          <div className={styles.nameBar}><span className={styles.nameBarText}>{teamFlag} {teamCode}</span></div>
        </div>
      </div>
    );
  }

  const isLive     = matchState === 'live';
  const isFinished = matchState === 'finished';
  const isLoser    = isFinished && (state === 'losing' || state === 'draw');
  const isWinner   = isFinished && state === 'winning';
  const isShaking  = isLive && state === 'losing';

  const avatarClasses = [
    styles.avatar,
    isShaking ? styles.shake  : '',
    isWinner  ? styles.winner : '',
    isLoser   ? styles.loser  : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrap}>
      <div className={styles.avatarWrap}>
        {isWinner && <span className={styles.crown}>👑</span>}

        <div
          className={avatarClasses}
          style={{ background: participant.color }}
          onClick={isLoser && hasVideo ? onVideoClick : undefined}
          role={isLoser && hasVideo ? 'button' : undefined}
        >
          {participant.photo
            ? <img src={participant.photo} alt={participant.name} className={styles.photo} />
            : <span className={styles.initials}>{participant.initials}</span>
          }
        </div>

        {isLoser && <span className={styles.beer}>🍺</span>}
        {isLoser && hasVideo && (
          <button className={styles.videoBadge} onClick={onVideoClick}>🎬</button>
        )}

        <div className={styles.nameBar}>
          <span className={styles.nameBarText}>{participant.name}</span>
        </div>
      </div>
    </div>
  );
}
