// Trakt.tv API proxy — confirmed free for commercial use (see email from Kevin @ Trakt)
module.exports = async function handler(req, res) {
  const TRAKT_KEY = process.env.TRAKT_CLIENT_ID;
  if (!TRAKT_KEY) {
    return res.status(500).json({ error: 'TRAKT_CLIENT_ID not configured in Vercel environment variables' });
  }

  const { traktpath, ...params } = req.query;
  if (!traktpath) return res.status(400).json({ error: 'traktpath required' });

  // Whitelist safe read-only endpoints
  const ALLOWED = /^(movies\/(popular|trending|watched\/weekly|anticipated)|movies\/[a-z0-9_-]+(\/(related|people))?|search\/movie)$/;
  if (!ALLOWED.test(traktpath)) {
    return res.status(403).json({ error: 'endpoint not permitted' });
  }

  try {
    const url = new URL(`https://api.trakt.tv/${traktpath}`);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

    const resp = await fetch(url.toString(), {
      headers: {
        'trakt-api-key': TRAKT_KEY,
        'trakt-api-version': '2',
        'Content-Type': 'application/json',
        'User-Agent': 'WhatShouldIWatch/1.0'
      }
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `Trakt ${resp.status}` });
    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=60');
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Failed to reach Trakt' });
  }
};
