// Customer order lookup: requires Order ID + phone (both must match) for privacy.
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

    // return only what the customer needs (no email/full address)
    return res.status(200).json({
      order_id: order.order_id,
      name: order.name || '',
      status: order.status || 'Confirmed',
      payment_mode: order.payment_mode || '',
      total: order.total || 0,
      cod_advance: order.cod_advance || 0,
      items: order.items || [],
      courier: order.courier || '',
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
      created_at: order.created_at || '',
    });
  } catch (err) {
    console.error('order-status error:', err);
    return res.status(500).json({ error: 'Could not fetch order status. Please try again.' });
  }
};
