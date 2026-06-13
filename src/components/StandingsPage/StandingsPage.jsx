import styles from './StandingsPage.module.css';
import { TEAM_MAP } from '../../data/teamMap';
import { TEAM_OWNER } from '../../data/participants';

function computeStandings(matches) {
  const groups = {};

  Object.entries(TEAM_MAP).forEach(([code, info]) => {
    if (!groups[info.group]) groups[info.group] = {};
    groups[info.group][code] = { code, flag: info.flag, full: info.full, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
  });

  matches.filter(m => m.isFinished && m.hGoals != null && m.aGoals != null).forEach(m => {
    const g = TEAM_MAP[m.hCode]?.group;
    const h = groups[g]?.[m.hCode];
    const a = groups[g]?.[m.aCode];
    if (!h || !a) return;

    h.p++; a.p++;
    h.gf += m.hGoals; h.ga += m.aGoals;
    a.gf += m.aGoals; a.ga += m.hGoals;

    if (m.hGoals > m.aGoals)      { h.w++; a.l++; h.pts += 3; }
    else if (m.aGoals > m.hGoals) { a.w++; h.l++; a.pts += 3; }
    else                           { h.d++; a.d++; h.pts += 1; a.pts += 1; }
  });

  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teams]) => ({
      group,
      teams: Object.values(teams).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if ((b.gf - b.ga) !== (a.gf - a.ga)) return (b.gf - b.ga) - (a.gf - a.ga);
        return b.gf - a.gf;
      }),
    }));
}

export default function StandingsPage({ matches }) {
  const standings = computeStandings(matches);

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {standings.map(({ group, teams }) => (
          <div key={group} className={styles.groupCard}>
            <div className={styles.groupHeader}>Group {group}</div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thTeam}></th>
                  <th className={styles.thNum}>P</th>
                  <th className={styles.thNum}>GD</th>
                  <th className={styles.thPts}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const owner = TEAM_OWNER[t.code];
                  const gd = t.gf - t.ga;
                  return (
                    <tr key={t.code} className={i < 2 ? styles.qualifying : ''}>
                      <td className={styles.tdTeam}>
                        <span className={styles.flag}>{t.flag}</span>
                        <span className={styles.name}>{t.full}</span>
                        {owner && <span className={styles.owner}>{owner.name}</span>}
                      </td>
                      <td className={styles.tdNum}>{t.p}</td>
                      <td className={styles.tdNum}>{gd > 0 ? `+${gd}` : gd}</td>
                      <td className={styles.tdPts}>{t.pts}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
