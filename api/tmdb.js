module.exports = async function handler(req, res) {
  const { endpoint, ...params } = req.query;

  if (!endpoint) {
    return res.status(400).json({ error: 'endpoint required' });
  }

  const TMDB_KEY = process.env.TMDB_API_KEY;
  if (!TMDB_KEY) {
    return res.status(500).json({ error: 'TMDB_API_KEY not configured' });
  }

  // Whitelist allowed endpoint patterns
  const ALLOWED = /^(discover\/(movie|tv)|search\/(movie|tv|multi)|trending\/(movie|tv|all)\/(day|week)|(movie|tv)\/(popular|top_rated|upcoming)|(movie|tv)\/\d+(\/(videos|similar|recommendations|watch\/providers|credits))?)$/;
  if (!ALLOWED.test(endpoint)) {
    return res.status(403).json({ error: 'endpoint not permitted' });
  }

  try {
    const url = new URL(`https://api.themoviedb.org/3/${endpoint}`);
    url.searchParams.set('api_key', TMDB_KEY);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }

    const resp = await fetch(url.toString());
    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.status_message || 'TMDB error' });
    }

    // Cache detail pages longer than list pages
    const isDetail = /^\w+\/\d+$/.test(endpoint);
    res.setHeader('Cache-Control', `s-maxage=${isDetail ? 86400 : 3600}, stale-while-revalidate=60`);
    return res.json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Failed to reach TMDB' });
  }
};
