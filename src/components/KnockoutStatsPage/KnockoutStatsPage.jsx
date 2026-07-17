import styles from './KnockoutStatsPage.module.css';
import { PARTICIPANTS } from '../../data/participants';
import { TEAM_MAP } from '../../data/teamMap';

const KO_SET = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);

function TeamCard({ code, dimmed, ownerMap }) {
  const team = TEAM_MAP[code];
  const ogOwners = PARTICIPANTS.filter(p => p.teams.includes(code));
  const redrawnOwners = (ownerMap[code] || []).filter(
    o => !ogOwners.some(p => p.name === o.name)
  );

  return (
    <div className={`${styles.drawTeamCard} ${dimmed ? styles.drawTeamCardDimmed : styles.drawTeamCardAlive}`}>
      <div className={styles.drawHeader}>
        <span className={styles.drawFlag}>{team?.flag ?? '🏳️'}</span>
        <span className={styles.drawTeamName}>{team?.full ?? code}</span>
        {redrawnOwners.length > 0 && (
          <span className={styles.drawCount}>+{redrawnOwners.length}</span>
        )}
      </div>
      <div className={styles.drawPlayers}>
        {ogOwners.map(p => (
          <div key={p.name} className={`${styles.drawPlayer} ${styles.drawPlayerOG}`}>
            {p.photo
              ? <img src={p.photo} alt={p.name} className={styles.drawAvatar} />
              : <div className={styles.drawAvatarInit} style={{ background: p.color }}>{p.initials}</div>
            }
            <span className={styles.drawName}>{p.name}</span>
            <span className={styles.drawOGBadge}>OG</span>
          </div>
        ))}
        {redrawnOwners.map(o => (
          <div key={o.name} className={styles.drawPlayer}>
            {o.photo
              ? <img src={o.photo} alt={o.name} className={styles.drawAvatar} />
              : <div className={styles.drawAvatarInit} style={{ background: o.color }}>{o.initials}</div>
            }
            <span className={styles.drawName}>{o.name}</span>
            <span className={styles.drawSince}>↩ redraw</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DrawBoard({ matches, ownerMap }) {
  const koMatches = matches.filter(m => KO_SET.has(m.round));
  const koTeamCodes = new Set(koMatches.flatMap(m => [m.hCode, m.aCode]).filter(Boolean));
  const eliminatedInKO = new Set();
  koMatches.filter(m => m.isFinished).forEach(m => {
    if (m.hState === 'losing') eliminatedInKO.add(m.hCode);
    if (m.aState === 'losing') eliminatedInKO.add(m.aCode);
  });
  const aliveCodes = new Set([...koTeamCodes].filter(c => !eliminatedInKO.has(c)));
  const hasKO = koTeamCodes.size > 0;

  const allCodes = Object.keys(TEAM_MAP);

  function ownerCount(code) {
    const og = PARTICIPANTS.filter(p => p.teams.includes(code)).length;
    const extra = (ownerMap[code] || []).filter(
      o => !PARTICIPANTS.some(p => p.teams.includes(code) && p.name === o.name)
    ).length;
    return og + extra;
  }

  const sortCodes = codes => [...codes].sort((a, b) => {
    const diff = ownerCount(b) - ownerCount(a);
    return diff !== 0 ? diff : (TEAM_MAP[a]?.full || a).localeCompare(TEAM_MAP[b]?.full || b);
  });

  const aliveSectionCodes     = sortCodes(hasKO ? allCodes.filter(c => aliveCodes.has(c)) : allCodes);
  const eliminatedSectionCodes = hasKO ? sortCodes(allCodes.filter(c => !aliveCodes.has(c))) : [];

  return (
    <div className={styles.drawBoardWrap}>
      {hasKO && (
        <div className={styles.drawSectionHeader}>
          Still in the tournament · {aliveCodes.size} teams
        </div>
      )}
      <div className={styles.drawBoard}>
        {aliveSectionCodes.map(code => (
          <TeamCard key={code} code={code} dimmed={false} ownerMap={ownerMap} />
        ))}
      </div>

      {eliminatedSectionCodes.length > 0 && (
        <>
          <div className={styles.drawSectionDivider}>
            <div className={styles.drawSectionLine} />
            <span className={styles.drawSectionLabel}>Knocked Out</span>
            <div className={styles.drawSectionLine} />
          </div>
          <div className={styles.drawBoard}>
            {eliminatedSectionCodes.map(code => (
              <TeamCard key={code} code={code} dimmed={true} ownerMap={ownerMap} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function KnockoutStatsPage({ matches = [], ownerMap = {} }) {
  return (
    <div className={styles.page}>
      <DrawBoard matches={matches} ownerMap={ownerMap} />
    </div>
  );
}
