const assert = require('assert');

const {
  amountsMatch,
  canonicalizeOrderData,
} = require('../api/_lib/checkout');
const createOrder = require('../api/create-order');
const verifyPayment = require('../api/verify-payment');
const replacementRequest = require('../api/replacement-request');
const { take } = require('../api/_lib/rate-limit');

function request(body, ip = '203.0.113.10') {
  return { method: 'POST', body, headers: { 'x-forwarded-for': ip } };
}

function response() {
  return {
    code: 200,
    body: null,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

function customerOrder(item, isCOD = false) {
  return {
    name: 'Test Customer',
    phone: '9392878946',
    email: 'test@example.com',
    address: '1 Test Street',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500060',
    items: [Object.assign({ qty: 1 }, item)],
    isCOD,
  };
}

async function testCatalogPricing() {
  const optical = canonicalizeOrderData(
    customerOrder({ id: 'opticals-led', name: 'Fake', price: 1 })
  );
  assert.strictEqual(optical.items[0].price, 6330);
  assert.strictEqual(optical.items[0].name, 'Opticals LED Sign Board - Red & White 24x18');
  assert.strictEqual(optical.paymentAmount, 6330);

  const pixelCod = canonicalizeOrderData(
    customerOrder({ id: 'pixel-3921', price: 1 }, true)
  );
  assert.strictEqual(pixelCod.productTotal, 165);
  assert.strictEqual(pixelCod.shippingCharge, 125);
  assert.strictEqual(pixelCod.total, 340);
  assert.strictEqual(pixelCod.paymentAmount, 200);

  const largeCod = canonicalizeOrderData(
    customerOrder({ id: 'clinic-medical-led', price: 1 }, true)
  );
  assert.strictEqual(largeCod.total, 6869);
  assert.strictEqual(largeCod.paymentAmount, 3819);

  const largeCodQuantity = canonicalizeOrderData(
    customerOrder({ id: 'clinic-medical-led', price: 1, qty: 2 }, true)
  );
  assert.strictEqual(largeCodQuantity.total, 13688);
  assert.strictEqual(largeCodQuantity.paymentAmount, 7638);

  const splitLargeCodQuantity = canonicalizeOrderData({
    ...customerOrder({ id: 'clinic-medical-led', price: 1 }, true),
    items: [
      { id: 'clinic-medical-led', price: 1, qty: 1 },
      { id: 'clinic-medical-led', price: 1, qty: 1 },
    ],
  });
  assert.strictEqual(splitLargeCodQuantity.total, 13688);
  assert.strictEqual(splitLargeCodQuantity.paymentAmount, 7638);

  assert.throws(
    () => canonicalizeOrderData(customerOrder({ id: 'p1', price: 1 })),
    /Unknown product or variant/
  );
  assert.throws(
    () => canonicalizeOrderData({
      ...customerOrder({ id: 'clinic-medical-led', price: 6819 }),
      items: Array.from({ length: 20 }, (_, index) => ({
        id: 'clinic-medical-led',
        price: 6819,
        qty: index === 0 ? 99 : 1,
      })),
    }),
    /too large/
  );
  assert(amountsMatch(200, 200));
  assert(!amountsMatch(1, 6330));

  const storefrontItems = [
    ['p1', 2689],
    ['p1-24"×24"', 5489],
    ['medical-pharmacy-led', 2789],
    ['medph-24"×24"', 5489],
    ['clinic-plus', 2689],
    ['neuro-plus', 2689],
    ['neuro-plus', 5489],
    ['neuroplus-24"x24"', 5489],
    ['clinic-24"×24"', 5489],
    ['green-clinic', 2689],
    ['greenclinic-24"×24"', 5489],
    ['medical-red', 2689],
    ['medicalred-24"×24"', 5489],
    ['clinic-medical-led', 6819],
    ['pharmacy-plus', 2689],
    ['pharmacy-24"×24"', 5489],
    ['optical-plus', 2689],
    ['optical-plus', 5489],
    ['opticalplus-24"x24"', 5489],
    ['dental-plus', 2689],
    ['dental-plus', 5489],
    ['dentalplus-24"x24"', 5489],
    ['ent-led', 2889],
    ['ent-led', 5489],
    ['entled-24"x24"', 5489],
    ['doctor-led', 2889],
    ['doctor-led', 5489],
    ['doctorled-24"x24"', 5489],
    ['orthopedic-led', 2889],
    ['orthopedic-led', 5489],
    ['orthopedicled-24"x24"', 5489],
    ['emergency-led', 2889],
    ['emergency-led', 5489],
    ['emergencyled-24"x24"', 5489],
    ['hospital-led', 2889],
    ['hospital-led', 5489],
    ['hospitalled-24"x24"', 5489],
    ['homeo-led', 2889],
    ['homeo-led', 5489],
    ['homeoled-24"x24"', 5489],
    ['xerox-store', 2178],
    ['dental-led', 5128],
    ['bar-led-single-indoor', 2189],
    ['tattoo-led-single-indoor', 2189],
    ['spa-open-led-single-indoor', 2189],
    ['hair-salon-led-single-indoor', 2189],
    ['open-24-hours-led-single-indoor', 2189],
    ['open-close-led-open-single', 2189],
    ['open-close-led-close-single', 2189],
    ['open-close-led-combo', 3981],
    ['computer-repair-led-single-indoor', 2189],
    ['opticals-led', 6330],
    ['love-neon-pink', 400],
    ['led-strip-rf-controller', 339],
    ['pan-shop-led-sign-18x12', 2475],
    ['hilight-12v-5a-adapter', 371],
  ];
  for (const [id, price] of storefrontItems) {
    const order = canonicalizeOrderData(customerOrder({ id, price }));
    assert.strictEqual(order.items[0].price, price, `Catalog mismatch for ${id}`);
  }
}

async function testDurablePhoneRateLimit() {
  let cashfreeCalls = 0;
  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?phone=eq.')) {
      return new Response(JSON.stringify(Array.from({ length: 5 }, (_, index) => ({
        order_id: `SA-OLD-${index}`,
      }))), { status: 200 });
    }
    if (value === 'https://api.cashfree.com/pg/orders') cashfreeCalls += 1;
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = response();
  await createOrder(request({
    orderData: customerOrder({ id: 'opticals-led', price: 6330 }),
  }, '203.0.113.13'), res);
  assert.strictEqual(res.code, 429);
  assert.strictEqual(cashfreeCalls, 0);
}

async function testCreateOrderUsesServerAmount() {
  const cashfreeBodies = [];
  const savedDrafts = [];
  global.fetch = async (url, options = {}) => {
    if (url === 'https://api.cashfree.com/pg/orders') {
      const cashfreeBody = JSON.parse(options.body);
      cashfreeBodies.push(cashfreeBody);
      return new Response(JSON.stringify({
        payment_session_id: 'session-test',
        order_id: cashfreeBody.order_id,
      }), { status: 200 });
    }
    if (String(url).includes('/rest/v1/orders?phone=eq.')) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (String(url).endsWith('/rest/v1/orders')) {
      const savedDraft = JSON.parse(options.body);
      savedDrafts.push(savedDraft);
      return new Response(JSON.stringify([savedDraft]), { status: 201 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = response();
  await createOrder(request({
    amount: 1,
    orderId: 'ATTACKER-CONTROLLED-ID',
    orderData: customerOrder({ id: 'opticals-led', name: 'Expensive board', price: 1 }),
  }, '203.0.113.11'), res);

  assert.strictEqual(res.code, 200);
  assert.match(res.body.order_id, /^SA-[A-Z0-9]+-[A-F0-9]{16}$/);
  assert.notStrictEqual(res.body.order_id, 'ATTACKER-CONTROLLED-ID');
  assert.strictEqual(cashfreeBodies[0].order_id, res.body.order_id);
  assert.strictEqual(cashfreeBodies[0].order_amount, 6330);
  assert.strictEqual(savedDrafts[0].order_id, res.body.order_id);
  assert.strictEqual(savedDrafts[0].total, 6330);
  assert.strictEqual(savedDrafts[0].items[0].price, 6330);
  assert.strictEqual(savedDrafts[0].status, 'Payment Pending');

  const second = response();
  await createOrder(request({
    orderData: Object.assign(
      customerOrder({ id: 'opticals-led', price: 6330 }),
      { phone: '9392878947' }
    ),
  }, '203.0.113.12'), second);
  assert.strictEqual(second.code, 200);
  assert.notStrictEqual(second.body.order_id, res.body.order_id);
}

async function testVerificationIsIdempotentAndLogsAlertFailure() {
  let databaseOrder = Object.assign(
    { order_id: 'SA-SECURITY-2002', status: 'Payment Pending', updated_at: new Date(0).toISOString() },
    (() => {
      const data = canonicalizeOrderData(
        customerOrder({ id: 'opticals-led', price: 6330 })
      );
      return {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        items: data.items,
        total: data.total,
        payment_mode: 'Online',
        cod_advance: 0,
      };
    })()
  );
  let shiprocketCreates = 0;
  let twilioCalls = 0;
  const loggedErrors = [];
  const originalError = console.error;
  const originalWarn = console.warn;
  console.error = (...args) => loggedErrors.push(args.join(' '));
  console.warn = () => {};

  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('/rest/v1/orders?order_id=eq.') && options.method === 'PATCH') {
      const expectedFilter = new URL(value).searchParams.get('status');
      const expected = expectedFilter && expectedFilter.replace(/^eq\./, '');
      if (expected && databaseOrder.status !== expected) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      databaseOrder = Object.assign({}, databaseOrder, JSON.parse(options.body));
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('api.cashfree.com/pg/orders/') && value.endsWith('/payments')) {
      return new Response(JSON.stringify([{
        payment_status: 'SUCCESS',
        payment_amount: 6330,
        cf_payment_id: 'pay-test',
      }]), { status: 200 });
    }
    if (value.includes('api.twilio.com/')) {
      twilioCalls += 1;
      return new Response('invalid WhatsApp sender', { status: 400 });
    }
    if (value.endsWith('/external/auth/login')) {
      return new Response(JSON.stringify({ token: 'shiprocket-token' }), { status: 200 });
    }
    if (value.includes('/v1/external/orders?')) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/adhoc')) {
      shiprocketCreates += 1;
      return new Response(JSON.stringify({ shipment_id: 'shipment-1' }), { status: 200 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const first = response();
  await verifyPayment(request({ orderId: databaseOrder.order_id, orderData: { total: 1 } }, '203.0.113.21'), first);
  assert.strictEqual(first.code, 200);
  assert.strictEqual(first.body.success, true);
  assert.strictEqual(shiprocketCreates, 1);
  assert.strictEqual(twilioCalls, 1);
  assert(loggedErrors.some(line => line.includes('Twilio WhatsApp alert failed')));

  const second = response();
  await verifyPayment(request({ orderId: databaseOrder.order_id, orderData: { total: 1 } }, '203.0.113.22'), second);
  assert.strictEqual(second.code, 200);
  assert.strictEqual(second.body.idempotent, true);
  assert.strictEqual(shiprocketCreates, 1);
  assert.strictEqual(twilioCalls, 1);

  console.error = originalError;
  console.warn = originalWarn;
}

async function testConcurrentVerificationCreatesOneShipment() {
  const data = canonicalizeOrderData(customerOrder({ id: 'opticals-led', price: 6330 }));
  let databaseOrder = {
    order_id: 'SA-CONCURRENT-3003',
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    items: data.items,
    total: data.total,
    payment_mode: 'Online',
    cod_advance: 0,
    status: 'Payment Pending',
    updated_at: new Date(0).toISOString(),
  };
  let shiprocketCreates = 0;
  let alertCalls = 0;

  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('/rest/v1/orders?order_id=eq.') && options.method === 'PATCH') {
      const expectedFilter = new URL(value).searchParams.get('status');
      const expected = expectedFilter && expectedFilter.replace(/^eq\./, '');
      if (expected && databaseOrder.status !== expected) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      databaseOrder = Object.assign({}, databaseOrder, JSON.parse(options.body));
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.endsWith('/payments')) {
      return new Response(JSON.stringify([{
        payment_status: 'SUCCESS',
        payment_amount: 6330,
        cf_payment_id: 'pay-concurrent',
      }]), { status: 200 });
    }
    if (value.includes('api.twilio.com/')) {
      alertCalls += 1;
      return new Response(JSON.stringify({ sid: 'message-1' }), { status: 201 });
    }
    if (value.endsWith('/external/auth/login')) {
      return new Response(JSON.stringify({ token: 'shiprocket-token' }), { status: 200 });
    }
    if (value.includes('/v1/external/orders?')) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/adhoc')) {
      shiprocketCreates += 1;
      return new Response(JSON.stringify({ shipment_id: 'shipment-concurrent' }), { status: 200 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const first = response();
  const second = response();
  await Promise.all([
    verifyPayment(request({ orderId: databaseOrder.order_id }, '203.0.113.31'), first),
    verifyPayment(request({ orderId: databaseOrder.order_id }, '203.0.113.32'), second),
  ]);

  assert.strictEqual(first.body.success, true);
  assert.strictEqual(second.body.success, true);
  assert.strictEqual(shiprocketCreates, 1);
  assert.strictEqual(alertCalls, 1);
}

async function testShiprocketRecoveryAvoidsDuplicateCreation() {
  const data = canonicalizeOrderData(customerOrder({ id: 'opticals-led', price: 6330 }));
  let databaseOrder = {
    order_id: 'SA-RECOVERY-4004',
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    items: data.items,
    total: data.total,
    payment_mode: 'Online',
    cod_advance: 0,
    status: 'Fulfilling',
    updated_at: new Date(0).toISOString(),
  };
  let shiprocketCreates = 0;

  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('/rest/v1/orders?order_id=eq.') && options.method === 'PATCH') {
      const params = new URL(value).searchParams;
      const expectedStatus = (params.get('status') || '').replace(/^eq\./, '');
      const expectedUpdatedAt = (params.get('updated_at') || '').replace(/^eq\./, '');
      if ((expectedStatus && databaseOrder.status !== expectedStatus) ||
          (expectedUpdatedAt && databaseOrder.updated_at !== expectedUpdatedAt)) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      databaseOrder = Object.assign({}, databaseOrder, JSON.parse(options.body));
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.endsWith('/payments')) {
      return new Response(JSON.stringify([{
        payment_status: 'SUCCESS',
        payment_amount: 6330,
        cf_payment_id: 'pay-recovery',
      }]), { status: 200 });
    }
    if (value.endsWith('/external/auth/login')) {
      return new Response(JSON.stringify({ token: 'shiprocket-token' }), { status: 200 });
    }
    if (value.includes('/v1/external/orders?')) {
      return new Response(JSON.stringify({
        data: [{
          id: 123,
          channel_order_id: databaseOrder.order_id,
          shipments: [{ id: 456, awb: 'AWB123', courier: 'Test Courier' }],
        }],
      }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/adhoc')) {
      shiprocketCreates += 1;
      return new Response(JSON.stringify({ shipment_id: 'duplicate' }), { status: 200 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = response();
  await verifyPayment(request({ orderId: databaseOrder.order_id }, '203.0.113.41'), res);
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.body.recovered, true);
  assert.strictEqual(shiprocketCreates, 0);
  assert.strictEqual(databaseOrder.shiprocket_id, '456');
  assert.strictEqual(databaseOrder.tracking_number, 'AWB123');
}

async function testConcurrentStaleFulfillmentCreatesOneShipment() {
  const data = canonicalizeOrderData(customerOrder({ id: 'opticals-led', price: 6330 }));
  let databaseOrder = {
    order_id: 'SA-STALE-5005',
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    items: data.items,
    total: data.total,
    payment_mode: 'Online',
    cod_advance: 0,
    status: 'Fulfilling',
    updated_at: new Date(0).toISOString(),
  };
  let shiprocketCreates = 0;

  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('/rest/v1/orders?order_id=eq.') && options.method === 'PATCH') {
      const params = new URL(value).searchParams;
      const expectedStatus = (params.get('status') || '').replace(/^eq\./, '');
      const expectedUpdatedAt = (params.get('updated_at') || '').replace(/^eq\./, '');
      if ((expectedStatus && databaseOrder.status !== expectedStatus) ||
          (expectedUpdatedAt && databaseOrder.updated_at !== expectedUpdatedAt)) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      databaseOrder = Object.assign({}, databaseOrder, JSON.parse(options.body));
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.endsWith('/payments')) {
      return new Response(JSON.stringify([{
        payment_status: 'SUCCESS',
        payment_amount: 6330,
        cf_payment_id: 'pay-stale',
      }]), { status: 200 });
    }
    if (value.endsWith('/external/auth/login')) {
      return new Response(JSON.stringify({ token: 'shiprocket-token' }), { status: 200 });
    }
    if (value.includes('/v1/external/orders?')) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/adhoc')) {
      shiprocketCreates += 1;
      return new Response(JSON.stringify({ shipment_id: 'shipment-stale' }), { status: 200 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const first = response();
  const second = response();
  await Promise.all([
    verifyPayment(request({ orderId: databaseOrder.order_id }, '203.0.113.51'), first),
    verifyPayment(request({ orderId: databaseOrder.order_id }, '203.0.113.52'), second),
  ]);

  assert.strictEqual(first.body.success, true);
  assert.strictEqual(second.body.success, true);
  assert.strictEqual(shiprocketCreates, 1);
}

async function testReplacementRequestCreatesReturnAndReplacement() {
  const data = canonicalizeOrderData(customerOrder({ id: 'opticals-led', price: 6330 }));
  const databaseOrder = {
    order_id: 'SA-REPLACE-6006',
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    items: data.items,
    total: data.total,
    payment_mode: 'Online',
    cod_advance: 0,
    status: 'Delivered',
    updated_at: new Date(0).toISOString(),
  };
  const createdReturns = [];
  const createdReplacements = [];

  global.fetch = async (url, options = {}) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.') && (!options.method || options.method === 'GET')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.endsWith('/external/auth/login')) {
      return new Response(JSON.stringify({ token: 'shiprocket-token' }), { status: 200 });
    }
    if (value.includes('/v1/external/orders?')) {
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/return')) {
      createdReturns.push(JSON.parse(options.body));
      return new Response(JSON.stringify({
        order_id: 170872392,
        shipment_id: 170411259,
        status: 'RETURN PENDING',
        status_code: 21,
      }), { status: 200 });
    }
    if (value.endsWith('/external/orders/create/adhoc')) {
      createdReplacements.push(JSON.parse(options.body));
      return new Response(JSON.stringify({
        order_id: 170872393,
        shipment_id: 170411260,
      }), { status: 200 });
    }
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = response();
  await replacementRequest(request({
    orderId: databaseOrder.order_id,
    phone: databaseOrder.phone,
    reason: 'not_working',
    issueDetails: 'Adapter does not power on',
    replacementOnlyAccepted: true,
  }, '203.0.113.61'), res);

  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.body.success, true);
  assert.strictEqual(res.body.return_order_id, 'RET-SA-REPLACE-6006');
  assert.strictEqual(res.body.replacement_order_id, 'RPL-SA-REPLACE-6006');
  assert.strictEqual(createdReturns.length, 1);
  assert.strictEqual(createdReplacements.length, 1);
  assert.strictEqual(createdReturns[0].pickup_phone, databaseOrder.phone);
  assert.strictEqual(createdReturns[0].shipping_customer_name, 'Signs and Arts');
  assert.strictEqual(createdReturns[0].order_items[0].return_reason, "Item defective or doesn't work");
  assert.strictEqual(createdReturns[0].payment_method, 'PREPAID');
  assert.strictEqual(createdReplacements[0].billing_phone, databaseOrder.phone);
  assert.strictEqual(createdReplacements[0].payment_method, 'Prepaid');
  assert.match(createdReplacements[0].order_items[0].name, /\(Replacement\)$/);
}

async function testReplacementRequestRejectsWrongPhoneBeforeShiprocket() {
  const data = canonicalizeOrderData(customerOrder({ id: 'opticals-led', price: 6330 }));
  const databaseOrder = {
    order_id: 'SA-REPLACE-7007',
    name: data.name,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    items: data.items,
    total: data.total,
    payment_mode: 'Online',
    cod_advance: 0,
    status: 'Delivered',
    updated_at: new Date(0).toISOString(),
  };
  let shiprocketCalls = 0;

  global.fetch = async (url) => {
    const value = String(url);
    if (value.includes('/rest/v1/orders?order_id=eq.')) {
      return new Response(JSON.stringify([databaseOrder]), { status: 200 });
    }
    if (value.includes('shiprocket')) shiprocketCalls += 1;
    throw new Error(`Unexpected URL: ${url}`);
  };

  const res = response();
  await replacementRequest(request({
    orderId: databaseOrder.order_id,
    phone: '9000000000',
    reason: 'damaged_product',
    replacementOnlyAccepted: true,
  }, '203.0.113.62'), res);

  assert.strictEqual(res.code, 404);
  assert.strictEqual(shiprocketCalls, 0);
}

function testRateLimiter() {
  const key = `test-${Date.now()}-${Math.random()}`;
  assert.strictEqual(take(key, 2, 60000).allowed, true);
  assert.strictEqual(take(key, 2, 60000).allowed, true);
  assert.strictEqual(take(key, 2, 60000).allowed, false);
}

async function main() {
  const originalFetch = global.fetch;
  const originalEnv = Object.assign({}, process.env);
  try {
    process.env.CASHFREE_APP_ID = 'cashfree-id';
    process.env.CASHFREE_SECRET_KEY = 'cashfree-secret';
    process.env.SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_SERVICE_KEY = 'supabase-key';
    process.env.SHIPROCKET_EMAIL = 'shiprocket@example.com';
    process.env.SHIPROCKET_PASSWORD = 'shiprocket-password';
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'twilio-token';
    process.env.TWILIO_WHATSAPP_FROM = 'whatsapp:+10000000000';
    process.env.TWILIO_WHATSAPP_TO = 'whatsapp:+919392878946';
    delete process.env.CALLMEBOT_PHONE;
    delete process.env.CALLMEBOT_APIKEY;
    delete process.env.RESEND_API_KEY;

    await testCatalogPricing();
    testRateLimiter();
    await testCreateOrderUsesServerAmount();
    await testDurablePhoneRateLimit();
    await testVerificationIsIdempotentAndLogsAlertFailure();
    await testConcurrentVerificationCreatesOneShipment();
    await testShiprocketRecoveryAvoidsDuplicateCreation();
    await testConcurrentStaleFulfillmentCreatesOneShipment();
    await testReplacementRequestCreatesReturnAndReplacement();
    await testReplacementRequestRejectsWrongPhoneBeforeShiprocket();
    console.log('CHECKOUT_SECURITY_TESTS=PASS');
  } finally {
    global.fetch = originalFetch;
    for (const key of Object.keys(process.env)) {
      if (!(key in originalEnv)) delete process.env[key];
    }
    Object.assign(process.env, originalEnv);
  }
}

main().catch(error => {
  process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
  process.exitCode = 1;
});
