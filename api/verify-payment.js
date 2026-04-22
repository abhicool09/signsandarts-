const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, orderData } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  // ── 1. Verify payment with Cashfree ──────────────────────────────────────
  try {
    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const payments = await response.json();

    if (!response.ok) {
      return res.status(400).json({ error: 'Payment verification failed', details: payments });
    }

    // Check if any payment is SUCCESS
    const successPayment = Array.isArray(payments)
      ? payments.find(p => p.payment_status === 'SUCCESS')
      : null;

    if (!successPayment) {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // ── 2. Create Shiprocket Order ──────────────────────────────────────────
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
      if (!srToken) throw new Error('No token from Shiprocket');
    } catch (err) {
      console.error('Shiprocket auth error:', err);
      // Still return success for payment even if shiprocket fails
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket: { error: 'Shiprocket order creation failed - please create manually' },
      });
    }

    // Create Shiprocket order
    const now = new Date();
    const orderDate = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];

    const srRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${srToken}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_date: orderDate,
        pickup_location: 'Primary',
        billing_customer_name: orderData.name,
        billing_last_name: '',
        billing_address: orderData.address,
        billing_city: orderData.city,
        billing_pincode: orderData.pincode,
        billing_state: orderData.state,
        billing_country: 'India',
        billing_email: orderData.email,
        billing_phone: orderData.phone,
        shipping_is_billing: true,
        order_items: orderData.items.map(item => ({
          name: item.name,
          sku: 'SKU-' + item.id,
          units: item.qty,
          selling_price: item.price,
          discount: 0,
          tax: '',
          hsn: 9405,
        })),
        payment_method: 'Prepaid',
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: orderData.total,
        length: 60,
        breadth: 50,
        height: 15,
        weight: 4,
      }),
    });

    const srData = await srRes.json();

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_id: successPayment.cf_payment_id,
      shiprocket: srData,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
