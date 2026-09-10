// Simple key-value storage proxy.
// The real storage lives in a Google Sheet, accessed through a Google Apps
// Script "Web App" that is bound to that sheet (see apps-script-code.gs.txt).
// This avoids needing a Google Cloud service account / key entirely.
//
// Reads one env var: APPS_SCRIPT_URL (the "/exec" URL you get after deploying
// the Apps Script as a Web App).

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const baseUrl = process.env.APPS_SCRIPT_URL;
  if (!baseUrl) {
    res.status(500).json({ error: 'Missing APPS_SCRIPT_URL environment variable' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key) { res.status(400).json({ error: 'missing key' }); return; }
      const url = baseUrl + '?key=' + encodeURIComponent(key);
      const r = await fetch(url, { redirect: 'follow' });
      const data = await r.json();
      res.status(200).json(data);
      return;
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
      const r = await fetch(baseUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body || {}),
      });
      const data = await r.json();
      res.status(200).json(data);
      return;
    }

    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
