import { useState, useEffect } from 'react';

const DEADLINE_MS = 26 * 60 * 60 * 1000;
const ALARM_MS    = 3 * 60 * 60 * 1000;

// cardStyles: the CSS module from the parent card (MatchCard or KnockoutMatchCard)
// so the countdown bar inherits the same look
export default function VideoCountdown({ kickoff, drinkers, cardStyles }) {
  const deadline = kickoff.getTime() + DEADLINE_MS;
  const [remaining, setRemaining] = useState(deadline - Date.now());
  const isAlarm = remaining > 0 && remaining <= ALARM_MS;

  useEffect(() => {
    const now = deadline - Date.now();
    const tick = now <= ALARM_MS ? 1_000 : 60_000;
    const t = setInterval(() => setRemaining(deadline - Date.now()), tick);
    return () => clearInterval(t);
  }, [deadline, isAlarm]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = cardStyles;

  if (remaining <= 0) {
    return (
      <div className={`${s.countdown} ${s.countdownOverdue}`}>
        <span className={s.alarmLabel}>⚠️ OVERDUE</span>
        <span className={s.alarmName}>{drinkers}</span>
      </div>
    );
  }

  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const sec = Math.floor((remaining % 60_000) / 1_000);

  if (isAlarm) {
    const timeStr = h > 0 ? `${h}h ${m}m ${sec}s` : `${m}m ${sec}s`;
    return (
      <div className={`${s.countdown} ${s.countdownAlarm}`}>
        <span className={s.alarmLabel}>🚨 {timeStr}</span>
        <span className={s.alarmName}>{drinkers} — SEND A VIDEO NOW</span>
      </div>
    );
  }

  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return (
    <div className={s.countdown}>
      🎬 {drinkers} • {timeStr} left to send a video
    </div>
  );
}
