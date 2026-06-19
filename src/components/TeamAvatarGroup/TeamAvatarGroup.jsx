import styles from './TeamAvatarGroup.module.css';

function MiniAvatar({ player, isOriginal, state, size }) {
  const hasVideo = false; // knockout video logic TBD
  const isLoser  = state === 'losing' || state === 'draw';
  const isWinner = state === 'winning';

  const cls = [
    styles.avatar,
    styles[`sz${size}`],
    isLoser  ? styles.loser  : '',
    isWinner ? styles.winner : '',
    isOriginal ? styles.original : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cls}>
      <div className={styles.photo}>
        {player.photo
          ? <img src={player.photo} alt={player.name} />
          : <span style={{ color: player.color }}>{player.initials}</span>
        }
        {isOriginal && <span className={styles.originalDot} title="Original owner" />}
      </div>
      <div className={styles.name} style={{ background: player.color }}>
        {player.name.split(' ')[0]}
      </div>
    </div>
  );
}

export default function TeamAvatarGroup({ players = [], state = 'neutral' }) {
  const count = players.length;
  // cols: 1 → 1, 2–4 → 2, 5–9 → 3, 10+ → 4
  const cols = count <= 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
  // size tier drives avatar pixel size via CSS
  const size = count <= 1 ? 'L' : count <= 4 ? 'M' : count <= 9 ? 'S' : 'XS';

  if (count === 0) {
    return (
      <div className={styles.group}>
        <div className={styles.tbd}>TBD</div>
      </div>
    );
  }

  return (
    <div className={styles.group} style={{ '--cols': cols }}>
      {players.map((p, i) => (
        <MiniAvatar
          key={p.name}
          player={p}
          isOriginal={i === 0}
          state={state}
          size={size}
        />
      ))}
    </div>
  );
}
