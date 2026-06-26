import { useState } from 'react';
import styles from './AdminPage.module.css';
import { useMatches } from '../../hooks/useMatches';
import { useSheetData } from '../../hooks/useSheetData';
import { useTeamOwners } from '../../hooks/useTeamOwners';
import { useKOVideos } from '../../hooks/useKOVideos';
import { TEAM_MAP } from '../../data/teamMap';

const ADMIN_PASSWORD = import.meta.env.VITE_API_KEY;

const DRINK_EMOJIS = ['🍺','🍻','🍾','🥂','🍷','🥃','🍸','🍹','🧃'];

const ROUNDS = [
  { id: 'groups', label: 'Group Stage', folder: '01_GROUP_STAGE' },
  { id: 'r32',    label: 'R32',         folder: '02_R32' },
  { id: 'r16',    label: 'R16',         folder: '03_R16' },
  { id: 'qf',     label: 'QF',          folder: '04_QF' },
  { id: 'sf',     label: 'SF · Final',  folder: '05_SF_FINAL' },
];

const KO_ROUNDS = new Set(['R32', 'R16', 'QF', 'SF', '3P', 'FIN']);

const ROUND_MATCH_FILTER = {
  groups: m => !KO_ROUNDS.has(m.round),
  r32:    m => m.round === 'R32',
  r16:    m => m.round === 'R16',
  qf:     m => m.round === 'QF',
  sf:     m => m.round === 'SF' || m.round === 'FIN' || m.round === '3P',
};

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

