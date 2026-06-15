import { useEffect, useRef } from 'react';
import styles from './WallOfShame.module.css';
import { TEAM_MAP } from '../../data/teamMap';

const B2_BASE = 'https://f005.backblazeb2.com/file/wc26-videos/01_GROUP_STAGE';

function ShameVideo({ match, participant, teamCode, filename, drinkCount, isActive, index, total, onEnded }) {
  const videoRef = useRef(null);
  const team  = TEAM_MAP[teamCode] ?? { flag: '🏳️', full: teamCode };
  const hTeam = TEAM_MAP[match.hCode] ?? { flag: '🏳️', full: match.hCode };
  const aTeam = TEAM_MAP[match.aCode] ?? { flag: '🏳️', full: match.aCode };
  const videoUrl = `${B2_BASE}/${encodeURIComponent(filename)}.mp4`;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }, [isActive]);

  return (
    <div className={styles.slide}>
      <video
        ref={videoRef}
        src={videoUrl}
        className={styles.video}
        playsInline
        muted={false}
        onEnded={index < total - 1 ? onEnded : undefined}
        onClick={e => e.currentTarget.paused ? e.currentTarget.play() : e.currentTarget.pause()}
      />

      {/* Side dots */}
      <div className={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`${styles.dot} ${i === index ? styles.dotActive : ''}`} />
        ))}
      </div>

      <div className={styles.overlay}>
        <div className={styles.matchBadge}>
          {hTeam.flag} {match.hCode} {match.hGoals}–{match.aGoals} {match.aCode} {aTeam.flag}
        </div>

        <div className={styles.playerStrip}>
          <div className={styles.avatar} style={{ borderColor: participant?.color ?? '#555' }}>
            {participant?.photo
              ? <img src={participant.photo} alt={participant.name} className={styles.avatarImg} />
              : <span className={styles.avatarInitials} style={{ color: participant?.color ?? '#aaa' }}>
                  {participant?.initials ?? '?'}
                </span>
            }
          </div>
          <div className={styles.playerInfo}>
            <span className={styles.playerName}>{participant?.name ?? teamCode}</span>
            <span className={styles.teamName}>{team.flag} {team.full} · {match.kickoff.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
          <div className={styles.drinkPill}>
            {'🍺'.repeat(Math.min(drinkCount, 5))}{drinkCount > 5 ? ` ×${drinkCount}` : ''}
          </div>
        </div>

        {index < total - 1 && (
          <div className={styles.scrollHint}>↓</div>
        )}
      </div>
    </div>
  );
}

export default function WallOfShame({ matches, videoMap }) {
  const containerRef = useRef(null);
  const activeRef = useRef(0);

  function scrollToNext() {
    const container = containerRef.current;
    if (!container) return;
    const slides = container.querySelectorAll('[data-slide]');
    const next = slides[activeRef.current + 1];
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  }

  const entries = [];
  matches
    .filter(m => m.isFinished)
    .sort((a, b) => b.kickoff - a.kickoff)
    .forEach(m => {
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      if (!vi?.filename) return;
      const isDraw = m.hState === 'draw';
      if (isDraw) {
        if (vi.drinks1 != null) entries.push({ match: m, participant: m.hOwner, teamCode: m.hCode, filename: vi.filename,  drinkCount: vi.drinks1 });
        if (vi.drinks2 != null) entries.push({ match: m, participant: m.aOwner, teamCode: m.aCode, filename: vi.filename2, drinkCount: vi.drinks2 });
      } else {
        const isHomeLoss = m.hState === 'losing';
        entries.push({ match: m, participant: isHomeLoss ? m.hOwner : m.aOwner, teamCode: isHomeLoss ? m.hCode : m.aCode, filename: vi.filename, drinkCount: vi.drinks1 ?? 1 });
      }
    });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const slides = container.querySelectorAll('[data-slide]');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = Number(entry.target.dataset.slide);
          activeRef.current = idx;
          slides.forEach((s, i) => {
            const v = s.querySelector('video');
            if (!v) return;
            if (i === idx) { v.play().catch(() => {}); }
            else { v.pause(); v.currentTime = 0; }
          });
        }
      });
    }, { threshold: 0.6 });

    slides.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [entries.length]);

  if (entries.length === 0) {
    return <div className={styles.empty}>No punishment videos yet 🍺</div>;
  }

  return (
    <div className={styles.feed} ref={containerRef}>
      {entries.map((e, i) => (
        <div key={i} data-slide={i} className={styles.slideWrapper}>
          <ShameVideo {...e} isActive={i === 0} index={i} total={entries.length} onEnded={scrollToNext} />
        </div>
      ))}
    </div>
  );
}
