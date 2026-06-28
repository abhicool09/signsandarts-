const crypto = require('crypto');
const {
  deleteProduct,
  listProducts,
  saveProduct,
  uploadProductImage,
} = require('./_lib/admin-products');

function tokenFromRequest(req) {
  const authorization = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (authorization && /^Bearer\s+/i.test(authorization)) {
    return authorization.replace(/^Bearer\s+/i, '').trim();
  }
  return String(req.headers && (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) || '').trim();
}

function tokensMatch(actual, expected) {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function requireAdmin(req, res) {
  if (!process.env.ADMIN_TOKEN) {
    res.status(503).json({ error: 'ADMIN_TOKEN is not configured' });
    return false;
  }
  if (!tokensMatch(tokenFromRequest(req), process.env.ADMIN_TOKEN)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Admin-Token');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!requireAdmin(req, res)) return;

  try {
    if (req.method === 'GET') {
      const products = await listProducts(true);
      return res.status(200).json({ products });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const action = String(body.action || 'save').toLowerCase();
    const product = body.product && typeof body.product === 'object' ? body.product : {};

    if (action === 'upload-image') {
      const url = await uploadProductImage(body.file);
      return res.status(200).json({ url });
    }

    if (action === 'delete') {
      await deleteProduct(body.id || product.id);
      return res.status(200).json({ ok: true });
    }

    if (action === 'publish') {
      const saved = await saveProduct(product, 'published');
      return res.status(200).json({ product: saved });
    }

    if (action === 'unpublish' || action === 'draft') {
      const saved = await saveProduct(product, 'draft');
      return res.status(200).json({ product: saved });
    }

    if (action === 'save') {
      const saved = await saveProduct(product);
      return res.status(200).json({ product: saved });
    }

    return res.status(400).json({ error: 'Unknown admin product action' });
  } catch (error) {
    console.error('Admin products error:', error.message);
    return res.status(400).json({ error: error.message || 'Product request failed' });
  }
};
