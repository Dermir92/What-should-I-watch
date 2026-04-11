// TVmaze API proxy — no API key required, free for commercial use
module.exports = async function handler(req, res) {
  const { tvpath, ...params } = req.query;

  if (!tvpath) return res.status(400).json({ error: 'tvpath required' });

  // Whitelist safe endpoints
  const ALLOWED = /^(shows(\/\d+(\/(episodes|cast|images))?)?|search\/shows|schedule)$/;
  if (!ALLOWED.test(tvpath)) {
    return res.status(403).json({ error: 'endpoint not permitted' });
  }

  try {
    const url = new URL(`https://api.tvmaze.com/${tvpath}`);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    const resp = await fetch(url.toString(), {
      headers: { 'User-Agent': 'WhatShouldIWatch/1.0' }
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `TVmaze ${resp.status}` });
    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=60');
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Failed to reach TVmaze' });
  }
};
