const verifyPayment = require('./verify-payment');

function makeResponse(res) {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      if (res && typeof res.setHeader === 'function') res.setHeader(name, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      if (res && typeof res.status === 'function') {
        return res.status(this.statusCode).json(payload);
      }
      return payload;
    },
    end(payload) {
      this.body = payload || null;
      if (res && typeof res.status === 'function') {
        return res.status(this.statusCode).end(payload);
      }
      return payload;
    },
  };
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const configuredToken = process.env.ORDER_RECOVERY_TOKEN;
  if (!configuredToken) {
    return res.status(500).json({ error: 'Order recovery token is not configured' });
  }

  const suppliedToken = String(
    (req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token'])) ||
    (req.body && req.body.token) ||
    ''
  );
  if (suppliedToken !== configuredToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const orderId = String((req.body && req.body.orderId) || '').trim();
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });

  const internalReq = Object.assign({}, req, {
    method: 'POST',
    body: { orderId },
  });
  return verifyPayment(internalReq, makeResponse(res));
};
