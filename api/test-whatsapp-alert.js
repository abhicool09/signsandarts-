const { getTwilioWhatsAppConfig, sendTwilioWhatsApp } = require('./_lib/whatsapp-alert');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const configuredToken = process.env.ORDER_RECOVERY_TOKEN;
  if (!configuredToken) {
    return res.status(500).json({ error: 'ORDER_RECOVERY_TOKEN is not configured' });
  }

  const suppliedToken = String(
    (req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token'])) ||
    (req.body && req.body.token) ||
    ''
  );
  if (suppliedToken !== configuredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const config = getTwilioWhatsAppConfig();
  if (!config.ok) {
    return res.status(500).json({ error: config.error });
  }

  try {
    const message = String(
      (req.body && req.body.message) ||
      `Test WhatsApp alert from Signs and Arts at ${new Date().toISOString()}`
    ).slice(0, 1200);
    const result = await sendTwilioWhatsApp(message);
    return res.status(200).json({
      success: true,
      sid: result.sid || null,
      status: result.status || null,
      to: config.config.to,
      from: config.config.from,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: error.message,
    });
  }
};
