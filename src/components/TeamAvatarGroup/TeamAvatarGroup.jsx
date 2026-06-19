import styles from './TeamAvatarGroup.module.css';

function MiniAvatar({ player, isOriginal, state, size, onVideoClick }) {
  const isLoser  = state === 'losing' || state === 'draw';
  const isWinner = state === 'winning';
  const hasVideo = !!player.videoFilename;

  const cls = [
    styles.avatar,
    styles[`sz${size}`],
    isLoser  ? styles.loser  : '',
    isWinner ? styles.winner : '',
    isOriginal ? styles.original : '',
    isLoser && hasVideo ? styles.clickable : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} onClick={isLoser && hasVideo ? onVideoClick : undefined}>
      <div className={styles.photo}>
        {player.photo
          ? <img src={player.photo} alt={player.name} />
          : <span className={styles.initials} style={{ color: player.color }}>{player.initials}</span>
        }
        {isLoser && hasVideo && (
          <div className={styles.playOverlay}>
            <span className={styles.playBtn}>▶</span>
          </div>
        )}
        {isLoser && !hasVideo && (
          <span className={styles.beer}>🍺</span>
        )}
      </div>
      <div className={styles.name} style={{ background: player.color }}>
        {player.name.split(' ')[0]}
      </div>
    </div>
  );
}

export default function TeamAvatarGroup({ players = [], state = 'neutral', isLive = false, onVideoOpen }) {
  const count = players.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const size = count <= 1 ? 'L' : count <= 4 ? 'M' : count <= 9 ? 'S' : 'XS';
  const isShaking = isLive && state === 'losing';

  if (count === 0) {
    return (
      <div className={styles.group}>
        <div className={styles.tbd}>TBD</div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.group} ${isShaking ? styles.shake : ''}`}
      style={{ '--cols': cols }}
    >
      {players.map((p, i) => (
        <MiniAvatar
          key={p.name}
          player={p}
          isOriginal={i === 0}
          state={state}
          size={size}
          onVideoClick={() => onVideoOpen?.([p.videoFilename], p.name)}
        />
      ))}
    </div>
  );
}