function UploadSlot({ match, slot, participant, teamCode, teamFlag, defaultDrinks, currentFilename, folder }) {
  const isExtra = slot === 3 || slot === 4;
  const [file, setFile] = useState(null);
  const [redoDrink, setRedoDrink] = useState(0);
  const [bonusDrinks, setBonusDrinks] = useState(0);
  const [drinkCount, setDrinkCount] = useState(defaultDrinks ?? 1);
  const [drinkEmojis, setDrinkEmojis] = useState(['🍺']);
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
        body: JSON.stringify({ home: match.hCode, away: match.aCode, slot, drinkCount: isExtra ? redoDrink + bonusDrinks : drinkCount, emoji: drinkEmojis.join('') }),
      });
      const prep = await prepRes.json();
      if (prep.error) throw new Error(prep.error);

      const filename = slot === 1 ? prep.filename1 : slot === 2 ? prep.filename2 : slot === 3 ? prep.filename3 : prep.filename4;
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
        xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(`${folder}/${filename}.mp4`));
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
          <div className={styles.slotControlsRow}>
            {isExtra ? (
              <>
                <select value={redoDrink} onChange={e => setRedoDrink(Number(e.target.value))} className={styles.drinkSelect} title="Redo drink">
                  {[0,1].map(n => <option key={n} value={n}>🔄{n}</option>)}
                </select>
                <select value={bonusDrinks} onChange={e => setBonusDrinks(Number(e.target.value))} className={styles.drinkSelect} title="Bonus drinks">
                  {[0,1,2,3,4,5].map(n => <option key={n} value={n}>🍺+{n}</option>)}
                </select>
              </>
            ) : (
              <select value={drinkCount} onChange={e => setDrinkCount(Number(e.target.value))} className={styles.drinkSelect} title="Drinks">
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>🍺×{n}</option>
                ))}
              </select>
            )}
            <label className={styles.fileLabel}>
              {file ? file.name.slice(0, 20) + (file.name.length > 20 ? '…' : '') : 'Choose video'}
              <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} className={styles.fileInput} />
            </label>
            <button onClick={handleUpload} disabled={!file || status === 'uploading'} className={styles.uploadBtn}>
              {status === 'uploading' ? `${progress}%` : '⬆'}
            </button>
          </div>
          <div className={styles.emojiPickerWrap}>
            {Array.from({ length: isExtra ? (redoDrink + bonusDrinks) || 1 : drinkCount }).map((_, i) => (
              <div key={i} className={styles.emojiSlot}>
                <span className={styles.emojiSlotLabel}>drink {i + 1}</span>
                <div className={styles.emojiOptions}>
                  {DRINK_EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      className={`${styles.emojiBtn} ${(drinkEmojis[i] ?? '🍺') === e ? styles.emojiBtnActive : ''}`}
                      onClick={() => setDrinkEmojis(prev => { const next = [...prev]; next[i] = e; return next; })}
                    >{e}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
  const [betEmojis, setBetEmojis] = useState(() => {
    if (match.sideBetEmoji) return [...match.sideBetEmoji];
    return ['🍺'];
  });
  const [status, setStatus] = useState('idle');

  const betDrinkCount = drinks === 0.5 ? 1 : Math.ceil(drinks);

  async function saveSideBet() {
    setStatus('saving');
    try {
      const res = await fetch('/.netlify/functions/save-sidebet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: match.hCode, away: match.aCode, sideBetDrinks: drinks, sideBetDesc: desc, sideBetEmoji: betEmojis.join('') }),
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
        <div className={styles.emojiPickerWrap}>
          {Array.from({ length: betDrinkCount }).map((_, i) => (
            <div key={i} className={styles.emojiSlot}>
              <span className={styles.emojiSlotLabel}>{drinks === 0.5 ? 'pint +½' : `drink ${i + 1}`}</span>
              <div className={styles.emojiOptions}>
                {DRINK_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    className={`${styles.emojiBtn} ${(betEmojis[i] ?? '🍺') === e ? styles.emojiBtnActive : ''}`}
                    onClick={() => setBetEmojis(prev => { const next = [...prev]; next[i] = e; return next; })}
                  >{e}</button>
                ))}
              </div>
            </div>
          ))}
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

function ExtraVideoSection({ match, participant, teamCode, teamFlag, slot, existingFilename, folder }) {
  const [show, setShow] = useState(false);
  if (existingFilename) {
    return <UploadSlot match={match} slot={slot} participant={participant} teamCode={teamCode} teamFlag={teamFlag} defaultDrinks={1} currentFilename={existingFilename} folder={folder} />;
  }
  if (!show) {
    return <button className={styles.extraVideoBtn} onClick={() => setShow(true)}>+ Add extra video for {participant?.name ?? teamCode}</button>;
  }
  return <UploadSlot match={match} slot={slot} participant={participant} teamCode={teamCode} teamFlag={teamFlag} defaultDrinks={1} folder={folder} />;
}

function ReuploadCard({ match: m, vi, folder }) {
  const isDraw = m.hState === 'draw';
  const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️', full: m.hCode };
  const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️', full: m.aCode };
  const sideBetDrinks = m.sideBetDrinks || 0;
  const defaultDrinks = 1 + sideBetDrinks;
  const loser = m.hState === 'losing' ? { owner: m.hOwner, code: m.hCode, flag: hTeam.flag }
              : m.aState === 'losing' ? { owner: m.aOwner, code: m.aCode, flag: aTeam.flag }
              : null;

  return (
    <div className={styles.matchCard}>
      <div className={styles.matchHeader}>
        <span className={styles.matchScore}>
          {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
        </span>
        <span className={styles.matchMeta}>Group {hTeam.group} · FT</span>
      </div>
      <div className={styles.slots}>
        {isDraw && <>
          <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename} folder={folder} />
          {vi?.filename2 && <UploadSlot match={m} slot={2} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} currentFilename={vi.filename2} folder={folder} />}
          <ExtraVideoSection match={m} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} slot={3} existingFilename={vi?.filename3} folder={folder} />
          {vi?.filename2 && <ExtraVideoSection match={m} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} slot={4} existingFilename={vi?.filename4} folder={folder} />}
        </>}
        {loser && <>
          <UploadSlot match={m} slot={1} participant={loser.owner} teamCode={loser.code} teamFlag={loser.flag} defaultDrinks={defaultDrinks} currentFilename={vi?.filename} folder={folder} />
          <ExtraVideoSection match={m} participant={loser.owner} teamCode={loser.code} teamFlag={loser.flag} slot={3} existingFilename={vi?.filename3} folder={folder} />
        </>}
      </div>
    </div>
  );
}

function KOUploadSlot({ match, owner, loserCode, folder }) {
  const loserTeam = TEAM_MAP[loserCode] ?? { flag: '🏳️' };
  const [file, setFile]             = useState(null);
  const [drinkCount, setDrinkCount] = useState(1);
  const [drinkEmojis, setDrinkEmojis] = useState(['🍺']);
  const [status, setStatus]         = useState('idle');
  const [progress, setProgress]     = useState(0);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');

  async function handleUpload() {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    setErrorMsg('');
    try {
      const prepRes = await fetch('/.netlify/functions/prepare-ko-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: match.hCode, away: match.aCode, ownerName: owner.name, drinkCount, emoji: drinkEmojis.join('') }),
      });
      const prep = await prepRes.json();
      if (prep.error) throw new Error(prep.error);

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
        xhr.setRequestHeader('X-Bz-File-Name', encodeURIComponent(`${folder}/${prep.filename}.mp4`));
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.setRequestHeader('X-Bz-Content-Sha1', 'do_not_verify');
        xhr.send(file);
      });

      setUploadedFilename(prep.filename);
      setStatus('done');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className={`${styles.slot} ${status === 'done' ? styles.slotDone : ''}`}>
      <div className={styles.slotPlayer}>
        <Avatar participant={owner} teamCode={loserCode} />
        <div className={styles.slotInfo}>
          <span className={styles.slotFlag}>{loserTeam.flag}</span>
          <span className={styles.slotName}>{owner.name}</span>
          {status === 'done' && <span className={styles.doneTag}>✓ uploaded</span>}
        </div>
      </div>
      {status !== 'done' && (
        <div className={styles.slotControls}>
          <div className={styles.slotControlsRow}>
            <select value={drinkCount} onChange={e => setDrinkCount(Number(e.target.value))} className={styles.drinkSelect}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>🍺×{n}</option>)}
            </select>
            <label className={styles.fileLabel}>
              {file ? file.name.slice(0, 20) + (file.name.length > 20 ? '…' : '') : 'Choose video'}
              <input type="file" accept="video/*" onChange={e => setFile(e.target.files[0])} className={styles.fileInput} />
            </label>
            <button onClick={handleUpload} disabled={!file || status === 'uploading'} className={styles.uploadBtn}>
              {status === 'uploading' ? `${progress}%` : '⬆'}
            </button>
          </div>
          <div className={styles.emojiPickerWrap}>
            {Array.from({ length: drinkCount }).map((_, i) => (
              <div key={i} className={styles.emojiSlot}>
                <span className={styles.emojiSlotLabel}>drink {i + 1}</span>
                <div className={styles.emojiOptions}>
                  {DRINK_EMOJIS.map(e => (
                    <button key={e} type="button"
                      className={`${styles.emojiBtn} ${(drinkEmojis[i] ?? '🍺') === e ? styles.emojiBtnActive : ''}`}
                      onClick={() => setDrinkEmojis(prev => { const next = [...prev]; next[i] = e; return next; })}
                    >{e}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {status === 'done' && <div className={styles.doneName}>{uploadedFilename}.mp4</div>}
      {status === 'error' && <div className={styles.slotError}>{errorMsg}</div>}
    </div>
  );
}

function KOPendingCard({ match: m, loserCode, pendingOwners, folder }) {
  const hTeam = TEAM_MAP[m.hCode] ?? { flag: '🏳️', full: m.hCode };
  const aTeam = TEAM_MAP[m.aCode] ?? { flag: '🏳️', full: m.aCode };
  const loserTeam = TEAM_MAP[loserCode] ?? { flag: '🏳️' };
  return (
    <div className={styles.matchCard}>
      <div className={styles.matchHeader}>
        <span className={styles.matchScore}>
          {hTeam.flag} {m.hCode} {m.hGoals}–{m.aGoals} {m.aCode} {aTeam.flag}
        </span>
        <span className={styles.matchMeta}>{m.round} · FT · {loserTeam.flag} loses</span>
      </div>
      {m.sideBetDrinks > 0 && (
        <div className={styles.sideBetTag}>
          💰 Side bet · +{m.sideBetDrinks} drink{m.sideBetDrinks > 1 ? 's' : ''}{m.sideBetDesc ? ` · ${m.sideBetDesc}` : ''}
        </div>
      )}
      <div className={styles.slots}>
        {pendingOwners.map(owner => (
          <KOUploadSlot key={owner.name} match={m} owner={owner} loserCode={loserCode} folder={folder} />
        ))}
      </div>
    </div>
  );
}

// Teams tab uses 'Participant' and 'Team 1' … 'Team 8' (with spaces)
const REDRAW_SLOTS = [
  { slot: 3, label: 'R32' },
  { slot: 4, label: 'R16' },
  { slot: 5, label: 'QF'  },
  { slot: 6, label: 'SF'  },
  { slot: 7, label: 'SF2' },
  { slot: 8, label: '+1'  },
];

function PlayerReDrawRow({ row }) {
  const playerName = (row['Participant'] || '').trim();

  const initVals = Object.fromEntries(
    REDRAW_SLOTS.map(({ slot }) => [slot, (row[`Team ${slot}`] || '').trim().toUpperCase()])
  );
  const [vals, setVals] = useState(initVals);
  const [status, setStatus] = useState('idle');

  async function save() {
    const slots = REDRAW_SLOTS
      .map(({ slot }) => ({ slot, teamCode: vals[slot] }))
      .filter(({ slot, teamCode }) => teamCode !== initVals[slot]);

    if (slots.length === 0) return;
    setStatus('saving');
    try {
      for (const { slot, teamCode } of slots) {
        const res = await fetch('/.netlify/functions/save-redraw', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: playerName, slot, teamCode }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setStatus('done');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (err) {
      setStatus('error');
      alert(err.message);
    }
  }

  const t1 = TEAM_MAP[row['Team 1']] ?? { flag: '🏳️' };
  const t2 = TEAM_MAP[row['Team 2']] ?? { flag: '🏳️' };

  return (
    <div className={styles.reDrawRow}>
      <div className={styles.reDrawPlayer}>
        <span className={styles.reDrawName}>{playerName}</span>
        <span className={styles.reDrawOG}>{t1.flag} {row['Team 1']} · {t2.flag} {row['Team 2']}</span>
      </div>
      <div className={styles.reDrawSlots}>
        {REDRAW_SLOTS.map(({ slot, label }) => (
          <input
            key={slot}
            className={styles.teamInput}
            placeholder={label}
            value={vals[slot]}
            maxLength={3}
            onChange={e => setVals(prev => ({ ...prev, [slot]: e.target.value.toUpperCase() }))}
          />
        ))}
        <button
          className={`${styles.saveRowBtn} ${status === 'done' ? styles.saveRowDone : ''}`}
          onClick={save}
          disabled={status === 'saving'}
        >
          {status === 'saving' ? '…' : status === 'done' ? '✓' : 'Save'}
        </button>
      </div>
    </div>
  );
}

const TEAM_COLS = ['Team 1', 'Team 2', 'Team 3', 'Team 4', 'Team 5', 'Team 6', 'Team 7', 'Team 8'];

function ReDrawPanel({ matches }) {
  const { rows } = useTeamOwners();

  if (rows.length === 0) {
    return (
      <div className={styles.notPublished}>
        <p>Teams tab not published yet.</p>
        <p>In Google Sheets: <strong>File → Share → Publish to web</strong> → select <strong>Teams</strong> sheet → <strong>CSV</strong> → Publish.</p>
        <p>Then add columns <strong>Team3</strong>, <strong>Team4</strong>, <strong>Team5</strong> (headers in row 1).</p>
      </div>
    );
  }

  const koMatches = matches.filter(m => KO_ROUNDS.has(m.round));

  if (koMatches.length === 0) {
    return <div className={styles.empty}>Redraws happen after the group stage — no KO matches scheduled yet.</div>;
  }

  // Build the set of all KO teams and which ones are eliminated
  const allKOTeams = new Set(koMatches.flatMap(m => [m.hCode, m.aCode]));
  const eliminatedTeams = new Set();
  koMatches.forEach(m => {
    if (!m.isFinished) return;
    if (m.hState === 'losing') eliminatedTeams.add(m.hCode);
    if (m.aState === 'losing') eliminatedTeams.add(m.aCode);
  });

  // A team is active if it appears in any KO match AND hasn't lost one
  function isTeamActive(code) {
    if (!code) return false;
    const c = code.trim().toUpperCase();
    return allKOTeams.has(c) && !eliminatedTeams.has(c);
  }

  // Only show players who have no active team remaining
  const reDrawRows = rows.filter(row => {
    const teams = TEAM_COLS.map(col => (row[col] || '').trim().toUpperCase()).filter(Boolean);
    return teams.length > 0 && !teams.some(isTeamActive);
  });

  if (reDrawRows.length === 0) {
    return <div className={styles.empty}>No redraws needed — all players still have an active team 🎉</div>;
  }

  return (
    <div className={styles.reDrawList}>
      <div className={styles.reDrawHeader}>
        <span className={styles.reDrawCol}>Player</span>
        <span className={styles.reDrawColRight}>R32 · R16 · QF redraw codes</span>
      </div>
      {reDrawRows.map(row => <PlayerReDrawRow key={row['Participant']} row={row} />)}
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [corsMsg, setCorsMsg] = useState('');
  const [tab, setTab] = useState('uploads');
  const [round, setRound] = useState(() => localStorage.getItem('wc26-admin-round') || 'groups');
  const { matches: rawMatches } = useMatches();
  const { videoMap } = useSheetData();
  const { ownerMap } = useTeamOwners();
  const { koVideos } = useKOVideos();

  // Apply co-owner merge (same as App.jsx)
  const matches = rawMatches.map(m => {
    const hExtra = ownerMap[m.hCode] || [];
    const aExtra = ownerMap[m.aCode] || [];
    return {
      ...m,
      hOwner: m.hOwner ?? hExtra[0] ?? null,
      aOwner: m.aOwner ?? aExtra[0] ?? null,
      hCoOwners: hExtra.filter(p => p.name !== m.hOwner?.name),
      aCoOwners: aExtra.filter(p => p.name !== m.aOwner?.name),
    };
  });

  const folder = ROUNDS.find(r => r.id === round)?.folder ?? '01_GROUP_STAGE';

  function changeRound(id) {
    setRound(id);
    localStorage.setItem('wc26-admin-round', id);
    if (id === 'groups' && tab === 'redraw') setTab('uploads');
  }

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

  // Group stage pending (only shown when round === 'groups')
  const pending = matches
    .filter(m => m.isFinished && !KO_ROUNDS.has(m.round))
    .filter(m => {
      const vi = videoMap[`${m.hCode}-${m.aCode}`];
      if (m.hState === 'draw') return !vi?.filename || !vi?.filename2;
      if (m.hState === 'losing' || m.aState === 'losing') return !vi?.filename;
      return false;
    })
    .sort((a, b) => a.kickoff - b.kickoff);

  // KO pending — per match, each loser owner who hasn't uploaded yet
  const koPending = matches
    .filter(m => m.isFinished && KO_ROUNDS.has(m.round) && (ROUND_MATCH_FILTER[round]?.(m)))
    .map(m => {
      const isLosingH = m.hState === 'losing';
      const isLosingA = m.aState === 'losing';
      if (!isLosingH && !isLosingA) return null;
      const loserCode   = isLosingH ? m.hCode : m.aCode;
      const loserOwners = isLosingH
        ? [m.hOwner, ...(m.hCoOwners || [])].filter(Boolean)
        : [m.aOwner, ...(m.aCoOwners || [])].filter(Boolean);
      const kv = koVideos[`${m.hCode}-${m.aCode}`] || {};
      const pendingOwners = loserOwners.filter(o => !kv[o.name]);
      if (pendingOwners.length === 0) return null;
      return { match: m, loserCode, pendingOwners };
    })
    .filter(Boolean)
    .sort((a, b) => a.match.kickoff - b.match.kickoff);

  const upcomingOrLive = matches
    .filter(m => !m.isFinished && (ROUND_MATCH_FILTER[round]?.(m)))
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

      {/* Round selector — controls which B2 folder videos go into */}
      <div className={styles.roundSelector}>
        {ROUNDS.map(r => (
          <button
            key={r.id}
            className={`${styles.roundPill} ${round === r.id ? styles.roundPillActive : ''}`}
            onClick={() => changeRound(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'uploads' ? styles.tabActive : ''}`}
          onClick={() => setTab('uploads')}
        >
          🎬 Upload {(pending.length + koPending.length) > 0 && <span className={styles.tabBadge}>{pending.length + koPending.length}</span>}
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
        {round !== 'groups' && (
          <button
            className={`${styles.tab} ${tab === 'redraw' ? styles.tabActive : ''}`}
            onClick={() => setTab('redraw')}
          >
            🔀 Redraw
          </button>
        )}
      </div>

      {tab === 'uploads' && round === 'groups' && (
        pending.length === 0 ? (
          <div className={styles.empty}>All group stage videos uploaded 🎉</div>
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
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} folder={folder} />
                )}
                {isDraw && !vi?.filename2 && (
                  <UploadSlot match={m} slot={2} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} folder={folder} />
                )}
                {m.hState === 'losing' && !vi?.filename && (
                  <UploadSlot match={m} slot={1} participant={m.hOwner} teamCode={m.hCode} teamFlag={hTeam.flag} defaultDrinks={defaultDrinks} folder={folder} />
                )}
                {m.aState === 'losing' && !vi?.filename && (
                  <UploadSlot match={m} slot={1} participant={m.aOwner} teamCode={m.aCode} teamFlag={aTeam.flag} defaultDrinks={defaultDrinks} folder={folder} />
                )}
              </div>
            </div>
          );
        })
      )}

      {tab === 'uploads' && round !== 'groups' && (
        koPending.length === 0 ? (
          <div className={styles.empty}>All {ROUNDS.find(r => r.id === round)?.label} videos uploaded 🎉</div>
        ) : koPending.map(({ match: m, loserCode, pendingOwners }) => (
          <KOPendingCard key={`${m.hCode}-${m.aCode}`} match={m} loserCode={loserCode} pendingOwners={pendingOwners} folder={folder} />
        ))
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
          .filter(m => {
            if (!m.isFinished) return false;
            const vi = videoMap[`${m.hCode}-${m.aCode}`];
            if (!vi?.filename) return false;
            if (m.hState === 'draw') return !!vi?.filename2;
            return true;
          })
          .sort((a, b) => b.kickoff - a.kickoff);
        if (done.length === 0) return <div className={styles.empty}>No uploaded videos yet</div>;
        return done.map(m => <ReuploadCard key={m.id} match={m} vi={videoMap[`${m.hCode}-${m.aCode}`]} folder={folder} />);
      })()}

      {tab === 'redraw' && <ReDrawPanel matches={matches} />}
    </div>
  );
}
