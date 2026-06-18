import { useState, useEffect } from 'react';
import styles from './AlarmModal.module.css';

function formatRemaining(ms) {
  if (ms <= 0) return 'NO TIME TO WASTE!';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

// queue: [{ player, left }] — computed externally by App.jsx
export default function AlarmModal({ queue }) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => queue?.[0]?.left ?? null);

  useEffect(() => {
    if (!queue || queue.length === 0 || index >= queue.length) return;
    const t = setInterval(() => setRemaining(r => (r !== null ? r - 1000 : null)), 1000);
    return () => clearInterval(t);
  }, [queue, index]);

  function dismiss() {
    const next = index + 1;
    setIndex(next);
    if (queue && next < queue.length) setRemaining(queue[next].left);
  }

  if (!queue || queue.length === 0 || index >= queue.length) return null;

  const current = queue[index];
  const p = current.player;
  const isOverdue = remaining !== null && remaining <= 0;
  const total = queue.length;

  return (
    <div className={styles.overlay} onClick={dismiss}>
      <div className={styles.modal}>
        <div className={styles.pulseRing} />

        {p.photo
          ? <img src={p.photo} alt={p.name} className={styles.face} />
          : <div className={styles.faceInitials} style={{ background: p.color }}>{p.initials}</div>
        }

        <div className={styles.name}>{p.name}</div>
        <div className={styles.label}>SEND A VIDEO NOW</div>
        <div className={`${styles.countdown} ${isOverdue ? styles.overdue : ''}`}>
          {formatRemaining(remaining ?? 0)}
        </div>

        {total > 1 && (
          <div className={styles.counter}>{index + 1} / {total}</div>
        )}

        <div className={styles.hint}>tap anywhere to {index + 1 < total ? 'next' : 'dismiss'}</div>
      </div>
    </div>
  );
}
