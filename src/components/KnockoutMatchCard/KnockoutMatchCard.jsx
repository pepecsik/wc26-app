import styles from './KnockoutMatchCard.module.css';
import TeamAvatarGroup from '../TeamAvatarGroup/TeamAvatarGroup';
import { TEAM_MAP } from '../../data/teamMap';

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function KnockoutMatchCard({ match }) {
  const {
    hCode, aCode, hGoals, aGoals, hState, aState,
    isLive, isFinished, kickoff, status, elapsed,
    hPlayers = [], aPlayers = [],
    label,
  } = match;

  const hTeam = hCode ? (TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️' }) : null;
  const aTeam = aCode ? (TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️' }) : null;

  const cardCls = [
    styles.card,
    isLive     ? styles.live     : '',
    isFinished ? styles.finished : '',
  ].filter(Boolean).join(' ');

  const hAvatarState = isFinished ? hState : 'neutral';
  const aAvatarState = isFinished ? aState : 'neutral';

  return (
    <div className={cardCls}>
      {label && <div className={styles.stageLabel}>{label}</div>}
      <div className={styles.cardRow}>

        <TeamAvatarGroup players={hPlayers} state={hAvatarState} />

        <div className={styles.center}>
          <div className={styles.meta}>
            {isLive && (
              <div className={styles.livePill}>
                <span className={styles.liveDot} />
                {status === 'HT' ? 'HT' : elapsed != null ? `${elapsed}'` : 'LIVE'}
              </div>
            )}
            {isFinished && <span className={styles.ftPill}>FT</span>}
          </div>

          <div className={styles.vsRow}>
            <span className={styles.vsFlag}>{hTeam?.flag ?? '🏳️'}</span>
            <span className={styles.vs}>{hTeam && aTeam ? '' : 'VS'}</span>
            <span className={styles.vsFlag}>{aTeam?.flag ?? '🏳️'}</span>
          </div>

          {(isLive || isFinished) && hGoals != null ? (
            <div className={styles.scoreRow}>
              <span className={hState === 'winning' ? styles.scoreWin : styles.scoreNum}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : styles.scoreNum}>{aGoals}</span>
            </div>
          ) : kickoff ? (
            <>
              <div className={styles.kickoffDate}>{formatDate(kickoff)}</div>
              <div className={styles.kickoffTime}>{formatKickoff(kickoff)}</div>
            </>
          ) : (
            <div className={styles.kickoffTime}>TBD</div>
          )}

          {(hTeam || aTeam) && (
            <div className={styles.teamsRow}>
              <span className={styles.teamName}>{hTeam?.full ?? 'TBD'}</span>
              <span className={styles.teamName}>{aTeam?.full ?? 'TBD'}</span>
            </div>
          )}
        </div>

        <TeamAvatarGroup players={aPlayers} state={aAvatarState} />

      </div>
    </div>
  );
}
