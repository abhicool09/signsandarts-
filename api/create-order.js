module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, orderId, customerName, customerEmail, customerPhone } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_id: orderId || 'SA-' + Date.now(),
        order_amount: amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: 'CUST-' + Date.now(),
          customer_name: customerName || 'Customer',
          customer_email: customerEmail || 'customer@signsandarts.in',
          customer_phone: customerPhone || '9999999999',
        },
        order_meta: {
          return_url: 'https://signsandarts.in?order_id={order_id}&order_token={order_token}',
          notify_url: 'https://signsandarts.in/api/verify-payment',
        },
        order_note: 'Signs and Arts LED Sign Board Order',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree error:', data);
      return res.status(500).json({ error: 'Failed to create order', details: data });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: err.message });
  }
};
