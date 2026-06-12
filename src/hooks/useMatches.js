import { useState, useEffect, useRef } from 'react';
import { API_NAME_TO_CODE } from '../data/teamMap';
import { TEAM_OWNER } from '../data/participants';

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE    = 'https://v3.football.api-sports.io';

const LIVE_STATUSES    = new Set(['1H','HT','2H','ET','BT','P','LIVE']);
const FINISH_STATUSES  = new Set(['FT','AET','PEN']);

function normalize(fixture) {
  const hRaw   = fixture.teams.home.name;
  const aRaw   = fixture.teams.away.name;
  const hCode  = API_NAME_TO_CODE[hRaw] ?? hRaw.slice(0,3).toUpperCase();
  const aCode  = API_NAME_TO_CODE[aRaw] ?? aRaw.slice(0,3).toUpperCase();
  const status = fixture.fixture.status.short;
  const hGoals = fixture.goals.home ?? null;
  const aGoals = fixture.goals.away ?? null;
  const kickoff = new Date(fixture.fixture.date);

  // determine outcome
  let hState = 'neutral', aState = 'neutral';
  if (hGoals !== null && aGoals !== null) {
    if (hGoals > aGoals)       { hState = 'winning'; aState = 'losing'; }
    else if (aGoals > hGoals)  { aState = 'winning'; hState = 'losing'; }
    else                       { hState = 'draw';    aState = 'draw';   }
  }

  return {
    id:       fixture.fixture.id,
    kickoff,
    status,
    isLive:     LIVE_STATUSES.has(status),
    isFinished: FINISH_STATUSES.has(status),
    elapsed:    fixture.fixture.status.elapsed,
    hCode, aCode,
    hGoals, aGoals,
    hState, aState,
    hOwner: TEAM_OWNER[hCode] ?? null,
    aOwner: TEAM_OWNER[aCode] ?? null,
  };
}

export function useMatches() {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const timerRef                = useRef(null);

  async function fetchMatches() {
    try {
      const res = await fetch(`${BASE}/fixtures?league=1&season=2026`, {
        headers: { 'x-apisports-key': API_KEY },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(JSON.stringify(data.errors));
      }
      const normalized = (data.response || []).map(normalize);
      normalized.sort((a, b) => a.kickoff - b.kickoff);
      setMatches(normalized);
      setError(null);
      return normalized;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  function scheduleNext(normalized) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const hasLive = normalized?.some(m => m.isLive);
    const interval = hasLive ? 60_000 : 5 * 60_000;
    timerRef.current = setTimeout(async () => {
      const next = await fetchMatches();
      scheduleNext(next);
    }, interval);
  }

  useEffect(() => {
    fetchMatches().then(scheduleNext);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  return { matches, loading, error, refetch: fetchMatches };
}
