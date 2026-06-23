const fs = require('fs');
const path = require('path');

const targetRoot = path.resolve(process.argv[2] || path.join(__dirname, '..'));

function replaceRequired(content, from, to, label) {
  if (content.includes(to)) return content;
  if (!content.includes(from)) throw new Error(`Could not find ${label}`);
  return content.replace(from, to);
}

function updateFile(relativePath, transform) {
  const filePath = path.join(targetRoot, relativePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = transform(original);
  if (updated !== original) fs.writeFileSync(filePath, updated, 'utf8');
}

updateFile('index.html', index => {
  index = replaceRequired(
    index,
    "  var COD_CHARGE = 50;\n",
    "  var COD_CHARGE = 50;\n  var LOW_PRICE_SHIPPING = 125;\n\n  function getShippingCharge() {\n    const total = getTotal();\n    return total > 0 && total < 300 ? LOW_PRICE_SHIPPING : 0;\n  }\n",
    'homepage COD charge'
  );
  index = replaceRequired(
    index,
    "    const total = getTotal();\n    const advance = getCodAdvance(total);\n    const codTotal = total + COD_CHARGE;\n",
    "    const total = getTotal();\n    const shipping = getShippingCharge();\n    const onlineTotal = total + shipping;\n    const advance = getCodAdvance(onlineTotal);\n    const codTotal = onlineTotal + COD_CHARGE;\n",
    'homepage checkout totals'
  );
  index = replaceRequired(
    index,
    "        ${cart.map(i => `<div class=\"os-item\"><span>${i.name} x${i.qty}</span><span>&#8377;${(i.price*i.qty).toLocaleString('en-IN')}</span></div>`).join('')}\n        <div class=\"os-item\" style=\"color:#e67e22;font-weight:600;\"><span>COD Advance (pay now)</span>",
    "        ${cart.map(i => `<div class=\"os-item\"><span>${i.name} x${i.qty}</span><span>&#8377;${(i.price*i.qty).toLocaleString('en-IN')}</span></div>`).join('')}\n        ${shipping ? `<div class=\"os-item\"><span>Shipping Charge</span><span>&#8377;${shipping.toLocaleString('en-IN')}</span></div>` : ''}\n        <div class=\"os-item\" style=\"color:#e67e22;font-weight:600;\"><span>COD Advance (pay now)</span>",
    'homepage COD shipping row'
  );
  index = replaceRequired(
    index,
    "        ${cart.map(i => `<div class=\"os-item\"><span>${i.name} x${i.qty}</span><span>&#8377;${(i.price*i.qty).toLocaleString('en-IN')}</span></div>`).join('')}\n        <div class=\"os-total\"><span>Total Payable</span><span>&#8377;${total.toLocaleString('en-IN')}</span></div>",
    "        ${cart.map(i => `<div class=\"os-item\"><span>${i.name} x${i.qty}</span><span>&#8377;${(i.price*i.qty).toLocaleString('en-IN')}</span></div>`).join('')}\n        ${shipping ? `<div class=\"os-item\"><span>Shipping Charge</span><span>&#8377;${shipping.toLocaleString('en-IN')}</span></div>` : ''}\n        <div class=\"os-total\"><span>Total Payable</span><span>&#8377;${onlineTotal.toLocaleString('en-IN')}</span></div>",
    'homepage online shipping row'
  );
  index = replaceRequired(
    index,
    "    const total = getTotal();\n    const isCOD = payMode === 'cod';\n    const codAdvance = isCOD ? getCodAdvance(total) : 0;\n    const payAmount = isCOD ? codAdvance : total;\n    const orderTotal = isCOD ? total + COD_CHARGE : total;\n",
    "    const total = getTotal();\n    const shipping = getShippingCharge();\n    const onlineTotal = total + shipping;\n    const isCOD = payMode === 'cod';\n    const codAdvance = isCOD ? getCodAdvance(onlineTotal) : 0;\n    const payAmount = isCOD ? codAdvance : onlineTotal;\n    const orderTotal = isCOD ? onlineTotal + COD_CHARGE : onlineTotal;\n",
    'homepage payment totals'
  );
  index = replaceRequired(
    index,
    "      productTotal: total,\n      isCOD: isCOD,",
    "      productTotal: total,\n      shippingCharge: shipping,\n      isCOD: isCOD,",
    'homepage order shipping data'
  );
  return index;
});

updateFile('led-strip-remote-controller/index.html', html => {
  html = replaceRequired(
    html,
    "    var COD_CHARGE = 50;\n",
    "    var COD_CHARGE = 50;\n    var SHIPPING_CHARGE = PRODUCT_PRICE < 300 ? 125 : 0;\n",
    'controller shipping constant'
  );
  html = replaceRequired(
    html,
    "        var codTotal = PRODUCT_PRICE + COD_CHARGE;\n",
    "        var codTotal = PRODUCT_PRICE + SHIPPING_CHARGE + COD_CHARGE;\n",
    'controller COD total'
  );
  html = replaceRequired(
    html,
    "'<div class=\"os-item\"><span>Mini RF LED Strip Controller x1</span><span>&#8377;' + formatPrice(PRODUCT_PRICE) + '</span></div>' +\n          '<div class=\"os-item\"><span>COD Advance",
    "'<div class=\"os-item\"><span>Mini RF LED Strip Controller x1</span><span>&#8377;' + formatPrice(PRODUCT_PRICE) + '</span></div>' +\n          '<div class=\"os-item\"><span>Shipping Charge</span><span>&#8377;' + formatPrice(SHIPPING_CHARGE) + '</span></div>' +\n          '<div class=\"os-item\"><span>COD Advance",
    'controller COD shipping row'
  );
  html = replaceRequired(
    html,
    "'<div class=\"os-item\"><span>Mini RF LED Strip Controller x1</span><span>&#8377;' + formatPrice(PRODUCT_PRICE) + '</span></div>' +\n          '<div class=\"os-total\"><span>Total Payable</span><span>&#8377;' + formatPrice(PRODUCT_PRICE) + '</span></div>';",
    "'<div class=\"os-item\"><span>Mini RF LED Strip Controller x1</span><span>&#8377;' + formatPrice(PRODUCT_PRICE) + '</span></div>' +\n          '<div class=\"os-item\"><span>Shipping Charge</span><span>&#8377;' + formatPrice(SHIPPING_CHARGE) + '</span></div>' +\n          '<div class=\"os-total\"><span>Total Payable</span><span>&#8377;' + formatPrice(PRODUCT_PRICE + SHIPPING_CHARGE) + '</span></div>';",
    'controller online shipping row'
  );
  html = replaceRequired(
    html,
    ": 'Pay &#8377;' + PRODUCT_PRICE + ' Securely';",
    ": 'Pay &#8377;' + formatPrice(PRODUCT_PRICE + SHIPPING_CHARGE) + ' Securely';",
    'controller payment button'
  );
  html = replaceRequired(
    html,
    "      var payAmount = isCOD ? COD_ADVANCE : PRODUCT_PRICE;\n      var orderTotal = isCOD ? PRODUCT_PRICE + COD_CHARGE : PRODUCT_PRICE;\n",
    "      var payAmount = isCOD ? COD_ADVANCE : PRODUCT_PRICE + SHIPPING_CHARGE;\n      var orderTotal = isCOD ? PRODUCT_PRICE + SHIPPING_CHARGE + COD_CHARGE : PRODUCT_PRICE + SHIPPING_CHARGE;\n",
    'controller payment totals'
  );
  html = replaceRequired(
    html,
    "        productTotal: PRODUCT_PRICE,\n        isCOD: isCOD,",
    "        productTotal: PRODUCT_PRICE,\n        shippingCharge: SHIPPING_CHARGE,\n        isCOD: isCOD,",
    'controller order shipping data'
  );
  return html;
});

updateFile('love-neon-led-sign/index.html', html => {
  html = replaceRequired(
    html,
    "    <div class=\"os-item\"><span>Love Neon LED Sign — Pink x1</span><span>&#8377;400</span></div>\n    <div class=\"os-total\"><span>Total Payable</span><span>&#8377;400</span></div>",
    "    <div id=\"orderSummary\"></div>",
    'love order summary'
  );
  html = replaceRequired(
    html,
    "  var COD_CHARGE = 50;\n",
    "  var COD_CHARGE = 50;\n  var PRODUCT_PRICE = 400;\n  var SHIPPING_CHARGE = PRODUCT_PRICE < 500 ? 125 : 0;\n\n  function updateOrderSummary() {\n    var total = PRODUCT_PRICE + SHIPPING_CHARGE;\n    var codTotal = total + COD_CHARGE;\n    var remaining = codTotal - 200;\n    document.getElementById('orderSummary').innerHTML =\n      '<div class=\"os-item\"><span>Love Neon LED Sign — Pink x1</span><span>&#8377;' + PRODUCT_PRICE + '</span></div>' +\n      '<div class=\"os-item\"><span>Shipping Charge</span><span>&#8377;' + SHIPPING_CHARGE + '</span></div>' +\n      (payMode === 'cod'\n        ? '<div class=\"os-item\"><span>COD Handling Charge</span><span>&#8377;' + COD_CHARGE + '</span></div><div class=\"os-item\"><span>Remaining on delivery</span><span>&#8377;' + remaining + '</span></div><div class=\"os-total\"><span>Total Order Value</span><span>&#8377;' + codTotal + '</span></div>'\n        : '<div class=\"os-total\"><span>Total Payable</span><span>&#8377;' + total + '</span></div>');\n  }\n",
    'love shipping constants'
  );
  html = replaceRequired(
    html,
    "      : '&#128274; Pay &#8377;400 Securely';\n    btn.style.background",
    "      : '&#128274; Pay &#8377;' + (PRODUCT_PRICE + SHIPPING_CHARGE) + ' Securely';\n    updateOrderSummary();\n    btn.style.background",
    'love payment mode summary'
  );
  html = replaceRequired(
    html,
    "    var payAmount = isCOD ? 200 : 400;\n    var orderTotal = isCOD ? 400 + COD_CHARGE : 400;\n",
    "    var payAmount = isCOD ? 200 : PRODUCT_PRICE + SHIPPING_CHARGE;\n    var orderTotal = isCOD ? PRODUCT_PRICE + SHIPPING_CHARGE + COD_CHARGE : PRODUCT_PRICE + SHIPPING_CHARGE;\n",
    'love payment totals'
  );
  html = replaceRequired(
    html,
    "productTotal: 400, isCOD: isCOD,",
    "productTotal: PRODUCT_PRICE, shippingCharge: SHIPPING_CHARGE, isCOD: isCOD,",
    'love order shipping data'
  );
  return html;
});

console.log(`Applied low-price shipping rules to ${targetRoot}`);
