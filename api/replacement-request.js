const crypto = require('crypto');
const { getOrder } = require('./_lib/orders');
const { enforceRateLimit } = require('./_lib/rate-limit');

const WINDOW_MS = 15 * 60 * 1000;
const SHIPROCKET_BASE = 'https://apiv2.shiprocket.in/v1/external';

const RETURN_REASONS = {
  damaged_product: 'Item is damaged',
  damaged_box: 'Both product and shipping box damaged',
  not_working: "Item defective or doesn't work",
  wrong_item: 'Wrong item was sent',
  missing_parts: 'Missing parts or accessories',
};

function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  return fetch(url, Object.assign({}, options, {
    signal: AbortSignal.timeout(timeoutMs),
  }));
}

function cleanText(value, field, maxLength) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${field} is required`);
  if (text.length > maxLength) throw new Error(`${field} is too long`);
  return text;
}

function optionalText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function phone10(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

function pincode6(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 6);
}

function nowForShiprocket() {
  const now = new Date();
  return `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;
}

function channelOrderId(prefix, originalOrderId) {
  const source = String(originalOrderId || '').trim();
  const safe = source.replace(/[^A-Za-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const value = `${prefix}-${safe}`;
  if (value.length <= 50) return value;
  const digest = crypto.createHash('sha1').update(source).digest('hex').slice(0, 8).toUpperCase();
  return `${prefix}-${safe.slice(0, 50 - prefix.length - digest.length - 2)}-${digest}`;
}

function sellerReturnAddress() {
  return {
    name: process.env.SHIPROCKET_RETURN_NAME || 'Signs and Arts',
    address: process.env.SHIPROCKET_RETURN_ADDRESS ||
      '16-2-671/2, opp. Yashoda Hospital Road, beside Kia Showroom, Judges Colony, Malakpet',
    address2: process.env.SHIPROCKET_RETURN_ADDRESS_2 || '',
    city: process.env.SHIPROCKET_RETURN_CITY || 'Hyderabad',
    state: process.env.SHIPROCKET_RETURN_STATE || 'Telangana',
    country: 'India',
    pincode: pincode6(process.env.SHIPROCKET_RETURN_PINCODE || '500060'),
    email: process.env.SHIPROCKET_RETURN_EMAIL || process.env.ORDER_ALERT_EMAIL || 'hello@signsandarts.in',
    phone: phone10(process.env.SHIPROCKET_RETURN_PHONE || '9392878946'),
  };
}

async function shiprocketJson(response, operation) {
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }
  if (!response.ok || (data && typeof data === 'object' && data.errors) ||
      (data && Number(data.status_code) >= 400)) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data || {});
    const error = new Error(`${operation} failed (${response.status}): ${detail.slice(0, 500)}`);
    error.data = data;
    throw error;
  }
  return data || {};
}

function duplicateShiprocketError(error) {
  const text = `${error && error.message || ''} ${JSON.stringify(error && error.data || {})}`;
  return /already|duplicate|exists|taken/i.test(text);
}

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error('Shiprocket credentials are not configured');

  const response = await fetchWithTimeout(`${SHIPROCKET_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await shiprocketJson(response, 'Shiprocket login');
  if (!data.token) throw new Error('Shiprocket login did not return a token');
  return data.token;
}

async function findShiprocketOrder(token, orderId) {
  const query = new URLSearchParams({
    filter_by: 'channel_order_id',
    filter: orderId,
    per_page: '5',
  });
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE}/orders?${query.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await shiprocketJson(response, 'Shiprocket order lookup');
  const orders = Array.isArray(data && data.data) ? data.data : [];
  return orders.find(order => String(order.channel_order_id || '') === orderId) || null;
}

function shipmentSummary(data, channelOrderIdValue) {
  const shipments = Array.isArray(data && data.shipments)
    ? data.shipments
    : data && data.shipments ? [data.shipments] : [];
  const shipment = shipments[0] || {};
  const awb = shipment.awb || data.awb_code || '';
  return {
    channel_order_id: channelOrderIdValue,
    shiprocket_order_id: String((data && (data.order_id || data.id)) || ''),
    shipment_id: String(shipment.id || (data && data.shipment_id) || ''),
    status: String((data && data.status) || ''),
    awb: String(awb || ''),
    courier: String(shipment.courier || (data && data.courier_name) || ''),
    tracking_url: awb ? `https://shiprocket.co/tracking/${awb}` : '',
  };
}

