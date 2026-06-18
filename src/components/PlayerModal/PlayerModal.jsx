import { useState, useEffect } from 'react';
import styles from './PlayerModal.module.css';
import { TEAM_MAP } from '../../data/teamMap';
import VideoModal from '../VideoModal/VideoModal';

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function PlayerModal({ player, onClose }) {
  const [playVideo, setPlayVideo] = useState(null);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const videos = player.matches.filter(m => m.myVideo);

  if (playVideo) {
    return <VideoModal filenames={playVideo.filenames} title={playVideo.title} onClose={() => setPlayVideo(null)} />;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.sheet} onClick={e => e.stopPropagation()}>

        <button className={styles.backBtn} onClick={onClose}>← Back</button>

        {/* Avatar */}
        <div className={styles.avatarWrap}>
          {player.photo
            ? <img src={player.photo} alt={player.name} className={styles.avatar} style={{ borderColor: player.color }} />
            : <div className={styles.avatarInitials} style={{ background: player.color }}>{player.initials}</div>
          }
          <div className={styles.avatarGlow} style={{ background: player.color }} />
        </div>

        <h2 className={styles.name}>{player.name}</h2>

        {/* Teams */}
        <div className={styles.teams}>
          {player.teams.map(code => {
            const t = TEAM_MAP[code] ?? { flag: '🏳️', full: code };
            return (
              <div key={code} className={styles.teamChip}>
                <span className={styles.teamFlag}>{t.flag}</span>
                <span className={styles.teamName}>{t.full}</span>
              </div>
            );
          })}
        </div>

        {/* Note */}
        {player.note && (
          <div className={styles.note}>{player.note}</div>
        )}

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.stat}>
            <span className={styles.statVal + ' ' + styles.win}>{player.wins}</span>
            <span className={styles.statLabel}>Wins</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal + ' ' + styles.loss}>{player.losses}</span>
            <span className={styles.statLabel}>Losses</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal + ' ' + styles.draw}>{player.draws}</span>
            <span className={styles.statLabel}>Draws</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal + ' ' + styles.drink}>{player.drinks}</span>
            <span className={styles.statLabel}>🍺 Drinks</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statVal + ' ' + styles.done}>{player.drinksDone}</span>
            <span className={styles.statLabel}>✅ Done</span>
          </div>
        </div>

        {/* Match history */}
        <h3 className={styles.section}>Match History</h3>
        <div className={styles.matchList}>
          {player.matches.length === 0 && (
            <p className={styles.empty}>No matches yet</p>
          )}
          {player.matches.map(m => {
            const opp = TEAM_MAP[m.oppCode] ?? { flag: '🏳️', full: m.oppCode };
            const my  = TEAM_MAP[m.teamCode] ?? { flag: '🏳️', full: m.teamCode };
            const resultLabel = !m.isFinished ? (m.isLive ? 'LIVE' : '')
              : m.myState === 'winning' ? 'W' : m.myState === 'losing' ? 'L' : 'D';
            const resultClass = !m.isFinished ? styles.upcoming
              : m.myState === 'winning' ? styles.win : m.myState === 'losing' ? styles.loss : styles.draw;

            return (
              <div key={m.id} className={styles.matchRow}>
                <span className={`${styles.resultBadge} ${resultClass}`}>{resultLabel}</span>
                <div className={styles.matchTeams}>
                  <span>{my.flag} {m.teamCode}</span>
                  <span className={styles.matchScore}>
                    {m.isFinished ? `${m.myGoals} – ${m.oppGoals}` : formatDate(m.kickoff)}
                  </span>
                  <span>{m.oppCode} {opp.flag}</span>
                </div>
                <button
                  className={styles.videoBtn}
                  style={m.myVideo ? {} : { visibility: 'hidden' }}
                  onClick={() => m.myVideo && setPlayVideo({ filenames: [m.myVideo, ...(m.myVideo2 ? [m.myVideo2] : [])], title: `${my.flag} vs ${opp.flag}` })}
                >▶{m.myVideo2 ? <span className={styles.videoBtnCount}>×2</span> : null}</button>
              </div>
            );
          })}
        </div>

        {/* Videos */}
        {videos.length > 0 && (
          <>
            <h3 className={styles.section}>Punishment Videos ({videos.reduce((n, m) => n + 1 + (m.myVideo2 ? 1 : 0), 0)})</h3>
            <div className={styles.videoGrid}>
              {videos.flatMap(m => {
                const opp = TEAM_MAP[m.oppCode] ?? { flag: '🏳️', full: m.oppCode };
                const my  = TEAM_MAP[m.teamCode] ?? { flag: '🏳️', full: m.teamCode };
                const label = `${my.flag} vs ${opp.flag}`;
                const cards = [
                  <button
                    key={m.id}
                    className={styles.videoCard}
                    onClick={() => setPlayVideo({ filenames: [m.myVideo], title: label })}
                  >
                    <video className={styles.videoThumb} src={m.videoUrl} preload="metadata" muted playsInline />
                    <div className={styles.videoOverlay}>
                      <span className={styles.videoPlay}>▶</span>
                      <span className={styles.videoLabel}>{label}</span>
                    </div>
                  </button>
                ];
                if (m.myVideo2) {
                  cards.push(
                    <button
                      key={m.id + '_2'}
                      className={styles.videoCard}
                      onClick={() => setPlayVideo({ filenames: [m.myVideo2], title: label + ' #2' })}
                    >
                      <video className={styles.videoThumb} src={m.videoUrl2} preload="metadata" muted playsInline />
                      <div className={styles.videoOverlay}>
                        <span className={styles.videoPlay}>▶</span>
                        <span className={styles.videoLabel}>{label} #2</span>
                      </div>
                    </button>
                  );
                }
                return cards;
              })}
            </div>
          </>
        )}

        <div className={styles.bottomPad} />
      </div>
    </div>
  );
}
