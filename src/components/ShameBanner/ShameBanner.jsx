import { useState, useEffect } from 'react';
import styles from './ShameBanner.module.css';

export default function ShameBanner({ overdueQueue }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!overdueQueue || overdueQueue.length === 0) return;
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, [overdueQueue]);

  if (!overdueQueue || overdueQueue.length === 0) return null;

  const names = overdueQueue.map(e => e.player.name).join(' & ');
  const oldest = overdueQueue[0];
  const overdueSec = Math.floor((Date.now() - (oldest.deadline)) / 1000);
  const h = Math.floor(overdueSec / 3600);
  const m = Math.floor((overdueSec % 3600) / 60);
  const s = overdueSec % 60;
  const timeStr = h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>⚠️</span>
      <span className={styles.text}>
        <strong>{names}</strong> — overdue by {timeStr} — YOUR TIME IS UP!
      </span>
    </div>
  );
}
