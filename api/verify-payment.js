const crypto = require('crypto');

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
  try { data = JSON.parse(text); } catch(e) { throw new Error('Shiprocket invalid JSON: ' + text.substring(0, 100)); }
  if (!data.token) throw new Error('No token: ' + JSON.stringify(data).substring(0, 200));
  return data.token;
}

async function getSuccessfulPayment(orderId) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  };

  for (let attempt = 1; attempt <= 5; attempt++) {
    if (attempt > 1) await new Promise(r => setTimeout(r, 2000));

    const cfResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET', headers,
    });

    const payments = await cfResponse.json();
    console.log(`Attempt ${attempt} - payments:`, JSON.stringify(payments).substring(0, 300));

    if (!cfResponse.ok) { console.error('Cashfree error:', payments); continue; }

    const paymentList = Array.isArray(payments) ? payments : [];

    const successPayment = paymentList.find(p =>
      p.payment_status === 'SUCCESS' ||
      p.payment_status === 'PAID' ||
      p.payment_status === 'CAPTURED'
    );
    if (successPayment) { console.log('Verified on attempt', attempt); return successPayment; }

    const failedPayment = paymentList.find(p =>
      p.payment_status === 'FAILED' ||
      p.payment_status === 'CANCELLED' ||
      p.payment_status === 'VOID'
    );
    if (failedPayment) { console.log('Payment failed:', failedPayment.payment_status); return null; }

    console.log(`Attempt ${attempt}: still pending, retrying...`);
  }
  return null;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, orderData } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  const isCOD = orderData && orderData.isCOD === true;
  const codAdvance = isCOD ? 200 : 0;

  try {
    const successPayment = await getSuccessfulPayment(orderId);

    if (!successPayment) {
      return res.status(400).json({ error: 'Payment not confirmed. Please WhatsApp us with Order ID: ' + orderId });
    }

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
        note: 'Payment successful! Create Shiprocket order manually for: ' + orderId,
      });
    }

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
        payment_method: isCOD ? 'COD' : 'Prepaid',
        cod_charges: isCOD ? orderData.total - codAdvance : 0,
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

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_id: successPayment.cf_payment_id,
      payment_method: isCOD ? 'COD' : 'Prepaid',
      shiprocket: srData,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
