const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://signsandarts.in');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderData,
  } = req.body;

  // ── 1. Verify Razorpay Signature ──────────────────────────────────────────
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed. Signature mismatch.' });
  }

  // ── 2. Get Shiprocket Auth Token ──────────────────────────────────────────
  let srToken;
  try {
    const tokenRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    });
    const tokenData = await tokenRes.json();
    srToken = tokenData.token;
    if (!srToken) throw new Error('No token received from Shiprocket');
  } catch (err) {
    console.error('Shiprocket auth error:', err);
    return res.status(500).json({ error: 'Shiprocket authentication failed', details: err.message });
  }

  // ── 3. Create Shiprocket Order ────────────────────────────────────────────
  try {
    const now = new Date();
    const orderDate = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];

    const srPayload = {
      order_id: 'SA-' + razorpay_payment_id,
      order_date: orderDate,
      pickup_location: 'Primary',
      channel_id: '',
      comment: 'Order from signsandarts.in',
      billing_customer_name: orderData.name,
      billing_last_name: '',
      billing_address: orderData.address,
      billing_address_2: '',
      billing_city: orderData.city,
      billing_pincode: orderData.pincode,
      billing_state: orderData.state,
      billing_country: 'India',
      billing_email: orderData.email,
      billing_phone: orderData.phone,
      shipping_is_billing: true,
      order_items: orderData.items.map((item) => ({
        name: item.name,
        sku: 'SKU-' + (item.id || Date.now()),
        units: item.qty,
        selling_price: item.price,
        discount: 0,
        tax: '',
        hsn: 9405, // HSN code for LED lights/signs
      })),
      payment_method: 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.total,
      length: 60,   // cm
      breadth: 50,  // cm
      height: 15,   // cm
      weight: 4,    // kg
    };

    const srRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${srToken}`,
      },
      body: JSON.stringify(srPayload),
    });

    const srData = await srRes.json();

    return res.status(200).json({
      success: true,
      payment_id: razorpay_payment_id,
      order_id: 'SA-' + razorpay_payment_id,
      shiprocket: srData,
    });
  } catch (err) {
    console.error('Shiprocket order error:', err);
    return res.status(500).json({ error: 'Shiprocket order creation failed', details: err.message });
  }
};