function orderItems(order, returnReason, replacement) {
  const sourceItems = Array.isArray(order.items) ? order.items : [];
  if (!sourceItems.length) throw new Error('Original order has no items to replace');
  return sourceItems.map(item => {
    const name = optionalText(item.name, 160) || 'Signs and Arts product';
    const id = optionalText(item.id || name, 50).replace(/[^A-Za-z0-9-]/g, '-').replace(/-+/g, '-');
    const units = Math.max(Number.parseInt(item.qty, 10) || 1, 1);
    const sellingPrice = Math.max(Math.round(Number(item.price || 0)), 1);
    const result = {
      name: replacement ? `${name} (Replacement)`.slice(0, 190) : name,
      sku: `${replacement ? 'RPL' : 'RET'}-${id}`.slice(0, 50),
      units,
      selling_price: sellingPrice,
      discount: 0,
      hsn: 9405,
    };
    if (!replacement) {
      result.return_reason = returnReason;
      result.qc_enable = false;
    }
    return result;
  });
}

function subtotal(items) {
  return items.reduce((sum, item) => sum + Number(item.selling_price || 1) * Number(item.units || 1), 0);
}

function dimensions() {
  return {
    length: Number(process.env.SHIPROCKET_REPLACEMENT_LENGTH_CM || 60),
    breadth: Number(process.env.SHIPROCKET_REPLACEMENT_BREADTH_CM || 50),
    height: Number(process.env.SHIPROCKET_REPLACEMENT_HEIGHT_CM || 15),
    weight: Number(process.env.SHIPROCKET_REPLACEMENT_WEIGHT_KG || 4),
  };
}

function returnPayload(order, returnOrderId, returnReason) {
  const seller = sellerReturnAddress();
  const items = orderItems(order, returnReason, false);
  const dims = dimensions();
  return Object.assign({
    order_id: returnOrderId,
    order_date: nowForShiprocket(),
    pickup_customer_name: order.name,
    pickup_last_name: '',
    company_name: 'Signs and Arts',
    pickup_address: order.address,
    pickup_address_2: '',
    pickup_city: order.city,
    pickup_state: order.state,
    pickup_country: 'India',
    pickup_pincode: Number(order.pincode),
    pickup_email: order.email || seller.email,
    pickup_phone: phone10(order.phone),
    pickup_isd_code: '91',
    shipping_customer_name: seller.name,
    shipping_last_name: '',
    shipping_address: seller.address,
    shipping_address_2: seller.address2,
    shipping_city: seller.city,
    shipping_country: seller.country,
    shipping_pincode: Number(seller.pincode),
    shipping_state: seller.state,
    shipping_email: seller.email,
    shipping_isd_code: '91',
    shipping_phone: Number(seller.phone),
    order_items: items,
    payment_method: 'PREPAID',
    total_discount: '0',
    sub_total: subtotal(items),
  }, dims);
}

function replacementPayload(order, replacementOrderId) {
  const items = orderItems(order, '', true);
  const dims = dimensions();
  return Object.assign({
    order_id: replacementOrderId,
    order_date: nowForShiprocket(),
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
    billing_customer_name: order.name,
    billing_last_name: '',
    billing_address: order.address,
    billing_city: order.city,
    billing_pincode: order.pincode,
    billing_state: order.state,
    billing_country: 'India',
    billing_email: order.email,
    billing_phone: phone10(order.phone),
    shipping_is_billing: true,
    order_items: items,
    payment_method: 'Prepaid',
    cod_charges: 0,
    shipping_charges: 0,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: 0,
    sub_total: subtotal(items),
  }, dims);
}

async function createShiprocketReturn(token, payload) {
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE}/orders/create/return`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return shiprocketJson(response, 'Shiprocket return order creation');
}

async function createShiprocketReplacement(token, payload) {
  const response = await fetchWithTimeout(`${SHIPROCKET_BASE}/orders/create/adhoc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return shiprocketJson(response, 'Shiprocket replacement order creation');
}

