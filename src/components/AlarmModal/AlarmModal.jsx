import { useState, useEffect } from 'react';
import styles from './AlarmModal.module.css';

const ALARM_WINDOW_MS = 3 * 60 * 60 * 1000;
const DEADLINE_OFFSET = 26 * 60 * 60 * 1000;
const TEST_MODE = new URLSearchParams(window.location.search).has('testAlarm');

function formatRemaining(ms) {
  if (ms <= 0) return 'OVERDUE';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}

export default function AlarmModal({ matches, videoMap, sheetLoaded }) {
  const [queue, setQueue] = useState(null); // null = not yet computed
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (matches.length === 0 || !sheetLoaded) return;
    const now = Date.now();
    const urgent = [];

    matches.forEach(m => {
      if (!m.isFinished) return;
      const deadline = m.kickoff.getTime() + DEADLINE_OFFSET;
      const left = deadline - now;
      const withinWindow = TEST_MODE ? true : (left > 0 && left <= ALARM_WINDOW_MS);
      if (!withinWindow) return;

      const key = `${m.hCode}-${m.aCode}`;
      const vi = videoMap[key];
      const isDraw = m.hState === 'draw';

      console.log('[AlarmModal] checking', key, { isDraw, hState: m.hState, aState: m.aState, vi, left: Math.round(left/60000) + 'm' });

      if ((isDraw || m.hState === 'losing') && !vi?.filename && m.hOwner) {
        urgent.push({ player: m.hOwner, deadline, left: TEST_MODE ? ALARM_WINDOW_MS : left });
      }
      if (isDraw && !vi?.filename2 && m.aOwner) {
        urgent.push({ player: m.aOwner, deadline, left: TEST_MODE ? ALARM_WINDOW_MS : left });
      }
      if (!isDraw && m.aState === 'losing' && !vi?.filename && m.aOwner) {
        urgent.push({ player: m.aOwner, deadline, left: TEST_MODE ? ALARM_WINDOW_MS : left });
      }
    });

    console.log('[AlarmModal] urgent:', urgent.map(u => u.player?.name));
    urgent.sort((a, b) => a.left - b.left);
    setQueue(urgent);
    if (urgent.length > 0) setRemaining(urgent[0].left);
  }, [matches, videoMap, sheetLoaded]);

  // tick countdown for current person
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
