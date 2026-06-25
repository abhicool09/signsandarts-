function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase order storage is not configured');
  return { url: url.replace(/\/$/, ''), key };
}

function headers(key, prefer) {
  const result = {
    'Content-Type': 'application/json',
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
  if (prefer) result.Prefer = prefer;
  return result;
}

function request(url, options = {}) {
  return fetch(url, Object.assign({}, options, {
    signal: AbortSignal.timeout(8000),
  }));
}

async function responseJson(response, operation) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }
  if (!response.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
    throw new Error(`${operation} failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return data;
}

async function createOrderDraft(row) {
  const { url, key } = config();
  const response = await request(`${url}/rest/v1/orders`, {
    method: 'POST',
    headers: headers(key, 'return=representation'),
    body: JSON.stringify(row),
  });
  const rows = await responseJson(response, 'Create order draft');
  if (!Array.isArray(rows) || rows.length !== 1) {
    throw new Error('Order draft was not saved');
  }
  return rows[0];
}

async function getOrder(orderId) {
  const { url, key } = config();
  const response = await request(
    `${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}&select=*`,
    { headers: headers(key) }
  );
  const rows = await responseJson(response, 'Load order');
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

async function countRecentOrdersByPhone(phone, sinceIso, maximum) {
  const { url, key } = config();
  const response = await request(
    `${url}/rest/v1/orders?phone=eq.${encodeURIComponent(phone)}` +
    `&created_at=gte.${encodeURIComponent(sinceIso)}&select=order_id&limit=${maximum}`,
    { headers: headers(key) }
  );
  const rows = await responseJson(response, 'Check recent orders');
  return Array.isArray(rows) ? rows.length : 0;
}

async function patchOrder(orderId, fields, expectedStatus, expectedUpdatedAt) {
  const { url, key } = config();
  let query = `${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`;
  if (expectedStatus) query += `&status=eq.${encodeURIComponent(expectedStatus)}`;
  if (expectedUpdatedAt) query += `&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`;
  const response = await request(query, {
    method: 'PATCH',
    headers: headers(key, 'return=representation'),
    body: JSON.stringify(Object.assign({ updated_at: new Date().toISOString() }, fields)),
  });
  const rows = await responseJson(response, 'Update order');
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

module.exports = {
  countRecentOrdersByPhone,
  createOrderDraft,
  getOrder,
  patchOrder,
};
