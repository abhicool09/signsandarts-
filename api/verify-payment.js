const crypto = require('crypto');

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  
  console.log('Attempting Shiprocket login with email:', email);
  
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await response.text();
  console.log('Shiprocket raw response:', text.substring(0, 200));
  
  let data;
  try {
    data = JSON.parse(text);
  } catch(e) {
    throw new Error('Shiprocket returned invalid JSON: ' + text.substring(0, 100));
  }

  if (!data.token) {
    throw new Error('No token in response: ' + JSON.stringify(data).substring(0, 200));
  }
  
  return data.token;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, orderData } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  // ── 1. Verify payment with Cashfree ──────────────────────────────────────
  try {
    const cfResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const payments = await cfResponse.json();

    if (!cfResponse.ok) {
      return res.status(400).json({ error: 'Payment verification failed', details: payments });
    }

    const successPayment = Array.isArray(payments)
      ? payments.find(p => p.payment_status === 'SUCCESS')
      : null;

    if (!successPayment) {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // ── 2. Create Shiprocket Order ──────────────────────────────────────────
    let srToken;
    try {
      srToken = await getShiprocketToken();
    } catch (err) {
      console.error('Shiprocket login failed:', err.message);
      // Payment was successful — return success even if Shiprocket fails
      // Order can be created manually in Shiprocket dashboard
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        shiprocket_error: err.message,
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

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
    console.log('Shiprocket order response:', JSON.stringify(srData).substring(0, 200));

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
