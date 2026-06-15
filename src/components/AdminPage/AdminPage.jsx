import { useState } from 'react';
import styles from './AdminPage.module.css';
import { useMatches } from '../../hooks/useMatches';
import { useSheetData } from '../../hooks/useSheetData';
import { TEAM_MAP } from '../../data/teamMap';

const ADMIN_PASSWORD = import.meta.env.VITE_API_KEY;
const B2_FOLDER = '01_GROUP_STAGE';

function Avatar({ participant, teamCode }) {
  const name = participant?.name ?? teamCode;
  const color = participant?.color ?? '#555';
  const initials = participant?.initials ?? '?';
  return (
    <div className={styles.avatar} style={{ borderColor: color }}>
      {participant?.photo
        ? <img src={participant.photo} alt={name} className={styles.avatarImg} />
        : <span className={styles.avatarInitials} style={{ color }}>{initials}</span>
      }
    </div>
  );
}

function UploadSlot({ match, slot, participant, teamCode, teamFlag, defaultDrinks, currentFilename }) {
  const [file, setFile] = useState(null);
  const [drinkCount, setDrinkCount] = useState(defaultDrinks ?? 1);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const playerName = participant?.name ?? teamCode;

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const prepRes = await fetch('/.netlify/functions/prepare-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: match.hCode, away: match.aCode, slot, drinkCount }),
      });
      const prep = await prepRes.json();
      if (prep.error) throw new Error(prep.error);

      const filename = slot === 1 ? prep.filename1 : prep.filename2;
      if (!filename) throw new Error('No filename returned from sheet');

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100));
        });
        xhr.addEventListener('load', () => {
          xhr.status < 300 ? resolve() : reject(new Error(`B2 ${xhr.status}: ${xhr.responseText.slice(0, 120)}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error')));
        xhr.open('POST', prep.uploadUrl);
        xhr.setRequestHeader('Authorization', prep.uploadAuthToken);
        xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(`${B2_FOLDER}/${filename}.mp4`));
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify');
        xhr.send(file);
      });

      setUploadedFilename(filename);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className={`${styles.slot} ${status === 'done' ? styles.slotDone : ''}`}>
      <div className={styles.slotPlayer}>
        <Avatar participant={participant} teamCode={teamCode} />
        <div className={styles.slotInfo}>
          <span className={styles.slotFlag}>{teamFlag}</span>
          <span className={styles.slotName}>{playerName}</span>
          {status === 'done' && <span className={styles.doneTag}>✓ uploaded</span>}
        </div>
      </div>

      {status !== 'done' && (
        <div className={styles.slotControls}>
          <div className={styles.drinkRow}>
            <span className={styles.drinkLabel}>🍺 drinks</span>
            <select
              value={drinkCount}
              onChange={e => setDrinkCount(Number(e.target.value))}
              className={styles.drinkSelect}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <label className={styles.fileLabel}>
            {file ? file.name.slice(0, 28) + (file.name.length > 28 ? '…' : '') : 'Choose video'}
            <input
              type="file"
              accept="video/*"
              onChange={e => setFile(e.target.files[0])}
              className={styles.fileInput}
            />
          </label>
          <button
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            className={styles.uploadBtn}
          >
            {status === 'uploading' ? `${progress}%` : '⬆ Upload'}
          </button>
        </div>
      )}

      {currentFilename && status === 'idle' && (
        <div className={styles.doneName}>replaces: {currentFilename}.mp4</div>
      )}
      {status === 'done' && (
        <div className={styles.doneName}>{uploadedFilename}.mp4</div>
      )}
      {status === 'error' && <div className={styles.slotError}>{errorMsg}</div>}
    </div>
  );
}

function SideBetCard({ match }) {
  const hTeam = TEAM_MAP[match.hCode] ?? { flag: '🏳️', full: match.hCode };
  const aTeam = TEAM_MAP[match.aCode] ?? { flag: '🏳️', full: match.aCode };
  const [drinks, setDrinks] = useState(match.sideBetDrinks || 1);
  const [desc, setDesc] = useState(match.sideBetDesc || '');
  const [status, setStatus] = useState('idle');

  async function saveSideBet() {
    setStatus('saving');
    try {
      const res = await fetch('/.netlify/functions/save-sidebet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: match.hCode, away: match.aCode, sideBetDrinks: drinks, sideBetDesc: desc }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      alert(err.message);
    }
  }

  return (
    <div className={`${styles.matchCard} ${styles.sideBetCard}`}>
      <div className={styles.matchHeader}>
        <span className={styles.matchScore}>
          {hTeam.flag} {match.hCode} vs {match.aCode} {aTeam.flag}
        </span>
        <span className={styles.matchMeta}>
          {match.isLive ? '🟢 LIVE' : match.kickoff.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className={styles.sideBetPlayers}>
        <div className={styles.sideBetPlayer}>
          <Avatar participant={match.hOwner} teamCode={match.hCode} />
          <span className={styles.slotName}>{match.hOwner?.name ?? match.hCode}</span>
        </div>
        <span className={styles.sideBetVs}>VS</span>
        <div className={styles.sideBetPlayer}>
          <Avatar participant={match.aOwner} teamCode={match.aCode} />
          <span className={styles.slotName}>{match.aOwner?.name ?? match.aCode}</span>
        </div>
      </div>

      <div className={styles.sideBetForm}>
        <div className={styles.sideBetRow}>
          <span className={styles.drinkLabel}>💰 extra drinks on top of 1</span>
          <select value={drinks} onChange={e => setDrinks(Number(e.target.value))} className={styles.drinkSelect}>
            {[0.5,1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>+{n} = {n+1} total</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Side bet description (optional)"
          className={styles.sideBetInput}
        />
        <button
          onClick={saveSideBet}
          disabled={status === 'saving' || status === 'done'}
          className={styles.uploadBtn}
        >
          {status === 'saving' ? 'Saving…' : status === 'done' ? '✓ Saved' : '💰 Set Side Bet'}
        </button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [corsMsg, setCorsMsg] = useState('');
  const [tab, setTab] = useState('uploads');
  const { matches } = useMatches();
  const videoMap = useSheetData();

  function tryLogin() {
    if (password === ADMIN_PASSWORD) setAuthed(true);
    else alert('Wrong password');
  }

  if (!authed) {
    return (
      <div className={styles.gate}>
        <div className={styles.gateBox}>
          <div className={styles.gateTitle}>⚙ Admin</div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tryLogin()}
            placeholder="Password"
            className={styles.gateInput}
            autoFocus
          />
          <button onClick={tryLogin} className={styles.gateBtn}>Enter</button>
        </div>
      </div>
    );
  }

  const pending = matches
    .filter(m => m.isFinished)
    .filter(m => {
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      const isDraw = m.hState === 'draw';
      if (isDraw) return !vi?.filename || !vi?.filename2;
      if (m.hState === 'losing' || m.aState === 'losing') return !vi?.filename;
      return false;
    })
    .sort((a, b) => a.kickoff - b.kickoff);

  const upcomingOrLive = matches
    .filter(m => !m.isFinished)
    .sort((a, b) => a.kickoff - b.kickoff);

  async function setupCors() {
    setCorsMsg('Setting up…');
    const res = await fetch('/.netlify/functions/setup-b2-cors');
    const data = await res.json();
    setCorsMsg(data.error ? `Error: ${data.error}` : '✓ Done');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Admin</span>
        <button onClick={setupCors} className={styles.corsBtn}>
          {corsMsg || 'Setup B2 CORS'}
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'uploads' ? styles.tabActive : ''}`}
          onClick={() => setTab('uploads')}
        >
          🎬 Upload Videos {pending.length > 0 && <span className={styles.tabBadge}>{pending.length}</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'sidebets' ? styles.tabActive : ''}`}
          onClick={() => setTab('sidebets')}
        >
          💰 Side Bets
        </button>
        <button
          className={`${styles.tab} ${tab === 'reupload' ? styles.tabActive : ''}`}
          onClick={() => setTab('reupload')}
        >
          🔄 Reupload
        </button>
      </div>

      {tab === 'uploads' && (
        pending.length === 0 ? (
          <div className={styles.empty}>All videos uploaded 🎉</div>
        ) : pending.map(m => {
          const vi = videoMap[`${m.hCode}-${m.aCode}`];
          const isDraw = m.hState === 'draw';
          const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️', full: m.hCode };
          const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️', full: m.aCode };
          const sideBetDrinks = m.sideBetDrinks || 0;
          const defaultDrinks = 1 + sideBetDrinks;

          return (
            <div key={m.id} className={styles.matchCard}>
              <div className={styles.matchHeader}>
                <span className={styles.matchScore}>
                  {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
                </span>
                <span className={styles.matchMeta}>Group {hTeam.group} · FT</span>
              </div>
              {sideBetDrinks > 0 && (
                <div className={styles.sideBetTag}>
                  💰 Side bet · +{sideBetDrinks} drink{sideBetDrinks > 1 ? 's' : ''}{m.sideBetDesc ? ` · ${m.sideBetDesc}` : ''}
                </div>
              )}

              <div className={styles.slots}>
                {isDraw && !vi?.filename && (
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} />
                )}
                {isDraw && !vi?.filename2 && (
                  <UploadSlot match={m} slot={2} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} />
                )}
                {m.hState === 'losing' && !vi?.filename && (
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} />
                )}
                {m.aState === 'losing' && !vi?.filename && (
                  <UploadSlot match={m} slot={1} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} />
                )}
              </div>
            </div>
          );
        })
      )}

      {tab === 'sidebets' && (
        upcomingOrLive.length === 0 ? (
          <div className={styles.empty}>No upcoming matches</div>
        ) : upcomingOrLive.map(m => (
          <SideBetCard key={m.id} match={m} />
        ))
      )}

      {tab === 'reupload' && (() => {
        const done = matches
          .filter(m => m.isFinished && videoMap[`${m.hCode}-${m.aCode}`]?.filename)
          .sort((a, b) => a.kickoff - b.kickoff);
        if (done.length === 0) return <div className={styles.empty}>No uploaded videos yet</div>;
        return done.map(m => {
          const vi = videoMap[`${m.hCode}-${m.aCode}`];
          const isDraw = m.hState === 'draw';
          const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️', full: m.hCode };
          const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️', full: m.aCode };
          const sideBetDrinks = m.sideBetDrinks || 0;
          const defaultDrinks = 1 + sideBetDrinks;
          return (
            <div key={m.id} className={styles.matchCard}>
              <div className={styles.matchHeader}>
                <span className={styles.matchScore}>
                  {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
                </span>
                <span className={styles.matchMeta}>Group {hTeam.group} · FT</span>
              </div>
              <div className={styles.slots}>
                {isDraw && (
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename} />
                )}
                {isDraw && vi?.filename2 && (
                  <UploadSlot match={m} slot={2} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename2} />
                )}
                {m.hState === 'losing' && (
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename} />
                )}
                {m.aState === 'losing' && (
                  <UploadSlot match={m} slot={1} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename} />
                )}
              </div>
            </div>
          );
        });
      })()}
    </div>
  );
}
