import { useState, useEffect } from 'react';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSRI1K-R_Q8O-WtXpqkAkdn9gyQzKFANWd_RI8jzco0g_1AH9rwXO0wKkU5Z7UQrH9ycBGOrkbOgY2t/pub?gid=364579506&single=true&output=csv';

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

// Returns map: "HCODE-ACODE" → { filename, filename2 }
// filename2 is only set for draws with two different drinkers
export function useSheetData() {
  const [videoMap, setVideoMap] = useState({});

  async function fetchSheet() {
    try {
      const res  = await fetch(SHEET_CSV_URL);
      const text = await res.text();
      const rows = parseCSV(text);
      const map  = {};
      rows.forEach(row => {
        const home      = row['Home'] || '';
        const away      = row['Away'] || '';
        const filename  = row['Generated Filename'] || '';
        const filename2 = row['Generated Filename 2'] || '';
        if (home && away) {
          map[`${home}-${away}`] = { filename, filename2 };
        }
      });
      setVideoMap(map);
    } catch (e) {
      console.warn('Sheet fetch failed:', e.message);
    }
  }

  useEffect(() => {
    fetchSheet();
    const interval = setInterval(fetchSheet, 60_000);
    return () => clearInterval(interval);
  }, []);

  return videoMap;
}
