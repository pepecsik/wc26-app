import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import { PARTICIPANTS } from '../../data/participants';

// Temporary demo data — shows how the layout scales with different player counts
// Replace with real data after the group stage draw
const p = (name) => PARTICIPANTS.find(x => x.name === name);

const R32_SLOTS = [
  // Show layout with 1 player per side (normal)
  { id: 1,  label: 'Match 1',  hCode: null, aCode: null, hPlayers: [p('Pepe')],    aPlayers: [p('Tim')] },
  // Show layout with 2 per side
  { id: 2,  label: 'Match 2',  hCode: null, aCode: null, hPlayers: [p('Adam'), p('Blake')], aPlayers: [p('Charlie'), p('Emma')] },
  // Show layout with 3 per side
  { id: 3,  label: 'Match 3',  hCode: null, aCode: null, hPlayers: [p('Russ'), p('Kimbo'), p('Sabo')], aPlayers: [p('Will Hunt'), p('Sjaak'), p('Rand')] },
  // Show layout with 4 per side
  { id: 4,  label: 'Match 4',  hCode: null, aCode: null, hPlayers: [p('Ali'), p('Jimmy'), p('J$'), p('Malou')], aPlayers: [p('Michael'), p('Nathanial'), p('Scotty2Hotty'), p('Rogier')] },
  // 6 per side (semi-final territory)
  { id: 5,  label: 'Match 5',  hCode: null, aCode: null,
    hPlayers: [p('Pepe'), p('Tim'), p('Adam'), p('Blake'), p('Charlie'), p('Emma')],
    aPlayers: [p('Russ'), p('Kimbo'), p('Sabo'), p('Will Hunt'), p('Sjaak'), p('Rand')] },
  // Empty slots (TBD)
  ...Array.from({ length: 11 }, (_, i) => ({ id: i + 6, label: `Match ${i + 6}`, hCode: null, aCode: null, hPlayers: [], aPlayers: [] })),
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
