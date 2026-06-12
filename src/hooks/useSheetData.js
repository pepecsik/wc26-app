import { useState, useEffect } from 'react';

// Replace with your published Google Sheet CSV URL once you publish it
// File → Share → Publish to web → Sheet "Matches" → CSV → copy URL
const SHEET_CSV_URL = import.meta.env.VITE_SHEET_CSV_URL || '';

// RFC 4180-compliant CSV parser — handles quoted fields with embedded newlines/commas
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
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

// Returns map: "HCODE-ACODE" → { driveFileId, filename }
export function useSheetData() {
  const [videoMap, setVideoMap] = useState({});

  async function fetchSheet() {
    if (!SHEET_CSV_URL) return;
    try {
      const res  = await fetch(SHEET_CSV_URL);
      const text = await res.text();
      const rows = parseCSV(text);
      const map  = {};
      rows.forEach(row => {
        const home = row['Home'] || row['D'] || '';
        const away = row['Away'] || row['E'] || '';
        const fileId = row['Drive File ID'] || row['P'] || '';
        const filename = row['Generated Filename'] || row['O'] || '';
        if (home && away) {
          map[`${home}-${away}`] = { driveFileId: fileId, filename };
        }
      });
      setVideoMap(map);
    } catch (e) {
      console.warn('Sheet fetch failed:', e.message);
    }
  }

  useEffect(() => {
    fetchSheet();
    const interval = setInterval(fetchSheet, 5 * 60_000);
    return () => clearInterval(interval);
  }, []);

  return videoMap;
}
