const {
  getProductBySlug,
  listProducts,
} = require('./_lib/admin-products');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const slug = String((req.query && req.query.slug) || '').trim();
    if (slug) {
      const product = await getProductBySlug(slug, false);
      if (!product) return res.status(404).json({ error: 'Product not found' });
      return res.status(200).json({ product });
    }

    const products = await listProducts(false);
    return res.status(200).json({ products });
  } catch (error) {
    console.error('Public products error:', error.message);
    return res.status(503).json({ error: 'Product catalog is temporarily unavailable' });
  }
};
