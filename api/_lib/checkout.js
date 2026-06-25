const pixelProducts = require('../../pixel-led/products.json');

const COD_CHARGE = 50;
const LOW_PRICE_SHIPPING = 125;
const DEFAULT_COD_ADVANCE = 200;
const MAX_ORDER_TOTAL = 500000;

const fixedProducts = new Map([
  ['clinic-medical-led', { name: 'Clinic Medical LED Sign Board - Green Red 24x18', price: 6819, codAdvance: 3819 }],
  ['xerox-store', { name: 'Xerox Store LED Sign Board - White & Red 18x12', price: 2178 }],
  ['dental-led', { name: 'Dental LED Sign Board - Red & White 24x18', price: 5128 }],
  ['opticals-led', { name: 'Opticals LED Sign Board - Red & White 24x18', price: 6330 }],
  ['love-neon-pink', { name: 'Love Neon LED Sign - Pink', price: 400 }],
  ['led-strip-rf-controller', { name: 'Mini RF Remote Controller for Single Color LED Strips', price: 339 }],
  ['pan-shop-led-sign-18x12', { name: 'PAN Shop LED Sign Board 18x12 Double Sided', price: 2475 }],
  ['hilight-12v-5a-adapter', { name: 'Hilight 12V 5A 60W LED Power Adapter', price: 371 }],
  ['bar-led-single-indoor', { name: 'Bar LED Sign Board - Multicolor 18x12 Single Sided Indoor', price: 1829 }],
  ['bar-led-double-outdoor', { name: 'Bar LED Sign Board - Multicolor 18x12 Double Sided Outdoor', price: 2287 }],
]);

for (const product of pixelProducts) {
  fixedProducts.set(product.id, {
    name: product.name,
    price: Number(product.price),
  });
}

const variantFamilies = [
  {
    matches: id => id === 'medical-pharmacy-led' || /^medph(?:-|$)/.test(id),
    variants: {
      2789: 'Medical & Pharmacy LED Sign Board - Green 18x18',
      5489: 'Medical & Pharmacy LED Sign Board - Green 24x24',
    },
  },
  {
    matches: id => /^p1(?:-|$)/.test(id),
    variants: {
      2689: 'Medical Plus LED Sign Board - Green 18x18',
      5489: 'Medical Plus LED Sign Board - Green 24x24',
    },
  },
  {
    matches: id => id === 'green-clinic' || /^greenclinic(?:-|$)/.test(id),
    variants: {
      2689: 'Clinic LED Sign Board - Green 18x18',
      5489: 'Clinic LED Sign Board - Green 24x24',
    },
  },
  {
    matches: id => id === 'medical-red' || /^medicalred(?:-|$)/.test(id),
    variants: {
      2689: 'Medical LED Sign Board - Red Green 18x18',
      5489: 'Medical LED Sign Board - Red Green 24x24',
    },
  },
  {
    matches: id => id === 'clinic-plus' || /^clinic-(?:18|24)/.test(id),
    variants: {
      2689: 'Clinic Plus LED Sign Board - Red White 18x18',
      5489: 'Clinic Plus LED Sign Board - Red White 24x24',
    },
  },
  {
    matches: id => id === 'pharmacy-plus' || /^pharmacy-(?:18|24)/.test(id),
    variants: {
      2689: 'Pharmacy Plus LED Sign Board - Green 18x18',
      5489: 'Pharmacy Plus LED Sign Board - Green 24x24',
    },
  },
];

function cleanText(value, field, maxLength) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${field} is required`);
  if (text.length > maxLength) throw new Error(`${field} is too long`);
  return text;
}

function canonicalProduct(item) {
  const id = cleanText(item && item.id, 'Product ID', 120);
  const fixed = fixedProducts.get(id);
  if (fixed) return { id, name: fixed.name, price: fixed.price, codAdvance: fixed.codAdvance || 0 };

  const family = variantFamilies.find(entry => entry.matches(id));
  const requestedPrice = Number(item && item.price);
  const name = family && family.variants[requestedPrice];
  if (!name) throw new Error(`Unknown product or variant: ${id}`);

  return { id, name, price: requestedPrice, codAdvance: 0 };
}

function canonicalizeOrderData(orderData) {
  if (!orderData || typeof orderData !== 'object') throw new Error('Order data is required');
  if (!Array.isArray(orderData.items) || orderData.items.length === 0 || orderData.items.length > 20) {
    throw new Error('Order must contain between 1 and 20 products');
  }

  const phone = String(orderData.phone || '').replace(/\D/g, '');
  if (phone.length !== 10) throw new Error('A valid 10-digit phone number is required');

  const email = cleanText(orderData.email, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email address is required');

  const items = orderData.items.map(item => {
    const product = canonicalProduct(item);
    const qty = Number(item && item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }
    return { id: product.id, name: product.name, price: product.price, qty, codAdvance: product.codAdvance };
  });

  const productTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shippingCharge = productTotal > 0 && productTotal < 300 ? LOW_PRICE_SHIPPING : 0;
  const isCOD = orderData.isCOD === true;
  const codCharge = isCOD ? COD_CHARGE : 0;
  const total = productTotal + shippingCharge + codCharge;
  if (total > MAX_ORDER_TOTAL) {
    throw new Error('This order is too large for online checkout. Please contact us for a bulk order.');
  }
  const specialAdvance = items.reduce(
    (advance, item) => advance + Number(item.codAdvance || 0) * item.qty,
    0
  );
  const requiredAdvance = Math.max(DEFAULT_COD_ADVANCE, specialAdvance);
  const codAdvance = isCOD ? Math.min(requiredAdvance, total) : 0;
  const paymentAmount = isCOD ? codAdvance : total;

  return {
    name: cleanText(orderData.name, 'Name', 120),
    phone,
    email,
    address: cleanText(orderData.address, 'Address', 500),
    city: cleanText(orderData.city, 'City', 120),
    state: cleanText(orderData.state, 'State', 120),
    pincode: (() => {
      const pincode = cleanText(orderData.pincode, 'PIN code', 6);
      if (!/^\d{6}$/.test(pincode)) throw new Error('A valid 6-digit PIN code is required');
      return pincode;
    })(),
    items: items.map(({ codAdvance: unused, ...item }) => item),
    total,
    productTotal,
    shippingCharge,
    isCOD,
    codAdvance,
    codCharge,
    paymentAmount,
  };
}

function orderRow(orderId, orderData, status = 'Payment Pending') {
  return {
    order_id: orderId,
    name: orderData.name,
    phone: orderData.phone,
    email: orderData.email,
    address: orderData.address,
    city: orderData.city,
    state: orderData.state,
    pincode: orderData.pincode,
    items: orderData.items,
    total: orderData.total,
    payment_mode: orderData.isCOD ? 'COD' : 'Online',
    cod_advance: orderData.codAdvance,
    status,
    updated_at: new Date().toISOString(),
  };
}

function expectedPaymentAmount(order) {
  return String(order.payment_mode || '').toUpperCase() === 'COD'
    ? Number(order.cod_advance || 0)
    : Number(order.total || 0);
}

function amountsMatch(actual, expected) {
  return Number.isFinite(Number(actual)) &&
    Number.isFinite(Number(expected)) &&
    Math.abs(Number(actual) - Number(expected)) < 0.01;
}

module.exports = {
  amountsMatch,
  canonicalizeOrderData,
  expectedPaymentAmount,
  orderRow,
};
