import styles from './KnockoutStatsPage.module.css';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';

const KO_SET = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);

function buildDrawData(matches, ownerMap) {
  const koFinished = matches.filter(m => KO_SET.has(m.round) && m.isFinished);

  // Teams eliminated in a KO match
  const eliminated = {};
  koFinished.forEach(m => {
    if (m.hState === 'losing') eliminated[m.hCode] = true;
    if (m.aState === 'losing') eliminated[m.aCode] = true;
  });

  const isAlive = code => code && !eliminated[code];

  return PARTICIPANTS.map(p => {
    const origCodes    = p.teams || [];
    const redrawnCodes = Object.entries(ownerMap)
      .filter(([, owners]) => owners.some(o => o.name === p.name))
      .map(([code]) => code);

    const allTeams = [
      ...origCodes.map(c => ({ code: c, type: 'o' })),
      ...redrawnCodes.map(c => ({ code: c, type: 'r' })),
    ];

    const aliveTeams = allTeams.filter(t => isAlive(t.code));
    const activeTeam = aliveTeams[0] || allTeams[allTeams.length - 1] || { code: null, type: 'o' };

    return {
      ...p,
      history:         allTeams,
      activeTeam,
      activeTeamCode:  activeTeam.code,
      isAlive:         aliveTeams.length > 0,
      isRedrawn:       redrawnCodes.length > 0,
    };
  });
}

function DrawBoard({ players }) {
  const alive      = players.filter(p => p.isAlive);
  const teamCodes  = [...new Set(alive.map(p => p.activeTeam?.code).filter(Boolean))];

  if (teamCodes.length === 0) {
    return <div className={styles.comingSoon}>Redraws not yet finalised</div>;
  }

  const byTeam = {};
  teamCodes.forEach(code => {
    byTeam[code] = alive
      .filter(p => p.activeTeam?.code === code)
      .sort((a, b) => (a.activeTeam.type === 'o') === (b.activeTeam.type === 'o') ? 0 : a.activeTeam.type === 'o' ? -1 : 1);
  });
  const sortedCodes = [...teamCodes].sort((a, b) => byTeam[b].length - byTeam[a].length);

  return (
    <div className={styles.drawBoard}>
      {sortedCodes.map(code => {
        const team        = TEAM_MAP[code];
        const teamPlayers = byTeam[code];
        return (
          <div key={code} className={styles.drawTeamCard}>
            <div className={styles.drawHeader}>
              <span className={styles.drawFlag}>{team?.flag}</span>
              <span className={styles.drawTeamName}>{team?.full ?? code}</span>
              <span className={styles.drawCount}>{teamPlayers.length} {teamPlayers.length === 1 ? 'player' : 'players'}</span>
            </div>
            <div className={styles.drawPlayers}>
              {teamPlayers.map(p => {
                const isOG      = p.activeTeam.type === 'o';
                const teamIdx   = p.history.findIndex(t => t.code === p.activeTeam.code);
                const drawnFrom = !isOG && teamIdx > 0 ? p.history[teamIdx - 1]?.out : null;
                return (
                  <div key={p.name} className={`${styles.drawPlayer} ${isOG ? styles.drawPlayerOG : ''}`}>
                    {p.photo
                      ? <img src={p.photo} alt={p.name} className={styles.drawAvatar} />
                      : <div className={styles.drawAvatarInit} style={{ background: p.color }}>{p.initials}</div>
                    }
                    <span className={styles.drawName}>{p.name}</span>
                    {isOG
                      ? <span className={styles.drawOGBadge}>OG</span>
                      : drawnFrom && <span className={styles.drawSince}>since {drawnFrom}</span>
                    }
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function KnockoutStatsPage({ matches = [], ownerMap = {} }) {
  const players = buildDrawData(matches, ownerMap);
  return (
    <div className={styles.page}>
      <DrawBoard players={players} />
    </div>
  );
}
