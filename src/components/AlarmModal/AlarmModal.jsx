import { useState, useEffect } from 'react';
import styles from './AlarmModal.module.css';

function formatTime(ms) {
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3_600_000);
  const m = Math.floor((abs % 3_600_000) / 60_000);
  const s = Math.floor((abs % 60_000) / 1_000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

// queue: [{ player, left }] — computed externally by App.jsx
export default function AlarmModal({ queue }) {
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(null);

  // Set initial remaining when queue first arrives, tick only while not overdue
  useEffect(() => {
    if (!queue || queue.length === 0 || index >= queue.length) return;
    setRemaining(queue[index].left);
    const t = setInterval(() => setRemaining(r => {
      if (r === null || r <= 0) { clearInterval(t); return r; }
      return r - 1000;
    }), 1000);
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
        {isOverdue ? (
          <>
            <div className={`${styles.label} ${styles.overdueLine}`}>YOUR TIME IS UP!</div>
            <div className={styles.overdueMsg}>The punishment will be decided without you.</div>
          </>
        ) : (
          <>
            <div className={styles.label}>SEND A VIDEO NOW</div>
            <div className={`${styles.countdown}`}>{formatTime(remaining ?? 0)}</div>
          </>
        )}

        {total > 1 && (
          <div className={styles.counter}>{index + 1} / {total}</div>
        )}

        <div className={styles.hint}>tap anywhere to {index + 1 < total ? 'next' : 'dismiss'}</div>
      </div>
    </div>
  );
}
