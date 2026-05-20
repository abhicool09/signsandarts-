async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch(e) { throw new Error('Shiprocket invalid JSON'); }
  if (!data.token) throw new Error('No Shiprocket token: ' + JSON.stringify(data).substring(0, 200));
  return data.token;
}

async function isPaymentConfirmed(orderId) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  };

  for (let attempt = 1; attempt <= 6; attempt++) {
    // Wait before each attempt (3s first, then 2s)
    await new Promise(r => setTimeout(r, attempt === 1 ? 3000 : 2000));

    // ── Check ORDER status (faster to update than payment status) ──
    const orderRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET', headers,
    });
    const orderData = await orderRes.json();
    console.log(`Attempt ${attempt} - order_status:`, orderData.order_status);

    if (orderData.order_status === 'PAID') {
      return { confirmed: true, source: 'order_status' };
    }

    // ── Also check payments list ──
    const payRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET', headers,
    });
    const payments = await payRes.json();
    const list = Array.isArray(payments) ? payments : [];
    console.log(`Attempt ${attempt} - payment statuses:`, list.map(p => p.payment_status));

    const success = list.find(p =>
      ['SUCCESS','PAID','CAPTURED'].includes(p.payment_status)
    );
    if (success) return { confirmed: true, cf_payment_id: success.cf_payment_id, source: 'payment_status' };

    const failed = list.find(p => ['FAILED','CANCELLED','VOID'].includes(p.payment_status));
    if (failed) return { confirmed: false, reason: 'Payment ' + failed.payment_status };
  }

  return { confirmed: false, reason: 'Payment still pending after retries' };
}

async function createShiprocketOrder(orderId, orderData, srToken) {
  const isCOD = orderData && orderData.isCOD === true;
  const now = new Date();
  const orderDate = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];

  const srRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${srToken}` },
    body: JSON.stringify({
      order_id: orderId,
      order_date: orderDate,
      pickup_location: 'Primary',
      billing_customer_name: orderData.name,
      billing_last_name: '',
      billing_address: orderData.address,
      billing_city: orderData.city,
      billing_pincode: orderData.pincode,
      billing_state: orderData.state || 'Telangana',
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
      payment_method: isCOD ? 'COD' : 'Prepaid',
      cod_charges: isCOD ? (orderData.total - 200) : 0,
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
  console.log('Shiprocket response:', JSON.stringify(srData).substring(0, 300));
  return srData;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Handle Cashfree webhook (ReactorNetty) ────────────────────────────────
  // Cashfree sends webhook with different format — handle gracefully
  const body = req.body || {};
  if (body.type && body.data) {
    console.log('Cashfree webhook received:', body.type);
    // Webhook handled — actual verify is done by frontend call
    return res.status(200).json({ received: true });
  }

  const { orderId, orderData } = body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  try {
    const result = await isPaymentConfirmed(orderId);

    if (!result.confirmed) {
      console.error('Payment not confirmed:', result.reason, 'Order:', orderId);
      return res.status(400).json({ error: result.reason });
    }

    console.log('Payment confirmed for', orderId, 'via', result.source);

    // ── Create Shiprocket order ─────────────────────────────────────────────
    let srToken;
    try {
      srToken = await getShiprocketToken();
    } catch (err) {
      console.error('Shiprocket login failed:', err.message);
      return res.status(200).json({
        success: true,
        order_id: orderId,
        shiprocket_status: 'failed',
        shiprocket_error: err.message,
        note: 'Payment OK. Create Shiprocket order manually: ' + orderId,
      });
    }

    const srData = await createShiprocketOrder(orderId, orderData, srToken);

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_method: orderData && orderData.isCOD ? 'COD' : 'Prepaid',
      shiprocket: srData,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
