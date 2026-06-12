import { useState, useEffect, useRef } from 'react';
import { API_NAME_TO_CODE } from '../data/teamMap';
import { TEAM_OWNER } from '../data/participants';

const API_KEY = import.meta.env.VITE_API_KEY;
const BASE    = 'https://v3.football.api-sports.io';

const LIVE_STATUSES   = new Set(['1H','HT','2H','ET','BT','P','LIVE']);
const FINISH_STATUSES = new Set(['FT','AET','PEN']);

const CACHE_KEY      = 'wc26_matches_v1';
const CACHE_TTL_MS   = 10 * 60_000;  // 10 min — reuse across page loads
const LIVE_POLL_MS   = 60_000;        // 1 min during live matches
const PRE_MATCH_MS   = 3 * 60_000;   // start watching 3 min before kickoff

function normalize(fixture) {
  const hRaw   = fixture.teams.home.name;
  const aRaw   = fixture.teams.away.name;
  const hCode  = API_NAME_TO_CODE[hRaw] ?? hRaw.slice(0,3).toUpperCase();
  const aCode  = API_NAME_TO_CODE[aRaw] ?? aRaw.slice(0,3).toUpperCase();
  const status = fixture.fixture.status.short;
  const hGoals = fixture.goals.home ?? null;
  const aGoals = fixture.goals.away ?? null;
  const kickoff = new Date(fixture.fixture.date);

  let hState = 'neutral', aState = 'neutral';
  if (hGoals !== null && aGoals !== null) {
    if (hGoals > aGoals)      { hState = 'winning'; aState = 'losing'; }
    else if (aGoals > hGoals) { aState = 'winning'; hState = 'losing'; }
    else                      { hState = 'draw';    aState = 'draw';   }
  }

  return {
    id: fixture.fixture.id,
    kickoff,
    status,
    isLive:     LIVE_STATUSES.has(status),
    isFinished: FINISH_STATUSES.has(status),
    elapsed:    fixture.fixture.status.elapsed,
    hCode, aCode, hGoals, aGoals, hState, aState,
    hOwner: TEAM_OWNER[hCode] ?? null,
    aOwner: TEAM_OWNER[aCode] ?? null,
  };
}

// Serialize/deserialize dates through localStorage
function saveCache(matches) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      ts: Date.now(),
      matches: matches.map(m => ({ ...m, kickoff: m.kickoff.toISOString() })),
    }));
  } catch {}
}

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, matches } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return matches.map(m => ({ ...m, kickoff: new Date(m.kickoff) }));
  } catch { return null; }
}

export function useMatches() {
  const [matches, setMatches] = useState(() => loadCache() ?? []);
  const [loading, setLoading] = useState(matches.length === 0);
  const [error, setError]     = useState(null);
  const timerRef = useRef(null);
  const matchesRef = useRef(matches);
  matchesRef.current = matches;

  function clearTimer() {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }

  // Full fetch of all group stage fixtures — use sparingly
  async function fetchAll() {
    try {
      const res = await fetch(`${BASE}/fixtures?league=1&season=2026`, {
        headers: { 'x-apisports-key': API_KEY },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0)
        throw new Error(JSON.stringify(data.errors));
      const normalized = (data.response || []).map(normalize);
      normalized.sort((a, b) => a.kickoff - b.kickoff);
      saveCache(normalized);
      setMatches(normalized);
      setError(null);
      return normalized;
    } catch (e) {
      setError(e.message);
      return matchesRef.current;
    } finally {
      setLoading(false);
    }
  }

  // Lightweight live-only fetch — merges updated live fixtures into existing list
  async function fetchLive() {
    try {
      const res = await fetch(`${BASE}/fixtures?live=all&league=1`, {
        headers: { 'x-apisports-key': API_KEY },
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const liveNorm = (data.response || []).map(normalize);

      const updated = matchesRef.current.map(m => {
        const live = liveNorm.find(l => l.id === m.id);
        return live ?? m;
      });
      setMatches(updated);
      setError(null);
      return updated;
    } catch (e) {
      setError(e.message);
      return matchesRef.current;
    }
  }

  function schedule(current) {
    clearTimer();
    const now = Date.now();
    const hasLive = current.some(m => m.isLive);

    if (hasLive) {
      // Poll live endpoint every 60s
      timerRef.current = setTimeout(async () => {
        const updated = await fetchLive();
        const stillLive = updated.some(m => m.isLive);
        if (!stillLive) {
          // Match just ended — do one full refresh then reschedule
          const full = await fetchAll();
          schedule(full);
        } else {
          schedule(updated);
        }
      }, LIVE_POLL_MS);
      return;
    }

    // Find the soonest upcoming match
    const upcoming = current
      .filter(m => !m.isFinished && !m.isLive)
      .sort((a, b) => a.kickoff - b.kickoff);

    if (upcoming.length === 0) return; // All done, no more polling needed

    const nextKickoff = upcoming[0].kickoff.getTime();
    const msUntilNext = nextKickoff - now - PRE_MATCH_MS;

    if (msUntilNext <= 0) {
      // Match starting very soon — poll now
      timerRef.current = setTimeout(async () => {
        const full = await fetchAll();
        schedule(full);
      }, LIVE_POLL_MS);
    } else {
      // Sleep until 3 min before the next kickoff, then wake up with full fetch
      timerRef.current = setTimeout(async () => {
        const full = await fetchAll();
        schedule(full);
      }, msUntilNext);
    }
  }

  useEffect(() => {
    const cached = loadCache();
    if (cached) {
      // Use cache, but still schedule smart polling
      schedule(cached);
    } else {
      fetchAll().then(schedule);
    }
    return clearTimer;
  }, []);

  return { matches, loading, error };
}
