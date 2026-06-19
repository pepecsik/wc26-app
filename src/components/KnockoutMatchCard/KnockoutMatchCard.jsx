import styles from './KnockoutMatchCard.module.css';
import TeamAvatarGroup from '../TeamAvatarGroup/TeamAvatarGroup';
import { TEAM_MAP } from '../../data/teamMap';

export default function KnockoutMatchCard({ match }) {
  const {
    hCode, aCode, hGoals, aGoals, hState, aState,
    isLive, isFinished, kickoff, status, elapsed,
    hPlayers = [], aPlayers = [],
    label,
  } = match;

  const hTeam = hCode ? (TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️' }) : null;
  const aTeam = aCode ? (TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️' }) : null;

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';

  function stateFor(side) {
    if (matchState !== 'finished') return 'neutral';
    return side === 'h' ? hState : aState;
  }

  function formatTime(d) {
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(d) {
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  const cardCls = [
    styles.card,
    isLive     ? styles.live     : '',
    isFinished ? styles.finished : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardCls}>
      {label && <div className={styles.stageLabel}>{label}</div>}
      <div className={styles.row}>

        <TeamAvatarGroup players={hPlayers} state={stateFor('h')} />

        <div className={styles.center}>
          <div className={styles.meta}>
            {hTeam && aTeam
              ? <><span className={styles.flag}>{hTeam.flag}</span>
                  <span className={styles.vs}>{isLive || isFinished ? '–' : 'VS'}</span>
                  <span className={styles.flag}>{aTeam.flag}</span></>
              : <span className={styles.vs}>VS</span>
            }
          </div>

          {(isLive || isFinished) && hTeam && aTeam ? (
            <div className={styles.score}>
              <span className={hState === 'winning' ? styles.scoreWin : styles.scoreNum}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : styles.scoreNum}>{aGoals}</span>
            </div>
          ) : kickoff ? (
            <div className={styles.kickoff}>
              <div className={styles.kickoffDate}>{formatDate(kickoff)}</div>
              <div className={styles.kickoffTime}>{formatTime(kickoff)}</div>
            </div>
          ) : (
            <div className={styles.kickoff}><div className={styles.kickoffTime}>TBD</div></div>
          )}

          {isLive && (
            <div className={styles.livePill}>
              <span className={styles.liveDot} />
              {status === 'HT' ? 'HT' : elapsed != null ? `${elapsed}'` : 'LIVE'}
            </div>
          )}

          {hTeam && <div className={styles.teamNames}>
            <span>{hTeam.full}</span>
            <span>{aTeam?.full}</span>
          </div>}
        </div>

        <TeamAvatarGroup players={aPlayers} state={stateFor('a')} />

      </div>
    </div>
  );
}
