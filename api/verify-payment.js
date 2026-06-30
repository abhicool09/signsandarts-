const { amountsMatch, expectedPaymentAmount } = require('./_lib/checkout');
const { getOrder, patchOrder } = require('./_lib/orders');
const { enforceRateLimit } = require('./_lib/rate-limit');
const { sendTwilioWhatsApp } = require('./_lib/whatsapp-alert');

const PROCESSING_WINDOW_MS = 2 * 60 * 1000;
const VERIFY_WINDOW_MS = 5 * 60 * 1000;

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  return fetch(url, Object.assign({}, options, {
    signal: AbortSignal.timeout(timeoutMs),
  }));
}

async function checkedProviderFetch(provider, url, options) {
  const response = await fetchWithTimeout(url, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${provider} returned ${response.status}: ${text.slice(0, 200)}`);
  }
  if (provider === 'CallMeBot' && /\b(error|invalid|denied)\b/i.test(text)) {
    throw new Error(`${provider} rejected the message: ${text.slice(0, 200)}`);
  }
  return text;
}

async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error('Shiprocket credentials are not configured');

  const response = await fetchWithTimeout('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok || !data.token) {
    throw new Error(`Shiprocket login failed (${response.status})`);
  }
  return data.token;
}

function shiprocketFields(order) {
  if (!order) return null;
  const shipments = Array.isArray(order.shipments)
    ? order.shipments
    : order.shipments ? [order.shipments] : [];
  const shipment = shipments[0] || {};
  const shipmentId = shipment.id || order.shipment_id;
  if (!shipmentId) return null;
  return {
    status: 'Confirmed',
    shiprocket_id: String(shipmentId),
    tracking_number: String(shipment.awb || order.awb_code || ''),
    courier: String(shipment.courier || order.courier_name || ''),
    tracking_url: shipment.awb
      ? `https://shiprocket.co/tracking/${shipment.awb}`
      : '',
  };
}

async function findShiprocketOrder(token, orderId) {
  const query = new URLSearchParams({
    filter_by: 'channel_order_id',
    filter: orderId,
    per_page: '5',
  });
  const response = await fetchWithTimeout(
    `https://apiv2.shiprocket.in/v1/external/orders?${query.toString()}`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Shiprocket order lookup failed (${response.status})`);
  }
  const orders = Array.isArray(data && data.data) ? data.data : [];
  return orders.find(order => String(order.channel_order_id || '') === orderId) || null;
}

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function notifyNewOrder(orderId, order, isCOD) {
  const total = Number(order.total || 0);
  const items = (order.items || [])
    .map(item => `${item.name}${Number(item.qty) > 1 ? ` x${item.qty}` : ''}`)
    .join(', ');
  const pay = isCOD
    ? `COD - Rs ${order.cod_advance || 0} advance paid (order total Rs ${total})`
    : `Online - Rs ${total} paid`;
  const text =
    `NEW ORDER - Signs and Arts\n` +
    `Order ID: ${orderId}\n` +
    `Amount: ${pay}\n` +
    `Name: ${order.name || ''}\n` +
    `Phone: ${order.phone || ''}\n` +
    `Address: ${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}\n` +
    `Items: ${items}`;

  const results = [];

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_TO) {
    try {
      await sendTwilioWhatsApp(text);
      results.push('Twilio');
    } catch (error) {
      console.error('Twilio WhatsApp alert failed:', error.message);
    }
  }

  if (process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_APIKEY) {
    try {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(process.env.CALLMEBOT_PHONE)}` +
        `&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(process.env.CALLMEBOT_APIKEY)}`;
      await checkedProviderFetch('CallMeBot', url);
      results.push('CallMeBot');
    } catch (error) {
      console.error('CallMeBot WhatsApp alert failed:', error.message);
    }
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const rows = [
        ['Order ID', orderId],
        ['Amount', pay],
        ['Name', order.name || ''],
        ['Phone', order.phone || ''],
        ['Address', `${order.address || ''}, ${order.city || ''}, ${order.state || ''} - ${order.pincode || ''}`],
        ['Email', order.email || ''],
        ['Items', items],
      ].map(([key, value]) =>
        `<tr><td style="padding:6px 12px;color:#777;border-bottom:1px solid #eee">${escapeHtml(key)}</td>` +
        `<td style="padding:6px 12px;font-weight:600;border-bottom:1px solid #eee">${escapeHtml(value)}</td></tr>`
      ).join('');
      const html =
        '<div style="font-family:Arial,sans-serif;max-width:560px">' +
        '<h2 style="color:#1e8a44">New Order Received</h2>' +
        `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>` +
        '<p style="color:#777;font-size:12px;margin-top:16px">Signs and Arts order alert</p></div>';
      await checkedProviderFetch('Resend', 'https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.ORDER_ALERT_FROM || 'Signs and Arts <onboarding@resend.dev>',
          to: [process.env.ORDER_ALERT_EMAIL || 'hello@signsandarts.in'],
          subject: `New Order ${orderId} - Rs ${total}`,
          html,
        }),
      });
      results.push('Resend');
    } catch (error) {
      console.error('Resend email alert failed:', error.message);
    }
  }

  if (!results.length) {
    console.warn(`No new-order alert provider succeeded for ${orderId}`);
  }
  return results;
}

