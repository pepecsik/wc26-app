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

// counter: { uploaded, total, drinkTotal } — shown below avatars on loser sides
export default function TeamAvatarGroup({ players = [], state = 'neutral', isLive = false, onVideoOpen, allMatchVideos = [], counter }) {
  const count = players.length;
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const size = count <= 1 ? 'L' : count <= 4 ? 'M' : count <= 9 ? 'S' : 'XS';
  const isShaking = isLive && state === 'losing';
  const isLoserSide = state === 'losing' || state === 'draw';
  const allDone = isLoserSide && count > 0 && players.every(p => !!p.videoFilename);

  if (count === 0) {
    return (
      <div className={styles.groupWrap}>
        <div className={styles.group}><div className={styles.tbd}>TBD</div></div>
      </div>
    );
  }

  return (
    <div className={`${styles.groupWrap} ${isShaking ? styles.shake : ''}`}>
      <div className={styles.group} style={{ '--cols': cols }}>
        {players.map((p, i) => {
          const startIdx = allMatchVideos.indexOf(p.videoFilename);
          return (
            <MiniAvatar
              key={p.name}
              player={p}
              isOriginal={i === 0}
              state={state}
              size={size}
              onVideoClick={() => onVideoOpen?.(allMatchVideos, p.name, startIdx >= 0 ? startIdx : 0)}
            />
          );
        })}
      </div>

      {/* ALL DONE — translucent green overlay with big ✓ */}
      {allDone && (
        <div className={styles.allDoneOverlay}>
          <span className={styles.allDoneCheck}>✓</span>
        </div>
      )}

      {/* Upload + drink counter below avatars */}
      {counter && (
        <div className={styles.counter}>
          <span className={styles.counterVideos}>{counter.uploaded}/{counter.total} ✓</span>
          {counter.drinkTotal > 0 && (
            <span className={styles.counterDrinks}>🍺 {counter.drinkTotal}</span>
          )}
        </div>
      )}
    </div>
  );
}
