async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  return fetch(url, Object.assign({}, options, {
    signal: AbortSignal.timeout(timeoutMs),
  }));
}

function getTwilioWhatsAppConfig(env = process.env) {
  const config = {
    accountSid: env.TWILIO_ACCOUNT_SID,
    authToken: env.TWILIO_AUTH_TOKEN,
    from: env.TWILIO_WHATSAPP_FROM,
    to: env.TWILIO_WHATSAPP_TO,
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) {
    return {
      ok: false,
      error: `Missing Twilio WhatsApp env: ${missing.join(', ')}`,
      config,
    };
  }

  if (!String(config.from).startsWith('whatsapp:+')) {
    return {
      ok: false,
      error: 'TWILIO_WHATSAPP_FROM must look like whatsapp:+14155238886 or whatsapp:+91...',
      config,
    };
  }

  if (!String(config.to).startsWith('whatsapp:+')) {
    return {
      ok: false,
      error: 'TWILIO_WHATSAPP_TO must look like whatsapp:+91XXXXXXXXXX',
      config,
    };
  }

  return { ok: true, config };
}

async function sendTwilioWhatsApp(body, override = {}) {
  const result = getTwilioWhatsAppConfig();
  if (!result.ok) throw new Error(result.error);

  const config = Object.assign({}, result.config, override);
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  const response = await fetchWithTimeout(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: config.from,
        To: config.to,
        Body: body,
      }).toString(),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Twilio returned ${response.status}: ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
}

module.exports = {
  getTwilioWhatsAppConfig,
  sendTwilioWhatsApp,
};
