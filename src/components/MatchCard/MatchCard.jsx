import styles from './MatchCard.module.css';
import AvatarBadge from '../AvatarBadge/AvatarBadge';
import VideoCountdown from '../VideoCountdown/VideoCountdown';
import { TEAM_MAP } from '../../data/teamMap';
import { ROUND_FOLDER } from '../../hooks/useKOVideos';

const KO_ROUNDS = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);

function formatKickoff(date) {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}
function formatDate(date) {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function MatchCard({ match, videoInfo, koVideos = {}, isFocus, onVideoOpen }) {
  const { hCode, aCode, hGoals, aGoals, hState, aState, hOwner, aOwner,
          hCoOwners = [], aCoOwners = [],
          round = '',
          isLive, isFinished, kickoff, elapsed, sideBetDrinks, sideBetDesc, sideBetEmoji } = match;

  const hTeam = TEAM_MAP[hCode] ?? { full: hCode, flag: '🏳️', group: '?' };
  const aTeam = TEAM_MAP[aCode] ?? { full: aCode, flag: '🏳️', group: '?' };

  const matchState = isLive ? 'live' : isFinished ? 'finished' : 'upcoming';
  const videoTitle  = `${hTeam.flag} ${hCode} vs ${aCode} ${aTeam.flag}`;

  const isKO = KO_ROUNDS.has(round);
  const matchKey = `${hCode}-${aCode}`;
  const kvMap = koVideos[matchKey] || {};

  // ── KO video tracking ──
  const hLoserOwners = isKO && hState === 'losing' ? [hOwner, ...hCoOwners].filter(Boolean) : [];
  const aLoserOwners = isKO && aState === 'losing' ? [aOwner, ...aCoOwners].filter(Boolean) : [];

  const hKOFilenames = hLoserOwners
    .filter(o => kvMap[o.name]?.filename)
    .map(o => `${kvMap[o.name].folder}/${kvMap[o.name].filename}`);
  const aKOFilenames = aLoserOwners
    .filter(o => kvMap[o.name]?.filename)
    .map(o => `${kvMap[o.name].folder}/${kvMap[o.name].filename}`);

  // ── Group stage video data (existing logic) ──
  const hHasVideoGS = hState === 'losing' ? !!(videoInfo?.filename)
                    : hState === 'draw'   ? (videoInfo?.drinks1 != null)
                    : false;
  const aHasVideoGS = aState === 'losing' ? !!(videoInfo?.filename)
                    : aState === 'draw'   ? (videoInfo?.drinks2 != null)
                    : false;
  const aFilenameGS = videoInfo?.filename2 || videoInfo?.filename;

  const hHasVideo2GS = hState === 'losing' ? !!(videoInfo?.filename3)
                     : hState === 'draw'   ? !!(videoInfo?.filename3)
                     : false;
  const aHasVideo2GS = aState === 'losing' ? !!(videoInfo?.filename3)
                     : aState === 'draw'   ? !!(videoInfo?.filename4)
                     : false;

  const hFilenamesGS = [
    ...(videoInfo?.filename ? [videoInfo.filename] : []),
    ...(hState === 'draw' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
    ...(hState === 'losing' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
  ];
  const aFilenamesGS = aState === 'draw'
    ? [
        ...(aFilenameGS ? [aFilenameGS] : []),
        ...(videoInfo?.filename4 ? [videoInfo.filename4] : []),
      ]
    : [
        ...(aFilenameGS ? [aFilenameGS] : []),
        ...(aState === 'losing' && videoInfo?.filename3 ? [videoInfo.filename3] : []),
      ];

  // ── Unified values (KO vs group stage) ──
  const hHasVideo  = isKO ? hKOFilenames.length > 0 : hHasVideoGS;
  const aHasVideo  = isKO ? aKOFilenames.length > 0 : aHasVideoGS;
  const hHasVideo2 = isKO ? false : hHasVideo2GS;
  const aHasVideo2 = isKO ? false : aHasVideo2GS;
  const hFilenames = isKO ? hKOFilenames : hFilenamesGS;
  const aFilenames = isKO ? aKOFilenames : aFilenamesGS;

  const hNames = [hOwner, ...hCoOwners].filter(Boolean).map(p => p.name);
  const aNames = [aOwner, ...aCoOwners].filter(Boolean).map(p => p.name);
  const hLabel = hNames.join(' & ') || hCode;
  const aLabel = aNames.join(' & ') || aCode;

  // ── Who still needs to upload ──
  const drinkers = (() => {
    if (!isFinished) return null;

    if (isKO) {
      const allLoserOwners = hState === 'losing' ? hLoserOwners
                           : aState === 'losing' ? aLoserOwners
                           : [];
      if (allLoserOwners.length === 0) return null;
      const missing = allLoserOwners.filter(o => !kvMap[o.name]);
      if (missing.length === 0) return null;
      return missing.map(o => o.name).join(' & ');
    }

    if (hState === 'draw') {
      if (hHasVideo && aHasVideo) return null;
      if (hHasVideo) return aLabel;
      if (aHasVideo) return hLabel;
      return `${hLabel} & ${aLabel}`;
    }
    if (hState === 'losing' && !hHasVideo) return hLabel;
    if (aState === 'losing' && !aHasVideo) return aLabel;
    return null;
  })();

  const cardClass = [
    styles.card,
    isLive          ? styles.live     : '',
    isFinished      ? styles.finished : '',
    isFocus         ? styles.focus    : '',
    sideBetDrinks > 0 ? styles.sideBet : '',
  ].filter(Boolean).join(' ');

  const metaLabel = isKO ? round : `Group ${hTeam.group}`;

  return (
    <div className={cardClass}>
      <div className={styles.cardRow}>
      <div className={styles.ownerStack}>
        <AvatarBadge
          participant={hOwner} teamCode={hCode} teamFlag={hTeam.flag}
          state={hState} matchState={matchState} isFocus={isFocus}
          hasVideo={hHasVideo} hasVideo2={hHasVideo2}
          onVideoClick={() => onVideoOpen(hFilenames, videoTitle)}
          drinkEmoji={(videoInfo?.emoji1 || '') + (videoInfo?.emoji3 || '')}
          sideBetDrinks={sideBetDrinks}
          sideBetEmoji={sideBetEmoji}
        />
        {hCoOwners.map(p => (
          <span key={p.name} className={styles.coOwnerChip}>{p.flag} {p.name}</span>
        ))}
      </div>

      <div className={styles.center}>
        <div className={styles.meta}>
          <span className={styles.groupLabel}>{metaLabel}</span>
          {isLive && (
            <span className={styles.livePill}>
              <span className={styles.liveDot} />
              {match.status === 'HT' ? 'HT' : elapsed != null ? `${elapsed}'` : 'LIVE'}
            </span>
          )}
          {isFinished && <span className={styles.ftPill}>FT</span>}
          {!isLive && !isFinished && (
            <span className={styles.kickoffLabel}>{formatDate(kickoff)}</span>
          )}
        </div>

        <div className={styles.vsRow}>
          <span className={styles.vsFlag}>{hTeam.flag}</span>
          <span className={styles.vs}>VS</span>
          <span className={styles.vsFlag}>{aTeam.flag}</span>
        </div>

        <div className={styles.scoreRow}>
          {(isLive || isFinished) ? (
            <>
              <span className={hState === 'winning' ? styles.scoreWin : styles.scoreNum}>{hGoals}</span>
              <span className={styles.scoreSep}>–</span>
              <span className={aState === 'winning' ? styles.scoreWin : styles.scoreNum}>{aGoals}</span>
            </>
          ) : (
            <span className={styles.kickoffTime}>{formatKickoff(kickoff)}</span>
          )}
        </div>

        <div className={styles.teamsRow}>
          <span className={styles.teamName}>{hTeam.full}</span>
          <span className={styles.teamName}>{aTeam.full}</span>
        </div>

      </div>

      <div className={styles.ownerStack}>
        <AvatarBadge
          participant={aOwner} teamCode={aCode} teamFlag={aTeam.flag}
          state={aState} matchState={matchState} isFocus={isFocus}
          hasVideo={aHasVideo} hasVideo2={aHasVideo2}
          onVideoClick={() => onVideoOpen(aFilenames, videoTitle)}
          drinkEmoji={aState === 'draw' ? (videoInfo?.emoji2 || '') + (videoInfo?.emoji4 || '') : (videoInfo?.emoji1 || '') + (videoInfo?.emoji3 || '')}
          sideBetDrinks={sideBetDrinks}
          sideBetEmoji={sideBetEmoji}
        />
        {aCoOwners.map(p => (
          <span key={p.name} className={styles.coOwnerChip}>{p.flag} {p.name}</span>
        ))}
      </div>
      </div>

      {sideBetDrinks > 0 && (
        <div className={styles.sideBetBanner}>
          💰 SIDE BET · {sideBetDesc || `+${sideBetDrinks} extra drink${sideBetDrinks > 1 ? 's' : ''}`}
        </div>
      )}
      {drinkers && (
        <VideoCountdown
          kickoff={kickoff}
          drinkers={drinkers}
          cardStyles={styles}
          hospitalPass={[hOwner, aOwner, ...hCoOwners, ...aCoOwners].some(o => o?.name === 'Tim')}
        />
      )}
    </div>
  );
}
