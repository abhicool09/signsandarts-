async function getShiprocketToken() {
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    throw new Error('Shiprocket credentials are not configured');
  }

  console.log('Attempting Shiprocket login with email:', email);
  
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password }),
  });

  const text = await response.text();
  console.log('Shiprocket raw response:', text.substring(0, 200));
  
  let data;
  try {
    data = JSON.parse(text);
  } catch(e) {
    throw new Error('Shiprocket returned invalid JSON: ' + text.substring(0, 100));
  }

  if (!data.token) {
    throw new Error('No token in response: ' + JSON.stringify(data).substring(0, 200));
  }
  
  return data.token;
}

// Save/update the order in Supabase. Never throws — order tracking must not break checkout.
async function saveOrderToSupabase(orderId, orderData, isCOD) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return; // not configured yet — skip silently
  try {
    const row = {
      order_id: orderId,
      name: String(orderData.name || '').trim(),
      phone: String(orderData.phone || '').trim(),
      email: String(orderData.email || '').trim(),
      address: String(orderData.address || '').trim(),
      city: String(orderData.city || '').trim(),
      state: String(orderData.state || '').trim(),
      pincode: String(orderData.pincode || '').trim(),
      items: orderData.items || [],
      total: Number(orderData.total || 0),
      payment_mode: isCOD ? 'COD' : 'Online',
      cod_advance: isCOD ? Number(orderData.codAdvance || 200) : 0,
      status: 'Confirmed',
      updated_at: new Date().toISOString(),
    };
    await fetch(`${url}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(row),
    });
  } catch (e) {
    console.error('Supabase saveOrder failed:', e.message);
  }
}

// After Shiprocket creates the shipment, store its id (+ AWB if already assigned) on the order.
async function updateOrderShiprocket(orderId, srData) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || !srData) return;
  try {
    const patch = { shiprocket_id: String(srData.shipment_id || ''), updated_at: new Date().toISOString() };
    if (srData.awb_code) {
      patch.tracking_number = String(srData.awb_code);
      patch.courier = String(srData.courier_name || '');
      patch.tracking_url = 'https://shiprocket.co/tracking/' + srData.awb_code;
    }
    await fetch(`${url}/rest/v1/orders?order_id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(patch),
    });
  } catch (e) {
    console.error('updateOrderShiprocket failed:', e.message);
  }
}

