// Customer order lookup: requires Order ID + phone (both must match) for privacy.
// Auto-enriches with live Shiprocket tracking (AWB, courier, status) when available.

async function getShiprocketTracking(shipmentId) {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password || !shipmentId) return null;
  try {
    const login = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const ld = await login.json();
    if (!ld.token) return null;
    const tr = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/shipment/${shipmentId}`, {
      headers: { Authorization: `Bearer ${ld.token}` },
    });
    const td = await tr.json();
    const data = td && td.tracking_data;
    if (!data) return null;
    const t = (data.shipment_track && data.shipment_track[0]) || {};
    return {
      awb: t.awb_code || '',
      courier: t.courier_name || '',
      status: t.current_status || data.shipment_status || '',
      track_url: data.track_url || (t.awb_code ? 'https://shiprocket.co/tracking/' + t.awb_code : ''),
    };
  } catch (e) {
    console.error('Shiprocket tracking failed:', e.message);
    return null;
  }
}

function mapShiprocketStatus(s) {
  s = String(s || '').toUpperCase();
  if (!s) return null;
  if (s.includes('DELIVERED')) return 'Delivered';
  if (s.includes('CANCEL') || s.includes('RTO')) return 'Cancelled';
  if (s.includes('TRANSIT') || s.includes('SHIPPED') || s.includes('OUT FOR DELIVERY') ||
      s.includes('PICKED') || s.includes('PICKUP') || s.includes('DISPATCH')) return 'Dispatched';
  return null; // keep whatever status is already on the order
}

async function patchOrder(url, key, orderId, fields) {
  try {
    await fetch(`${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, Prefer: 'return=minimal' },
      body: JSON.stringify(Object.assign({ updated_at: new Date().toISOString() }, fields)),
    });
  } catch (e) { /* best-effort cache, ignore */ }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, phone } = req.body || {};
  if (!orderId || !phone) {
    return res.status(400).json({ error: 'Order ID and phone number are required' });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    return res.status(500).json({ error: 'Order tracking is not configured yet' });
  }

  const want = String(phone).replace(/\D/g, '').slice(-10); // last 10 digits

  try {
    const r = await fetch(
      `${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(String(orderId).trim())}&select=*`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    const rows = await r.json();
    const order = Array.isArray(rows)
      ? rows.find(o => String(o.phone || '').replace(/\D/g, '').slice(-10) === want)
      : null;

    if (!order) {
      return res.status(404).json({ error: 'No order found for that Order ID and phone number.' });
    }

    let status = order.status || 'Confirmed';
    let courier = order.courier || '';
    let tracking_number = order.tracking_number || '';
    let tracking_url = order.tracking_url || '';

    // Live courier tracking (auto) when a Shiprocket shipment exists
    if (order.shiprocket_id) {
      const sr = await getShiprocketTracking(order.shiprocket_id);
      if (sr) {
        if (sr.awb) tracking_number = sr.awb;
        if (sr.courier) courier = sr.courier;
        if (sr.track_url) tracking_url = sr.track_url;
        const mapped = mapShiprocketStatus(sr.status);
        if (mapped) status = mapped;
        // cache the latest back to Supabase so the owner's table stays current
        if (tracking_number !== (order.tracking_number || '') || status !== (order.status || '')) {
          await patchOrder(url, key, order.order_id, { status, courier, tracking_number, tracking_url });
        }
      }
    }

    return res.status(200).json({
      order_id: order.order_id,
      name: order.name || '',
      status: status,
      payment_mode: order.payment_mode || '',
      total: order.total || 0,
      cod_advance: order.cod_advance || 0,
      items: order.items || [],
      courier: courier,
      tracking_number: tracking_number,
      tracking_url: tracking_url,
      created_at: order.created_at || '',
    });
  } catch (err) {
    console.error('order-status error:', err);
    return res.status(500).json({ error: 'Could not fetch order status. Please try again.' });
  }
};
