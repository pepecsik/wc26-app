// Proxy for api-football — keeps API key server-side and lets Netlify CDN cache responses
// Cache-Control: public, max-age=60 means all 24 users share one cached response per minute

const BASE    = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;

export async function handler(event) {
  const endpoint = event.queryStringParameters?.endpoint ?? 'all';

  const url = endpoint === 'live'
    ? `${BASE}/fixtures?live=all&league=1`
    : `${BASE}/fixtures?league=1&season=2026`;

  try {
    const res  = await fetch(url, { headers: { 'x-apisports-key': API_KEY } });
    const data = await res.json();

    // 60s CDN cache for live, 10min for full list
    const maxAge = endpoint === 'live' ? 60 : 600;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
      },
      body: JSON.stringify(data),
    };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: e.message }) };
  }
}
