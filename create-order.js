const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://signsandarts.in');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, receipt } = req.body;

  if (!amount || amount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert to paise
      currency: 'INR',
      receipt: receipt || 'receipt_' + Date.now(),
    });

    res.status(200).json(order);
  } catch (err) {
    console.error('Razorpay error:', err);
    res.status(500).json({ error: 'Failed to create order', details: err.message });
  }
};
