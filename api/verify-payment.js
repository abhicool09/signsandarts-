async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured');
  }

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
  if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    return res.status(400).json({ error: 'Order data with items is required' });
  }
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree credentials are not configured' });
  }

  // COD flag — only addition to original
  const isCOD = orderData && orderData.isCOD === true;

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
    const shippingAddress = {
      name: String(orderData.name || '').trim(),
      address: String(orderData.address || '').trim(),
      city: String(orderData.city || '').trim(),
      state: String(orderData.state || '').trim(),
      pincode: String(orderData.pincode || '').trim(),
      email: String(orderData.email || '').trim(),
      phone: String(orderData.phone || '').trim(),
    };

    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode || !shippingAddress.phone) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        shiprocket_error: 'Missing shipping address fields required by Shiprocket',
        missing_fields: Object.keys(shippingAddress).filter(key => !shippingAddress[key] && key !== 'email'),
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

    const codAdvance = isCOD ? Number(orderData.codAdvance || 200) : 0;
    const itemTotal = orderData.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    const codBalance = isCOD ? Math.max(Number(orderData.total || 0) - codAdvance, 1) : Number(orderData.total || 0);
    const codRatio = isCOD && itemTotal > 0 ? codBalance / itemTotal : 1;
    const shiprocketItems = orderData.items.map(item => ({
      name: item.name + (isCOD ? ' (COD balance)' : ''),
      sku: 'SKU-' + item.id,
      units: Number(item.qty || 1),
      selling_price: Math.max(Math.round(Number(item.price || 0) * codRatio), 1),
      discount: 0,
      tax: '',
      hsn: 9405,
    }));
    const shiprocketSubTotal = shiprocketItems.reduce((sum, item) => {
      return sum + item.selling_price * item.units;
    }, 0);

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
        billing_customer_name: shippingAddress.name,
        billing_last_name: '',
        billing_address: shippingAddress.address,
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.pincode,
        billing_state: shippingAddress.state,
        billing_country: 'India',
        billing_email: shippingAddress.email || 'customer@signsandarts.in',
        billing_phone: shippingAddress.phone,
        shipping_is_billing: true,
        order_items: shiprocketItems,
        payment_method: isCOD ? 'COD' : 'Prepaid',
        cod_charges: 0,
        shipping_charges: 0,
        giftwrap_charges: 0,
        transaction_charges: 0,
        total_discount: 0,
        sub_total: shiprocketSubTotal,
        length: 60,
        breadth: 50,
        height: 15,
        weight: 4,
      }),
    });

    const srData = await srRes.json();
    console.log('Shiprocket order response:', JSON.stringify(srData).substring(0, 200));

    if (!srRes.ok || srData.errors || srData.status_code >= 400) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        shiprocket_error: srData,
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_id: successPayment.cf_payment_id,
      shiprocket_status: 'created',
      shiprocket: srData,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
