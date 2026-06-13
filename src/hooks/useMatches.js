import { useState, useEffect, useRef } from 'react';
import { TEAM_OWNER } from '../data/participants';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRI1K-R_Q8O-WtXpqkAkdn9gyQzKFANWd_RI8jzco0g_1AH9rwXO0wKkU5Z7UQrH9ycBGOrkbOgY2t/pub?gid=364579506&single=true&output=csv';

const POLL_MS = 60_000; // poll sheet every 1 minute

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false, i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      field += ch; i++; continue;
    }
    if (ch === '"') { inQuotes = true; i++; continue; }
    if (ch === ',') { row.push(field.trim()); field = ''; i++; continue; }
    if (ch === '\n') {
      row.push(field.trim()); field = '';
      rows.push(row); row = []; i++;
      if (text[i] === '\r') i++;
      continue;
    }
    if (ch === '\r') { i++; continue; }
    field += ch; i++;
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.replace(/\n/g, ' ').trim());
  return rows.slice(1).map(vals => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    return obj;
  });
}

function rowToMatch(row, index) {
  const hCode = row['Home'] || '';
  const aCode = row['Away'] || '';
  if (!hCode || !aCode) return null;

  const scoreHome = row['Score Home'] !== '' ? Number(row['Score Home']) : null;
  const scoreAway = row['Score Away'] !== '' ? Number(row['Score Away']) : null;
  const hasScore  = scoreHome !== null && scoreAway !== null;

  // Use real kickoff time from col Q if available, fall back to date at noon
  const kickoffISO = row['Kickoff'] || '';
  let kickoff;
  if (kickoffISO) {
    kickoff = new Date(kickoffISO);
  } else {
    const dateRaw = String(row['Date'] || '');
    if (dateRaw.length === 6) {
      const year  = 2000 + parseInt(dateRaw.slice(0, 2));
      const month = parseInt(dateRaw.slice(2, 4)) - 1;
      const day   = parseInt(dateRaw.slice(4, 6));
      kickoff = new Date(year, month, day, 12, 0, 0);
    } else {
      kickoff = new Date(0);
    }
  }

  // Read status/elapsed from sheet if Apps Script writes them (cols Status / Elapsed)
  const statusCode  = row['Status']  || '';
  const elapsedRaw  = row['Elapsed'] !== '' ? Number(row['Elapsed']) : null;

  // Live status codes from api-football
  const LIVE_CODES = new Set(['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE']);
  const FT_CODES   = new Set(['FT', 'AET', 'PEN', 'AWD', 'WO']);

  let isLive, isFinished, elapsed;

  if (statusCode && (LIVE_CODES.has(statusCode) || FT_CODES.has(statusCode))) {
    // Apps Script is writing status — use it directly
    isLive     = LIVE_CODES.has(statusCode);
    isFinished = FT_CODES.has(statusCode);
    elapsed    = elapsedRaw;
  } else {
    // Fallback: infer from kickoff time
    // A match runs ~105 min (90 + stoppage). Give 150 min total window.
    const minSinceKickoff = (Date.now() - kickoff.getTime()) / 60_000;
    isLive     = hasScore && minSinceKickoff >= 0 && minSinceKickoff < 150;
    isFinished = hasScore && minSinceKickoff >= 150;
    elapsed    = isLive ? Math.min(90, Math.floor(minSinceKickoff)) : null;
  }

  let hState = 'neutral', aState = 'neutral';
  if (hasScore) {
    if (scoreHome > scoreAway)      { hState = 'winning'; aState = 'losing'; }
    else if (scoreAway > scoreHome) { aState = 'winning'; hState = 'losing'; }
    else                            { hState = 'draw';    aState = 'draw';   }
  }

  return {
    id: index + 1,
    kickoff,
    status: statusCode || (isFinished ? 'FT' : isLive ? 'LIVE' : 'NS'),
    isLive,
    isFinished,
    elapsed,
    hCode, aCode,
    hGoals: scoreHome,
    aGoals: scoreAway,
    hState, aState,
    hOwner: TEAM_OWNER[hCode] ?? null,
    aOwner: TEAM_OWNER[aCode] ?? null,
  };
}

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const intervalRef = useRef(null);

  async function fetchSheet() {
    try {
      const res  = await fetch(SHEET_CSV_URL);
      const text = await res.text();
      const rows = parseCSV(text);
      const normalized = rows
        .map((row, i) => rowToMatch(row, i))
        .filter(Boolean)
        .sort((a, b) => a.kickoff - b.kickoff);
      setMatches(normalized);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSheet();
    intervalRef.current = setInterval(fetchSheet, POLL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return { matches, loading, error };
}
