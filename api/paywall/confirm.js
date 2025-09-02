const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  // CORS für Frontend-Zugriff erlauben
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight Request handhaben
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    let licenses = [];
    
    // Existierende Lizenzen laden, falls vorhanden
    try {
      const data = await fs.readFile(licensesPath, 'utf8');
      licenses = JSON.parse(data);
    } catch (error) {
      // Datei existiert nicht - wird neu erstellt
    }

    // Prüfen, ob bereits eine aktive Lizenz existiert
    const existingLicense = licenses.find(
      license => license.email === email && license.status === 'active'
    );

    if (existingLicense) {
      return res.status(200).json({
        license_id: existingLicense.license_id,
        email: existingLicense.email
      });
    }

    // Neue Lizenz erstellen
    const newLicense = {
      license_id: generateLicenseId(),
      email: email,
      status: 'active',
      created_at: new Date().toISOString()
    };

    licenses.push(newLicense);
    
    // licenses.json speichern
    await fs.mkdir(path.dirname(licensesPath), { recursive: true });
    await fs.writeFile(licensesPath, JSON.stringify(licenses, null, 2));

    return res.status(200).json({
      license_id: newLicense.license_id,
      email: newLicense.email
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

function generateLicenseId() {
  return 'license_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}
