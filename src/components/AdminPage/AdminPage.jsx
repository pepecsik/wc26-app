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

function UploadSlot({ match, slot, participant, teamCode, teamFlag }) {
  const [file, setFile] = useState(null);
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
        body: JSON.stringify({ home: match.hCode, away: match.aCode }),
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

      {status === 'done' && (
        <div className={styles.doneName}>{uploadedFilename}.mp4</div>
      )}
      {status === 'error' && <div className={styles.slotError}>{errorMsg}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [corsMsg, setCorsMsg] = useState('');
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

  async function setupCors() {
    setCorsMsg('Setting up…');
    const res = await fetch('/.netlify/functions/setup-b2-cors');
    const data = await res.json();
    setCorsMsg(data.error ? `Error: ${data.error}` : '✓ Done');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <span className={styles.title}>Admin Upload</span>
        <button onClick={setupCors} className={styles.corsBtn}>
          {corsMsg || 'Setup B2 CORS'}
        </button>
      </div>

      {pending.length === 0 ? (
        <div className={styles.empty}>All videos uploaded 🎉</div>
      ) : pending.map(m => {
        const vi = videoMap[`${m.hCode}-${m.aCode}`];
        const isDraw = m.hState === 'draw';
        const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️', full: m.hCode };
        const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️', full: m.aCode };

        return (
          <div key={m.id} className={styles.matchCard}>
            <div className={styles.matchHeader}>
              <span className={styles.matchScore}>
                {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
              </span>
              <span className={styles.matchMeta}>Group {hTeam.group} · FT</span>
            </div>

            <div className={styles.slots}>
              {isDraw && !vi?.filename && (
                <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} />
              )}
              {isDraw && !vi?.filename2 && (
                <UploadSlot match={m} slot={2} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} />
              )}
              {m.hState === 'losing' && !vi?.filename && (
                <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} />
              )}
              {m.aState === 'losing' && !vi?.filename && (
                <UploadSlot match={m} slot={1} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
