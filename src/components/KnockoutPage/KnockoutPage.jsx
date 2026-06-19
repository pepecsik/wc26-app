import { useState } from 'react';
import styles from './KnockoutPage.module.css';
import KnockoutMatchCard from '../KnockoutMatchCard/KnockoutMatchCard';
import VideoModal from '../VideoModal/VideoModal';
import { PARTICIPANTS } from '../../data/participants';

const find = (name) => PARTICIPANTS.find(x => x.name === name);

// Helper: clone participant and attach a video filename (or none)
const withVideo = (name, filename) => ({ ...find(name), videoFilename: filename || null });

const now = new Date();
const hoursAgo  = (h) => new Date(now - h * 3600000);
const hoursFrom = (h) => new Date(now.getTime() + h * 3600000);

const R32_SLOTS = [
  // LIVE — 2v2, game in progress, no videos yet
  {
    id: 1, label: 'R32 · Match 1',
    hCode: 'ESP', aCode: 'BRA', hGoals: 1, aGoals: 2,
    hState: 'losing', aState: 'winning',
    isLive: true, isFinished: false,
    kickoff: hoursAgo(1.2), status: '2H', elapsed: 67,
    hPlayers: [withVideo('Sjaak'), withVideo('Tim')],
    aPlayers: [withVideo('Rand'), withVideo('Pepe')],
  },

  // FINISHED — 3v3 — losing side: 1 uploaded, 2 still owe
  {
    id: 2, label: 'R32 · Match 2',
    hCode: 'FRA', aCode: 'ARG', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true,
    kickoff: hoursAgo(28),
    hPlayers: [
      withVideo('Sebastian', 'WC004_260612_D_USA-PAR_4-1_SEBASTIAN'),
      withVideo('Charlie'),   // still owes
      withVideo('Blake'),     // still owes
    ],
    aPlayers: [
      withVideo('Tobias'),
      withVideo('Adam'),
      withVideo('Ali'),
    ],
  },

  // FINISHED — 4v4 — all losers uploaded
  {
    id: 3, label: 'R32 · Match 3',
    hCode: 'NED', aCode: 'GER', hGoals: 0, aGoals: 1,
    hState: 'losing', aState: 'winning',
    isLive: false, isFinished: true,
    kickoff: hoursAgo(30),
    hPlayers: [
      withVideo('Purcy',   'WC003_260612_B_CAN-BOS_1-1_PURCY'),
      withVideo('Kimbo',   'WC006_260613_C_BRA-MOR_1-1_RAND'),   // reusing a real file for demo
      withVideo('Russ',    'WC007_260613_C_HAI-SCO_0-1_NATHANIAL'),
      withVideo('Jimmy',   'WC009_260614_E_GER-CUR_7-1_MALOU'),
    ],
    aPlayers: [
      withVideo('Charlie'),
      withVideo('Emma'),
      withVideo('Michael'),
      withVideo('Rogier'),
    ],
  },

  // FINISHED — draw 3v3 — mixed on both sides
  {
    id: 4, label: 'R32 · Match 4',
    hCode: 'ENG', aCode: 'POR', hGoals: 1, aGoals: 1,
    hState: 'draw', aState: 'draw',
    isLive: false, isFinished: true,
    kickoff: hoursAgo(32),
    hPlayers: [
      withVideo('Emma',    'WC011_260614_E_CIV-ECU_1-0_MICHAEL'),
      withVideo('J$'),     // still owes
      withVideo('Malou',   'WC009_260614_E_GER-CUR_7-1_MALOU'),
    ],
    aPlayers: [
      withVideo('Scotty2Hotty'), // still owes
      withVideo('Nathanial', 'WC007_260613_C_HAI-SCO_0-1_NATHANIAL'),
      withVideo('Rogier'),       // still owes
    ],
  },

  // UPCOMING — 6v6, semi-final scale preview
  {
    id: 5, label: 'R32 · Match 5',
    hCode: 'ARG', aCode: 'MEX', hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false,
    kickoff: hoursFrom(3),
    hPlayers: ['Pepe','Tim','Adam','Blake','Charlie','Emma'].map(n => withVideo(n)),
    aPlayers: ['Russ','Kimbo','Sabo','Will Hunt','Sjaak','Rand'].map(n => withVideo(n)),
  },

  // TBD — empty slots
  ...Array.from({ length: 11 }, (_, i) => ({
    id: i + 6, label: `R32 · Match ${i + 6}`,
    hCode: null, aCode: null, hGoals: null, aGoals: null,
    hState: 'neutral', aState: 'neutral',
    isLive: false, isFinished: false, kickoff: null,
    hPlayers: [], aPlayers: [],
  })),
];

export default function KnockoutPage() {
  const [video, setVideo] = useState(null);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>Round of 32</div>
        <div className={styles.subtitle}>Design preview — not live yet</div>
      </div>
      <div className={styles.grid}>
        {R32_SLOTS.map(m => (
          <KnockoutMatchCard
            key={m.id}
            match={m}
            onVideoOpen={(filenames, title) => setVideo({ filenames, title })}
          />
        ))}
      </div>
      {video && <VideoModal {...video} onClose={() => setVideo(null)} />}
    </div>
  );
}