function eligibleOrder(order, phone) {
  if (!order) return 'No order found for that Order ID.';
  if (phone10(order.phone) !== phone10(phone)) return 'No order found for that Order ID and phone number.';
  const status = String(order.status || '').toUpperCase();
  if (status === 'PAYMENT PENDING') return 'Payment is not completed for this order.';
  if (status.includes('CANCEL') || status.includes('RTO')) return 'This order is not eligible for replacement.';
  if (!Array.isArray(order.items) || !order.items.length) return 'This order has no products to replace.';
  return '';
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!enforceRateLimit(req, res, 'replacement-request', 8, WINDOW_MS)) return;

  let orderId;
  let phone;
  let reasonKey;
  let issueDetails;
  try {
    orderId = cleanText(req.body && req.body.orderId, 'Order ID', 80);
    phone = phone10(cleanText(req.body && req.body.phone, 'Phone number', 20));
    if (phone.length !== 10) throw new Error('A valid 10-digit phone number is required');
    reasonKey = cleanText(req.body && req.body.reason, 'Issue type', 40);
    issueDetails = optionalText(req.body && req.body.issueDetails, 700);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!RETURN_REASONS[reasonKey]) {
    return res.status(400).json({ error: 'Please choose a valid replacement reason.' });
  }
  if (req.body && req.body.replacementOnlyAccepted !== true) {
    return res.status(400).json({ error: 'Replacement-only confirmation is required.' });
  }
  const lookupKey = `${orderId}:${phone}`;
  if (!enforceRateLimit(req, res, 'replacement-request-order', 4, WINDOW_MS, lookupKey)) return;

  try {
    const order = await getOrder(orderId);
    const eligibilityError = eligibleOrder(order, phone);
    if (eligibilityError) return res.status(404).json({ error: eligibilityError });

    const token = await getShiprocketToken();
    const returnOrderId = channelOrderId('RET', orderId);
    const replacementOrderId = channelOrderId('RPL', orderId);

    const existingReturn = await findShiprocketOrder(token, returnOrderId);
    let returnData = existingReturn;
    let returnExisting = Boolean(existingReturn);
    if (!returnData) {
      try {
        returnData = await createShiprocketReturn(
          token,
          returnPayload(order, returnOrderId, RETURN_REASONS[reasonKey])
        );
      } catch (error) {
        if (!duplicateShiprocketError(error)) throw error;
        returnExisting = true;
        returnData = { status: 'RETURN ALREADY CREATED' };
      }
    }

    const existingReplacement = await findShiprocketOrder(token, replacementOrderId);
    let replacementData = existingReplacement;
    let replacementExisting = Boolean(existingReplacement);
    if (!replacementData) {
      try {
        replacementData = await createShiprocketReplacement(token, replacementPayload(order, replacementOrderId));
      } catch (error) {
        if (!duplicateShiprocketError(error)) {
          console.error('Replacement order creation failed after return was created:', error.message);
          return res.status(502).json({
            error: 'Return pickup request was created, but the replacement order could not be created automatically. Please WhatsApp us with this Order ID.',
            original_order_id: orderId,
            return_order_id: returnOrderId,
          });
        }
        replacementExisting = true;
        replacementData = { status: 'REPLACEMENT ALREADY CREATED' };
      }
    }

    return res.status(200).json({
      success: true,
      original_order_id: orderId,
      return_order_id: returnOrderId,
      replacement_order_id: replacementOrderId,
      replacement_only: true,
      issue_type: reasonKey,
      issue_details: issueDetails,
      return_order: Object.assign(shipmentSummary(returnData, returnOrderId), { existing: returnExisting }),
      replacement_order: Object.assign(shipmentSummary(replacementData, replacementOrderId), { existing: replacementExisting }),
      message: 'Replacement request created in Shiprocket.',
    });
  } catch (error) {
    console.error('Replacement request error:', error.message);
    return res.status(500).json({ error: 'Could not create the replacement request. Please try again or WhatsApp us.' });
  }
};
