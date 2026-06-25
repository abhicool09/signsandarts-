// TEMPORARY: tests the new-order WhatsApp alert via Twilio. Delete after testing.
module.exports = async (req, res) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = process.env.TWILIO_WHATSAPP_TO;

  if (!sid || !token || !from || !to) {
    return res.status(200).json({
      ok: false,
      error: 'Twilio env vars not all set (or not redeployed yet)',
      present: { TWILIO_ACCOUNT_SID: !!sid, TWILIO_AUTH_TOKEN: !!token, TWILIO_WHATSAPP_FROM: !!from, TWILIO_WHATSAPP_TO: !!to },
    });
  }

  const text =
    'NEW ORDER - Signs and Arts (TEST)\n' +
    'Order ID: SA-TEST-123\n' +
    'Amount: Online - Rs 2789 paid\n' +
    'Name: Test Customer\n' +
    'Phone: 9392878946\n' +
    'Items: Medical & Pharmacy LED Sign Board 18x18';

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString('base64');
    const body = new URLSearchParams({ From: from, To: to, Body: text }).toString();
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await r.json();
    return res.status(200).json({
      ok: r.ok,
      twilio_status: data.status || null,
      message_sid: data.sid || null,
      error: data.message || null,
      error_code: data.code || null,
      hint: r.ok ? 'Check your WhatsApp — the alert should arrive in a few seconds.' : 'See error above.',
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
};
