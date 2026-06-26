import { useState, useEffect } from 'react';

// Create "KO Videos" tab in Google Sheets with headers: Match, Round, Owner, Filename, Drinks, Emoji
// Publish it: File → Share → Publish to web → KO Videos → CSV
// Replace YOUR_KO_VIDEOS_GID with the gid from the published URL
const KO_VIDEOS_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRI1K-R_Q8O-WtXpqkAkdn9gyQzKFANWd_RI8jzco0g_1AH9rwXO0wKkU5Z7UQrH9ycBGOrkbOgY2t/pub?gid=1034554509&single=true&output=csv';

const POLL_MS = 60_000;

export const ROUND_FOLDER = {
  R32: '02_R32',
  R16: '03_R16',
  QF:  '04_QF',
  SF:  '05_SF_FINAL',
  '3P':'05_SF_FINAL',
  FIN: '05_SF_FINAL',
};

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
  if (!csv || csv.includes('<!DOCTYPE html>')) return {};
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return {};
  const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const map = {};
  lines.slice(1).forEach(line => {
    const cols = parseCsvLine(line);
    const row  = Object.fromEntries(headers.map((h, i) => [h, (cols[i] ?? '').trim()]));
    const matchKey = row['Match'] || '';
    const owner    = row['Owner'] || '';
    if (!matchKey || !owner) return;
    if (!map[matchKey]) map[matchKey] = {};
    const round = row['Round'] || '';
    map[matchKey][owner] = {
      filename: row['Filename'] || '',
      round,
      folder:   ROUND_FOLDER[round] || '02_R32',
      drinks:   row['Drinks'] !== '' ? Number(row['Drinks']) : null,
      emoji:    row['Emoji'] || '',
    };
  });
  return map;
}

export function useKOVideos() {
  const [koVideos, setKOVideos] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      try {
        const res = await fetch(`${KO_VIDEOS_CSV_URL}&_=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok || cancelled) return;
        const text = await res.text();
        if (!cancelled) setKOVideos(parse(text));
      } catch { /* silently fall back to empty */ }
    }
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  return { koVideos };
}
