const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  // CORS für Frontend-Zugriff erlauben
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight Request handhaben
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    // licenses.json aus demselben Verzeichnis lesen
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    let licenses = [];
    
    try {
      const data = await fs.readFile(licensesPath, 'utf8');
      licenses = JSON.parse(data);
    } catch (error) {
      // Datei existiert nicht oder ist leer
      return res.status(200).json({ hasAccess: false });
    }

    // Aktive Lizenz für die E-Mail suchen
    const activeLicense = licenses.find(
      license => license.email === email && license.status === 'active'
    );

    return res.status(200).json({ 
      hasAccess: !!activeLicense,
      license_id: activeLicense ? activeLicense.license_id : null
    });
  } catch (error) {
    console.error('Error verifying license:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