// Alert the shop owner about a new order (WhatsApp + email). Never throws.
async function notifyNewOrder(orderId, orderData, isCOD) {
  const total = Number(orderData.total || 0);
  const items = (orderData.items || []).map(i => `${i.name}${i.qty > 1 ? ' x' + i.qty : ''}`).join(', ');
  const pay = isCOD ? `COD — Rs ${orderData.codAdvance || 200} advance paid (order total Rs ${total})` : `Online — Rs ${total} paid`;
  const text =
    `NEW ORDER - Signs and Arts\n` +
    `Order ID: ${orderId}\n` +
    `Amount: ${pay}\n` +
    `Name: ${orderData.name || ''}\n` +
    `Phone: ${orderData.phone || ''}\n` +
    `Address: ${orderData.address || ''}, ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}\n` +
    `Items: ${items}`;

  // 1) WhatsApp to owner via Twilio
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM && process.env.TWILIO_WHATSAPP_TO) {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const body = new URLSearchParams({
        From: process.env.TWILIO_WHATSAPP_FROM,
        To: process.env.TWILIO_WHATSAPP_TO,
        Body: text,
      }).toString();
      await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
    }
  } catch (e) { console.error('Twilio WhatsApp alert failed:', e.message); }

  // 1b) WhatsApp to owner via CallMeBot (free alternative)
  try {
    if (process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_APIKEY) {
      const u = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(process.env.CALLMEBOT_PHONE)}&text=${encodeURIComponent(text)}&apikey=${encodeURIComponent(process.env.CALLMEBOT_APIKEY)}`;
      await fetch(u);
    }
  } catch (e) { console.error('WhatsApp alert failed:', e.message); }

  // 2) Email via Resend
  try {
    if (process.env.RESEND_API_KEY) {
      const rows = [
        ['Order ID', orderId], ['Amount', pay], ['Name', orderData.name || ''],
        ['Phone', orderData.phone || ''],
        ['Address', `${orderData.address || ''}, ${orderData.city || ''}, ${orderData.state || ''} - ${orderData.pincode || ''}`],
        ['Email', orderData.email || ''], ['Items', items],
      ].map(([k, v]) => `<tr><td style="padding:6px 12px;color:#777;border-bottom:1px solid #eee">${k}</td><td style="padding:6px 12px;font-weight:600;border-bottom:1px solid #eee">${String(v).replace(/</g, '&lt;')}</td></tr>`).join('');
      const html = `<div style="font-family:Arial,sans-serif;max-width:560px"><h2 style="color:#1e8a44">New Order Received</h2><table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table><p style="color:#777;font-size:12px;margin-top:16px">Signs and Arts order alert</p></div>`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.ORDER_ALERT_FROM || 'Signs and Arts <onboarding@resend.dev>',
          to: [process.env.ORDER_ALERT_EMAIL || 'hello@signsandarts.in'],
          subject: `New Order ${orderId} - Rs ${total}`,
          html,
        }),
      });
    }
  } catch (e) { console.error('Email alert failed:', e.message); }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function getSafeBillingEmail(email) {
  const trimmedEmail = String(email || '').trim().toLowerCase();
  if (isValidEmail(trimmedEmail)) return trimmedEmail;

  const fallbackEmail = String(process.env.SHIPROCKET_EMAIL || 'signsandartsapi@gmail.com').trim().toLowerCase();
  if (isValidEmail(fallbackEmail)) return fallbackEmail;

  return 'signsandartsapi@gmail.com';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { orderId, orderData } = req.body;
  if (!orderId) return res.status(400).json({ error: 'Order ID required' });
  if (!orderData || !Array.isArray(orderData.items) || orderData.items.length === 0) {
    return res.status(400).json({ error: 'Order data with items is required' });
  }
  if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
    return res.status(500).json({ error: 'Cashfree credentials are not configured' });
  }

  // COD flag — only addition to original
  const isCOD = orderData && orderData.isCOD === true;

  // ── 1. Verify payment with Cashfree ──────────────────────────────────────
  try {
    const cfResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const payments = await cfResponse.json();

    if (!cfResponse.ok) {
      return res.status(400).json({ error: 'Payment verification failed', details: payments });
    }

    const successPayment = Array.isArray(payments)
      ? payments.find(p => p.payment_status === 'SUCCESS')
      : null;

    if (!successPayment) {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // ── 1b. Save order to Supabase (for customer order tracking) ─────────────
    await saveOrderToSupabase(orderId, orderData, isCOD);

    // ── 1c. Alert the shop owner (WhatsApp + email) about the new order ──────
    await notifyNewOrder(orderId, orderData, isCOD);

    // ── 2. Create Shiprocket Order ──────────────────────────────────────────
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
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

    const now = new Date();
    const orderDate = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0];
    const shippingAddress = {
      name: String(orderData.name || '').trim(),
      address: String(orderData.address || '').trim(),
      city: String(orderData.city || '').trim(),
      state: String(orderData.state || '').trim(),
      pincode: String(orderData.pincode || '').trim(),
      email: getSafeBillingEmail(orderData.email),
      phone: String(orderData.phone || '').trim(),
    };

    if (!shippingAddress.name || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode || !shippingAddress.phone) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        shiprocket_error: 'Missing shipping address fields required by Shiprocket',
        missing_fields: Object.keys(shippingAddress).filter(key => !shippingAddress[key] && key !== 'email'),
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

    const codAdvance = isCOD ? Number(orderData.codAdvance || 200) : 0;
    const itemTotal = orderData.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);
    const codBalance = isCOD ? Math.max(Number(orderData.total || 0) - codAdvance, 1) : Number(orderData.total || 0);
    const codRatio = isCOD && itemTotal > 0 ? codBalance / itemTotal : 1;
    const shiprocketItems = orderData.items.map(item => ({
      name: item.name + (isCOD ? ' (COD balance)' : ''),
      sku: 'SKU-' + item.id,
      units: Number(item.qty || 1),
      selling_price: Math.max(Math.round(Number(item.price || 0) * codRatio), 1),
      discount: 0,
      tax: '',
      hsn: 9405,
    }));
    const shiprocketSubTotal = shiprocketItems.reduce((sum, item) => {
      return sum + item.selling_price * item.units;
    }, 0);

    const srRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${srToken}`,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_date: orderDate,
        pickup_location: 'Primary',
        billing_customer_name: shippingAddress.name,
        billing_last_name: '',
        billing_address: shippingAddress.address,
        billing_city: shippingAddress.city,
        billing_pincode: shippingAddress.pincode,
        billing_state: shippingAddress.state,
        billing_country: 'India',
        billing_email: shippingAddress.email,
        billing_phone: shippingAddress.phone,
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
    });

    const srData = await srRes.json();
    console.log('Shiprocket order response:', JSON.stringify(srData).substring(0, 200));

    if (!srRes.ok || srData.errors || srData.status_code >= 400) {
      return res.status(200).json({
        success: true,
        order_id: orderId,
        payment_id: successPayment.cf_payment_id,
        shiprocket_status: 'failed',
        shiprocket_error: srData,
        note: 'Payment successful! Please create Shiprocket order manually for Order ID: ' + orderId,
      });
    }

    // store Shiprocket shipment id (+ AWB if assigned) for live order tracking
    await updateOrderShiprocket(orderId, srData);

    return res.status(200).json({
      success: true,
      order_id: orderId,
      payment_id: successPayment.cf_payment_id,
      shiprocket_status: 'created',
      shiprocket: srData,
    });

  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: err.message });
  }
};
