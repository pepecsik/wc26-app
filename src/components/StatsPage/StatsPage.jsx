import { useState, useEffect, useMemo } from 'react';
import styles from './StatsPage.module.css';
import PlayerModal from '../PlayerModal/PlayerModal';
import StatHistoryModal from '../StatHistoryModal/StatHistoryModal';
import { TEAM_MAP } from '../../data/teamMap';
import { PARTICIPANTS } from '../../data/participants';

function MiniAvatar({ p }) {
  return p.photo
    ? <img src={p.photo} alt={p.name} className={styles.miniAvatar} />
    : <div className={styles.miniAvatarInitials} style={{ background: p.color }}>{p.initials}</div>;
}

const STAT_KEY = {
  'Most Drinks': 'drinks',
  'Win Streak':  'wStreak',
  'Drink Streak': 'dStreak',
};

function StatCard({ emoji, label, children, className, onClick }) {
  const clickable = !!onClick;
  return (
    <div
      className={[
        styles.statCard,
        className ?? '',
        clickable ? styles.statCardClickable : '',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <div className={styles.statCardLabel}>
        {emoji} {label}
        {clickable && <span className={styles.statCardChart}>📈</span>}
      </div>
      <div className={styles.statCardBody}>{children}</div>
    </div>
  );
}

function drinkStreak(p) {
  const finished = [...p.matches]
    .filter(m => m.isFinished)
    .sort((a, b) => b.kickoff - a.kickoff);
  let n = 0;
  for (const m of finished) {
    if (m.myState === 'losing' || m.myState === 'draw') n++;
    else break;
  }
  return n;
}

function FunStats({ players, ownerMap = {}, onHistoryOpen }) {
  const hasFinished = players.some(p => p.matches.some(m => m.isFinished));
  if (!hasFinished) return null;

  const totalDrinks     = players.reduce((s, p) => s + p.drinks, 0);
  const totalDrinksDone = players.reduce((s, p) => s + p.drinksDone, 0);
  const totalSideBet    = players.reduce((s, p) => s + (p.sideBetDrinkCount ?? 0) + (p.bonusDrinks ?? 0) + (p.extraVideoDrinks ?? 0), 0);

  // Cache drinkStreak so we don't recompute per render
  const dStreakVal = Object.fromEntries(players.map(p => [p.name, drinkStreak(p)]));

  const redrawnCounts = {};
  Object.values(ownerMap).forEach(owners => {
    owners.forEach(o => { redrawnCounts[o.name] = (redrawnCounts[o.name] || 0) + 1; });
  });

  // naturalCount = default rows shown (tied-for-top for streak/drinks; full list for debt)
  const maxDrinks      = Math.max(0, ...players.map(p => p.drinksDone));
  const maxStreak      = Math.max(0, ...players.map(p => p.streak));
  const maxDrinkStreak = Math.max(0, ...players.map(p => dStreakVal[p.name]));
  const maxRedraws     = Math.max(0, ...players.map(p => redrawnCounts[p.name] || 0));

  const cardDefs = [
    {
      emoji: '🍺', label: 'Most Drinks',
      items: [...players].filter(p => p.drinksDone > 0).sort((a, b) => b.drinksDone - a.drinksDone),
      naturalCount: players.filter(p => p.drinksDone === maxDrinks && maxDrinks > 0).length,
      val: p => `${p.drinksDone}x`,
    },
    {
      emoji: '🔥', label: 'Win Streak',
      items: [...players].filter(p => p.streak > 0).sort((a, b) => b.streak - a.streak),
      naturalCount: players.filter(p => p.streak === maxStreak && maxStreak > 0).length,
      val: p => `${p.streak} in a row`,
    },
    {
      emoji: '🎬', label: 'Video Debt',
      items: [...players].filter(p => p.videoDebt > 0).sort((a, b) => b.videoDebt - a.videoDebt),
      val: p => `owes ${p.videoDebt}`,
    },
    {
      emoji: '🍻', label: 'Drink Streak',
      items: [...players].filter(p => dStreakVal[p.name] > 0).sort((a, b) => dStreakVal[b.name] - dStreakVal[a.name]),
      naturalCount: players.filter(p => dStreakVal[p.name] === maxDrinkStreak && maxDrinkStreak > 0).length,
      val: p => `${dStreakVal[p.name]} in a row`,
    },
    {
      emoji: '🔀', label: 'Most Redraws',
      items: [...players].filter(p => redrawnCounts[p.name] > 0).sort((a, b) => redrawnCounts[b.name] - redrawnCounts[a.name]),
      naturalCount: players.filter(p => (redrawnCounts[p.name] || 0) === maxRedraws && maxRedraws > 0).length,
      val: p => `${redrawnCounts[p.name]}×`,
    },
  ].map(c => ({ ...c, naturalCount: c.naturalCount ?? c.items.length }));

  // Only cards with data, sorted ascending by natural size → small cards pair with small cards
  const cards = cardDefs
    .filter(c => c.items.length > 0)
    .sort((a, b) => a.naturalCount - b.naturalCount);

  // Each pair: shorter card fills up with runners-up to match its neighbour's naturalCount
  const showCounts = cards.map(c => c.naturalCount);
  for (let i = 0; i + 1 < cards.length; i += 2) {
    const pairMax = Math.max(cards[i].naturalCount, cards[i + 1].naturalCount);
    showCounts[i]     = Math.min(cards[i].items.length, pairMax);
    showCounts[i + 1] = Math.min(cards[i + 1].items.length, pairMax);
  }

  return (
    <div className={styles.funStats}>
      <div className={styles.funStatsTitle}>Group Stats</div>

      {totalDrinks > 0 && (
        <div className={styles.totalDrinks}>
          🍺 <span>{totalDrinks}</span> drinks owed · <span>{totalDrinksDone}</span> done
          {totalSideBet > 0 && <> · 🎉 <span>{totalSideBet}</span> extra drinks</>}
        </div>
      )}

      <div className={styles.statGrid}>
        {cards.map(({ emoji, label, items, val }, i) => (
          <StatCard
            key={label}
            emoji={emoji}
            label={label}
            className={cards.length % 2 === 1 && i === cards.length - 1 ? styles.statCardFull : undefined}
            onClick={STAT_KEY[label] && onHistoryOpen ? () => onHistoryOpen(STAT_KEY[label]) : undefined}
          >
            <div className={styles.statCardDebt}>
              {items.slice(0, showCounts[i]).map(p => (
                <div key={p.name} className={styles.debtRow}>
                  <MiniAvatar p={p} />
                  <span className={styles.statCardName}>{p.name}</span>
                  <span className={styles.statCardVal}>{val(p)}</span>
                </div>
              ))}
            </div>
          </StatCard>
        ))}
      </div>
    </div>
  );
}

const LS_KEY    = 'wc26-ranks';
const TTL_MS    = 24 * 60 * 60 * 1000;

function rankPlayers(players) {
  const sorted = [...players].sort((a, b) => {
    if (b.wins   !== a.wins)   return b.wins   - a.wins;
    if (a.losses !== b.losses) return a.losses  - b.losses;
    return a.draws - b.draws;
  });

  let rank = 1;
  return sorted.map((p, i) => {
    if (i > 0) {
      const prev = sorted[i - 1];
      if (p.wins !== prev.wins || p.losses !== prev.losses || p.draws !== prev.draws) {
        rank = i + 1;
      }
    }
    return { ...p, rank };
  });
}

export default function StatsPage({ players, aliveCodes = new Set(), ownerMap = {} }) {
  const [selected, setSelected]       = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const ranked = useMemo(() => rankPlayers(players), [players]);

  const [arrows, setArrows] = useState({});

  useEffect(() => {
    if (ranked.length === 0) return;
    const now = Date.now();
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch {}

    const newStored = {};
    const newArrows = {};

    ranked.forEach(({ name, rank }) => {
      let { baseRank = rank, lastKnownRank = rank, lastMovedAt = null } = stored[name] ?? {};

      // Detect movement since last poll → restart personal 24h clock
      if (rank !== lastKnownRank) {
        lastMovedAt = now;
        lastKnownRank = rank;
      }

      const withinWindow = lastMovedAt !== null && (now - lastMovedAt) < TTL_MS;

      if (!withinWindow) {
        // 24h without movement → arrow expires, new baseline
        baseRank    = rank;
        lastMovedAt = null;
      }

      newStored[name] = { baseRank, lastKnownRank, lastMovedAt };
      newArrows[name]  = withinWindow && rank !== baseRank
        ? (rank < baseRank ? '↑' : '↓')
        : null;
    });

    localStorage.setItem(LS_KEY, JSON.stringify(newStored));
    setArrows(newArrows);
  }, [ranked]);

  return (
    <div className={styles.page}>
      <FunStats players={ranked} ownerMap={ownerMap} onHistoryOpen={setHistoryModal} />
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.thRank}>#</th>
            <th className={styles.thPlayer}>Player</th>
            <th className={styles.thStat}>W</th>
            <th className={styles.thStat}>L</th>
            <th className={styles.thStat}>D</th>
            <th className={styles.thStat}>🍺</th>
            <th className={styles.thStat}>✓</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(p => (
            <tr key={p.name} className={styles.row} onClick={() => setSelected(p)}>
              <td className={styles.rank}>
                {p.rank}
                {arrows[p.name] && (
                  <span className={`${styles.rankArrow} ${arrows[p.name] === '↑' ? styles.rankUp : styles.rankDown}`}>
                    {arrows[p.name] === '↑' ? '▲' : '▼'}
                  </span>
                )}
              </td>
              <td className={styles.player}>
                <div className={styles.playerInner}>
                  {p.photo
                    ? <img src={p.photo} alt={p.name} className={styles.avatar} />
                    : <div className={styles.avatarInitials} style={{ background: p.color }}>{p.initials}</div>
                  }
                  <div className={styles.playerNameBlock}>
                    <span className={styles.playerName}>{p.name}</span>
                    <span className={styles.teamFlags}>
                      {(() => {
                        const hasKO = aliveCodes.size > 0;
                        const ogCodes = new Set(PARTICIPANTS.find(p2 => p2.name === p.name)?.teams || []);
                        const redrawnCodes = Object.entries(ownerMap)
                          .filter(([, owners]) => owners.some(o => o.name === p.name))
                          .map(([code]) => code);
                        const displayCodes = hasKO
                          ? [
                              ...(p.teams || []).filter(c => aliveCodes.has(c)),
                              ...redrawnCodes.filter(c => aliveCodes.has(c) && !ogCodes.has(c)),
                            ]
                          : (p.teams || []);
                        return displayCodes.map(code => (
                          <span key={code} className={ogCodes.has(code) ? styles.flagAlive : ''}>
                            {TEAM_MAP[code]?.flag ?? ''}
                          </span>
                        ));
                      })()}
                    </span>
                  </div>
                </div>
              </td>
              <td className={`${styles.stat} ${styles.win}`}>{p.wins}</td>
              <td className={`${styles.stat} ${styles.loss}`}>{p.losses}</td>
              <td className={`${styles.stat} ${styles.draw}`}>{p.draws}</td>
              <td className={`${styles.stat} ${styles.drink}`}>{p.drinks}</td>
              <td className={`${styles.stat} ${styles.done}`}>{p.drinksDone || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && <PlayerModal player={selected} onClose={() => setSelected(null)} ownerMap={ownerMap} aliveCodes={aliveCodes} />}
      {historyModal && (
        <StatHistoryModal
          players={ranked}
          initialStat={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
    </div>
  );
}
