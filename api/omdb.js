module.exports = async function handler(req, res) {
  const OMDB_KEY = process.env.OMDB_API_KEY;
  if (!OMDB_KEY) {
    return res.status(500).json({ Response: 'False', Error: 'OMDB_API_KEY not configured — add it to your Vercel environment variables' });
  }

  try {
    const url = new URL('https://www.omdbapi.com/');
    url.searchParams.set('apikey', OMDB_KEY);
    for (const [k, v] of Object.entries(req.query)) {
      url.searchParams.set(k, v);
    }
    const resp = await fetch(url.toString());
    const data = await resp.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=60');
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ Response: 'False', Error: 'Failed to reach OMDB' });
  }
};
