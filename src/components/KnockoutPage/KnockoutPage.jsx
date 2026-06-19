import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import { PARTICIPANTS } from '../../data/participants';

const p = (name) => PARTICIPANTS.find(x => x.name === name);

const now = new Date();
const hoursAgo  = (h) => new Date(now - h * 3600000);
const hoursFrom = (h) => new Date(now.getTime() + h * 3600000);

const R32_SLOTS = [
  // LIVE — 2 players per side, score showing, 67'
  {
    id: 1, label: 'R32 · Match 1',
    hCode: 'ESP', aCode: 'BRA', hGoals: 1, aGoals: 2,
    hState: 'losing', aState: 'winning',
    isLive: true, isFinished: false,
    kickoff: hoursAgo(1.2), status: '2H', elapsed: 67,
    hPlayers: [p('Sjaak'), p('Tim')],
    aPlayers: [p('Rand'), p('Pepe')],
  },

  // FINISHED — loser side red, 3 vs 3
  {
    id: 2, label: 'R32 · Match 2',
    hCode: 'FRA', aCode: 'ARG', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true,
    kickoff: hoursAgo(26),
    hPlayers: [p('Sebastian'), p('Charlie'), p('Blake')],
    aPlayers: [p('Tobias'), p('Adam'), p('Ali')],
  },

  // FINISHED — draw, 4 vs 4
  {
    id: 3, label: 'R32 · Match 3',
    hCode: 'NED', aCode: 'GER', hGoals: 2, aGoals: 2,
    hState: 'draw', aState: 'draw',
    isLive: false, isFinished: true,
    kickoff: hoursAgo(30),
    hPlayers: [p('Purcy'), p('Kimbo'), p('Russ'), p('Jimmy')],
    aPlayers: [p('Charlie'), p('Emma'), p('Michael'), p('Rogier')],
  },

  // UPCOMING — 6 per side (semi territory preview)
  {
    id: 4, label: 'R32 · Match 4',
    hCode: 'ENG', aCode: 'POR', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false,
    kickoff: hoursFrom(3),
    hPlayers: [p('Emma'), p('Sjaak'), p('Scotty2Hotty'), p('J$'), p('Malou'), p('Nathanial')],
    aPlayers: [p('Scotty2Hotty'), p('Purcy'), p('Sabo'), p('Will Hunt'), p('Michael'), p('Pepe')],
  },

  // TBD — no teams, no players yet
  ...Array.from({ length: 12 }, (_, i) => ({
    id: i + 5, label: `R32 · Match ${i + 5}`,
    hCode: null, aCode: null, hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false,
    kickoff: null,
    hPlayers: [], aPlayers: [],
  })),
];

export default function KnockoutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Round of 32</div>
        <div className={styles.subtitle}>Design preview — not live yet</div>
      </div>
      <div className={styles.grid}>
        {R32_SLOTS.map(m => (
          <KnockoutMatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
