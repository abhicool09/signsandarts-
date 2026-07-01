// TEMPORARY diagnostic: tests Twilio WhatsApp + reports exact error. Delete after.
module.exports = async (req, res) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TO;
  if (!sid || !token || !from || !to) {
    return res.status(200).json({ ok: false, error: 'env vars missing', present: { sid: !!sid, token: !!token, from: !!from, to: !!to } });
  }
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const body = new URLSearchParams({ From: from, To: to, Body: 'Signs and Arts test alert — checking Twilio.' }).toString();
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    return res.status(200).json({
      http: r.status,
      twilio_status: data.status || null,
      error_code: data.code || null,
      error_message: data.message || null,
      more_info: data.more_info || null,
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
};