function isFresh(order) {
  const updated = Date.parse(order && order.updated_at);
  return Number.isFinite(updated) && Date.now() - updated < PROCESSING_WINDOW_MS;
}

function alreadyFulfilled(order) {
  return Boolean(order.shiprocket_id) ||
    ['Dispatched', 'Delivered', 'Cancelled'].includes(String(order.status || ''));
}

function dateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function estimatedDeliveryDate(order) {
  const created = Date.parse(order && (order.created_at || order.updated_at));
  const base = Number.isFinite(created) ? Math.max(created, Date.now()) : Date.now();
  return dateOnly(new Date(base + 7 * 24 * 60 * 60 * 1000));
}

function orderResponseDetails(order) {
  return {
    total: Number(order.total || 0),
    payment_mode: order.payment_mode || '',
    cod_advance: Number(order.cod_advance || 0),
    items: Array.isArray(order.items) ? order.items : [],
    email: order.email || '',
    delivery_country: 'IN',
    estimated_delivery_date: estimatedDeliveryDate(order),
  };
}

function completedResponse(orderId, paymentId, order, extra = {}) {
  return Object.assign({
    success: true,
    order_id: orderId,
    payment_id: paymentId,
    shiprocket_status: order.shiprocket_id ? 'created' : 'processing',
    idempotent: true,
  }, orderResponseDetails(order), extra);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!enforceRateLimit(req, res, 'verify-payment', 20, VERIFY_WINDOW_MS)) return;

  const orderId = String((req.body && req.body.orderId) || '').trim();
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });
  if (!enforceRateLimit(req, res, 'verify-order', 8, VERIFY_WINDOW_MS, orderId)) return;
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree credentials are not configured' });
  }

  try {
    let order = await getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Secure order draft not found' });

    const cashfreeResponse = await fetchWithTimeout(
      `https://api.cashfree.com/pg/orders/${encodeURIComponent(orderId)}/payments`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_APP_ID,
          'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        },
      }
    );
    const payments = await cashfreeResponse.json();
    if (!cashfreeResponse.ok) {
      console.error('Cashfree verification failed:', cashfreeResponse.status, JSON.stringify(payments).slice(0, 300));
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const successPayment = Array.isArray(payments)
      ? payments.find(payment => payment.payment_status === 'SUCCESS')
      : null;
    if (!successPayment) return res.status(400).json({ error: 'Payment not successful' });

    const expectedAmount = expectedPaymentAmount(order);
    if (!amountsMatch(successPayment.payment_amount, expectedAmount)) {
      console.error(
        `Payment amount mismatch for ${orderId}: received ${successPayment.payment_amount}, expected ${expectedAmount}`
      );
      return res.status(400).json({ error: 'Payment amount does not match the order total' });
    }

    if (alreadyFulfilled(order)) {
      return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order));
    }

    let shouldNotify = false;
    let ownsFulfillment = false;
    if (order.status === 'Payment Pending') {
      const claimed = await patchOrder(orderId, { status: 'Processing' }, 'Payment Pending');
      if (claimed) {
        order = claimed;
        shouldNotify = true;
      } else {
        order = await getOrder(orderId);
      }
    }

    if (!shouldNotify && order.status === 'Processing' && isFresh(order)) {
      return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order, {
        processing: true,
      }));
    }
    const fulfillmentInProgress = !shouldNotify && order.status === 'Fulfilling' && isFresh(order);

    if (order.status === 'Processing') shouldNotify = true;

    const isCOD = String(order.payment_mode || '').toUpperCase() === 'COD';
    if (shouldNotify) {
      const alertClaim = await patchOrder(orderId, { status: 'Fulfilling' }, 'Processing');
      if (alertClaim) {
        order = alertClaim;
        await notifyNewOrder(orderId, order, isCOD);
        ownsFulfillment = true;
      } else {
        order = await getOrder(orderId);
        if (!order) throw new Error('Order disappeared while claiming fulfillment');
        if ((order.status === 'Processing' || order.status === 'Fulfilling') && isFresh(order)) {
          return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order, {
            processing: true,
          }));
        }
      }
    }

    if (alreadyFulfilled(order)) {
      return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order));
    }

    if (!ownsFulfillment) {
      if (order.status === 'Fulfilling' && isFresh(order)) {
        return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order, {
          processing: true,
        }));
      }

      const fulfillmentClaim = await patchOrder(
        orderId,
        { status: 'Fulfilling' },
        order.status,
        order.updated_at
      );
      if (!fulfillmentClaim) {
        order = await getOrder(orderId);
        if (!order) throw new Error('Order disappeared while claiming Shiprocket fulfillment');
        if (alreadyFulfilled(order)) {
          return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order));
        }
        return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order, {
          processing: true,
        }));
      }
      order = fulfillmentClaim;
      ownsFulfillment = true;
    }

    let shiprocketToken;
    try {
      shiprocketToken = await getShiprocketToken();
    } catch (error) {
      console.error('Shiprocket login failed:', error.message);
      await patchOrder(orderId, { status: 'Confirmed' });
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        note: `Payment successful. Create the Shiprocket order manually for ${orderId}.`,
        ...orderResponseDetails(order),
      });
    }

    const existingShiprocketOrder = await findShiprocketOrder(shiprocketToken, orderId);
    const existingShipment = shiprocketFields(existingShiprocketOrder);
    if (existingShipment) {
      await patchOrder(orderId, existingShipment);
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'created',
        idempotent: true,
        recovered: true,
        ...orderResponseDetails(order),
      });
    }
    if (existingShiprocketOrder) {
      console.error(`Shiprocket already has order ${orderId}, but no shipment ID was returned`);
      await patchOrder(orderId, { status: 'Confirmed' });
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'manual_review',
        idempotent: true,
        note: `Shiprocket already has order ${orderId}; review it manually before retrying.`,
        ...orderResponseDetails(order),
      });
    }
    if (fulfillmentInProgress) {
      return res.status(200).json(completedResponse(orderId, successPayment.cf_payment_id, order, {
        processing: true,
      }));
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const itemTotal = items.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1),
      0
    );
    const codAdvance = isCOD ? Number(order.cod_advance || 0) : 0;
    const codBalance = isCOD ? Math.max(Number(order.total || 0) - codAdvance, 1) : Number(order.total || 0);
    const codRatio = isCOD && itemTotal > 0 ? codBalance / itemTotal : 1;
    const shiprocketItems = items.map(item => ({
      name: String(item.name || 'Product') + (isCOD ? ' (COD balance)' : ''),
      sku: `SKU-${item.id}`,
      units: Number(item.qty || 1),
      selling_price: Math.max(Math.round(Number(item.price || 0) * codRatio), 1),
      discount: 0,
      tax: '',
      hsn: 9405,
    }));
    const shiprocketSubTotal = shiprocketItems.reduce(
      (sum, item) => sum + item.selling_price * item.units,
      0
    );
    const now = new Date();
    const orderDate = `${now.toISOString().split('T')[0]} ${now.toTimeString().split(' ')[0]}`;

    const shiprocketResponse = await fetchWithTimeout(
      'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${shiprocketToken}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          order_date: orderDate,
          pickup_location: 'Primary',
          billing_customer_name: order.name,
          billing_last_name: '',
          billing_address: order.address,
          billing_city: order.city,
          billing_pincode: order.pincode,
          billing_state: order.state,
          billing_country: 'India',
          billing_email: order.email,
          billing_phone: order.phone,
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
      }
    );
    const shiprocketData = await shiprocketResponse.json();

    if (!shiprocketResponse.ok || shiprocketData.errors || shiprocketData.status_code >= 400) {
      console.error(
        'Shiprocket order creation failed:',
        shiprocketResponse.status,
        JSON.stringify(shiprocketData).slice(0, 300)
      );
      await patchOrder(orderId, { status: 'Confirmed' });
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        note: `Payment successful. Create the Shiprocket order manually for ${orderId}.`,
        ...orderResponseDetails(order),
      });
    }

    let shipmentPatch = shiprocketFields({
      shipment_id: shiprocketData.shipment_id,
      awb_code: shiprocketData.awb_code,
      courier_name: shiprocketData.courier_name,
    });
    if (!shipmentPatch) {
      const recoveredOrder = await findShiprocketOrder(shiprocketToken, orderId);
      shipmentPatch = shiprocketFields(recoveredOrder);
    }
    if (!shipmentPatch) {
      console.error(`Shiprocket created order ${orderId} without returning a shipment ID`);
      await patchOrder(orderId, { status: 'Confirmed' });
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'manual_review',
        note: `Review Shiprocket order ${orderId} manually before retrying.`,
        ...orderResponseDetails(order),
      });
    }
    await patchOrder(orderId, shipmentPatch);

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_id: successPayment.cf_payment_id,
      shiprocket_status: 'created',
      shiprocket: shiprocketData,
      ...orderResponseDetails(order),
    });
  } catch (error) {
    console.error('Verify payment error:', error.message);
    return res.status(500).json({ error: 'Could not process the paid order. Please try again.' });
  }
};
