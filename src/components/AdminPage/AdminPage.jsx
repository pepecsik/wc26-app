import { useState } from 'react';
import styles from './AdminPage.module.css';
import { useMatches } from '../../hooks/useMatches';
import { useSheetData } from '../../hooks/useSheetData';
import { TEAM_MAP } from '../../data/teamMap';

const ADMIN_PASSWORD = import.meta.env.VITE_API_KEY;
const B2_FOLDER = '01_GROUP_STAGE';

function UploadSlot({ match, slot, playerName }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      // Get B2 upload URL + tick sheet checkbox
      const prepRes = await fetch('/.netlify/functions/prepare-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: match.hCode, away: match.aCode }),
      });
      const prep = await prepRes.json();
      if (prep.error) throw new Error(prep.error);

      const filename = slot === 1 ? prep.filename1 : prep.filename2;
      if (!filename) throw new Error('No filename returned from sheet');

      const b2Key = `${B2_FOLDER}/${filename}.mp4`;

      // Upload directly to B2 (with progress)
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.addEventListener('progress', e => {
          if (e.lengthComputable) setProgress(Math.round(e.loaded / e.total * 100));
        });
        xhr.addEventListener('load', () => {
          xhr.status < 300 ? resolve() : reject(new Error(`B2 ${xhr.status}: ${xhr.responseText.slice(0, 120)}`));
        });
        xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
        xhr.open('POST', prep.uploadUrl);
        xhr.setRequestHeader('Authorization', prep.uploadAuthToken);
        xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(b2Key));
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

  if (status === 'done') {
    return <div className={styles.slotDone}>✓ {uploadedFilename}.mp4</div>;
  }

  return (
    <div className={styles.slot}>
      <span className={styles.slotLabel}>{playerName}</span>
      <div className={styles.slotRow}>
        <input
          type="file"
          accept="video/*"
          onChange={e => setFile(e.target.files[0])}
          className={styles.fileInput}
        />
        <button
          onClick={handleUpload}
          disabled={!file || status === 'uploading'}
          className={styles.uploadBtn}
        >
          {status === 'uploading' ? `${progress}%` : 'Upload'}
        </button>
      </div>
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
          <div className={styles.gateTitle}>Admin</div>
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

  // Finished matches with at least one missing video
  const pending = matches
    .filter(m => m.isFinished)
    .filter(m => {
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      const isDraw = m.hState === 'draw';
      if (isDraw) return !vi?.filename || !vi?.filename2;
      if (m.hState === 'losing' || m.aState === 'losing') return !vi?.filename;
      return false;
    })
    .sort((a, b) => b.kickoff - a.kickoff);

  async function setupCors() {
    setCorsMsg('Setting up…');
    const res = await fetch('/.netlify/functions/setup-b2-cors');
    const data = await res.json();
    setCorsMsg(data.error ? `Error: ${data.error}` : '✓ CORS configured');
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
        const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️' };
        const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️' };

        return (
          <div key={m.id} className={styles.matchCard}>
            <div className={styles.matchTitle}>
              {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
            </div>

            {/* Draw: home player (slot 1) */}
            {isDraw && !vi?.filename && (
              <UploadSlot match={m} slot={1} playerName={m.hOwner?.name ?? m.hCode} />
            )}
            {/* Draw: away player (slot 2) */}
            {isDraw && !vi?.filename2 && (
              <UploadSlot match={m} slot={2} playerName={m.aOwner?.name ?? m.aCode} />
            )}
            {/* Non-draw: home losing */}
            {m.hState === 'losing' && !vi?.filename && (
              <UploadSlot match={m} slot={1} playerName={m.hOwner?.name ?? m.hCode} />
            )}
            {/* Non-draw: away losing */}
            {m.aState === 'losing' && !vi?.filename && (
              <UploadSlot match={m} slot={1} playerName={m.aOwner?.name ?? m.aCode} />
            )}
          </div>
        );
      })}
    </div>
  );
}
