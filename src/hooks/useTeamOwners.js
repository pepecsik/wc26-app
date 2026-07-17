import { useState, useEffect } from 'react';
import { PARTICIPANTS } from '../data/participants';

// Teams tab: publish via File → Share → Publish to web → Teams sheet → CSV
// The gid appears in the sheet URL when the Teams tab is selected
const TEAMS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRI1K-R_Q8O-WtXpqkAkdn9gyQzKFANWd_RI8jzco0g_1AH9rwXO0wKkU5Z7UQrH9ycBGOrkbOgY2t/pub?gid=643357921&single=true&output=csv';

const POLL_MS = 5 * 60 * 1000;

// Sheet column name for participant, and redraw team columns (with spaces)
const PARTICIPANT_COL = 'Participant';
const REDRAW_COLS = ['Team 3', 'Team 4', 'Team 5', 'Team 6', 'Team 7', 'Team 8'];
const SLOT_TO_ROUND   = { 3: 'R32', 4: 'R16', 5: 'QF', 6: 'SF', 7: '3P', 8: 'FIN' };
const ROUNDS_IN_ORDER = ['R32', 'R16', 'QF', 'SF', '3P', 'FIN'];

const BY_NAME = Object.fromEntries(PARTICIPANTS.map(p => [p.name.trim(), p]));

function parseCsvLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

function parse(csv) {
  if (!csv || csv.includes('<!DOCTYPE html>')) return { ownerMap: {}, rows: [] };
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return { ownerMap: {}, rows: [] };

  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());

  const rows = lines.slice(1).map(line => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, (cols[i] ?? '').trim()]));
  });

  // Only map redraw columns (Team 3-8) — Team 1 & 2 already covered by participants.js
  // ownerMap: all slots merged (player modal, stats)
  // ownersByRound: CUMULATIVE — a Team 4 (R16) redraw carries forward into QF, SF, etc.
  //   so R32 cards only show Team 3 owners, but QF cards show Teams 3+4+5 owners.
  const ownerMap = {};
  const ownersByRound = Object.fromEntries(ROUNDS_IN_ORDER.map(r => [r, {}]));
  REDRAW_COLS.forEach((col, idx) => {
    const slot = idx + 3;
    const fromRound = SLOT_TO_ROUND[slot];
    const targetRounds = ROUNDS_IN_ORDER.slice(ROUNDS_IN_ORDER.indexOf(fromRound));
    rows.forEach(row => {
      const code = (row[col] || '').trim().toUpperCase();
      const p = BY_NAME[(row[PARTICIPANT_COL] || '').trim()];
      if (code && p) {
        if (!ownerMap[code]) ownerMap[code] = [];
        if (!ownerMap[code].find(x => x.name === p.name)) ownerMap[code].push(p);
        targetRounds.forEach(round => {
          if (!ownersByRound[round][code]) ownersByRound[round][code] = [];
          if (!ownersByRound[round][code].find(x => x.name === p.name)) ownersByRound[round][code].push(p);
        });
      }
    });
  });

  return { ownerMap, ownersByRound, rows };
}

export function useTeamOwners() {
  const [state, setState] = useState({ ownerMap: {}, ownersByRound: {}, rows: [] });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      try {
        const res = await fetch(TEAMS_CSV_URL, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const text = await res.text();
        if (!cancelled) setState(parse(text));
      } catch {
        // silently fall back to static participants.js data
      }
    }

    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return state;
}
