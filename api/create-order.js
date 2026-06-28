const crypto = require('crypto');
const { canonicalizeOrderDataWithCatalog, orderRow } = require('./_lib/checkout');
const { countRecentOrdersByPhone, createOrderDraft } = require('./_lib/orders');
const { enforceRateLimit } = require('./_lib/rate-limit');

const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_IP_LIMIT = 12;
const CREATE_PHONE_LIMIT = 5;

function createOrderId() {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(8).toString('hex').toUpperCase();
  return `SA-${time}-${random}`;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!enforceRateLimit(req, res, 'create-order', CREATE_IP_LIMIT, CREATE_WINDOW_MS)) return;

  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree credentials are not configured' });
  }

  let orderData;
  try {
    orderData = await canonicalizeOrderDataWithCatalog(req.body && req.body.orderData);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const recentOrders = await countRecentOrdersByPhone(
      orderData.phone,
      new Date(Date.now() - CREATE_WINDOW_MS).toISOString(),
      CREATE_PHONE_LIMIT
    );
    if (recentOrders >= CREATE_PHONE_LIMIT) {
      res.setHeader('Retry-After', String(Math.ceil(CREATE_WINDOW_MS / 1000)));
      return res.status(429).json({ error: 'Too many recent payment attempts for this phone number.' });
    }
  } catch (error) {
    console.error('Durable checkout rate-limit check failed:', error.message);
    return res.status(503).json({ error: 'Checkout is temporarily unavailable. Please try again shortly.' });
  }

  const orderId = createOrderId();

  try {
    await createOrderDraft(orderRow(orderId, orderData));

    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      signal: AbortSignal.timeout(10000),
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: orderData.paymentAmount,
        order_currency: 'INR',
        customer_details: {
          customer_id: `CUST-${orderId}`,
          customer_name: orderData.name,
          customer_email: orderData.email,
          customer_phone: orderData.phone,
        },
        order_meta: {
          return_url: 'https://signsandarts.in/thank-you.html?order_id={order_id}',
        },
        order_note: orderData.isCOD
          ? `COD Order - Rs ${orderData.codAdvance} advance. Remaining paid on delivery. Signs and Arts`
          : 'Signs and Arts LED Sign Board Order',
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Cashfree create-order failed:', response.status, JSON.stringify(data).slice(0, 300));
      return res.status(502).json({ error: 'Failed to create payment order' });
    }

    return res.status(200).json(Object.assign({}, data, {
      order_id: orderId,
      order_data: orderData,
    }));
  } catch (error) {
    console.error('Create order error:', error.message);
    return res.status(500).json({ error: 'Could not start payment. Please try again.' });
  }
};
