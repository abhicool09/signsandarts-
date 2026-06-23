const fs = require('fs');
const path = require('path');

const debuggingPort = Number(process.argv[2] || 9224);
const targetUrl = process.argv[3] || 'http://127.0.0.1:4183/pixel-led/';
const screenshotPath = path.resolve(process.argv[4] || 'pixel-led-mobile-cdp.png');

async function main() {
  const createResponse = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(targetUrl)}`,
    {method: 'PUT'}
  );
  const target = await createResponse.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let messageId = 0;
  const pending = new Map();
  const eventWaiters = new Map();

  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const {resolve, reject} = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (eventWaiters.has(message.method)) {
      const resolve = eventWaiters.get(message.method);
      eventWaiters.delete(message.method);
      resolve(message.params);
    }
  };

  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++messageId;
      pending.set(id, {resolve, reject});
      socket.send(JSON.stringify({id, method, params}));
    });
  }

  function waitFor(method) {
    return new Promise(resolve => eventWaiters.set(method, resolve));
  }

  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true
  });

  const loaded = waitFor('Page.loadEventFired');
  await send('Page.navigate', {url: targetUrl});
  await loaded;
  await new Promise(resolve => setTimeout(resolve, 500));

  const initial = await evaluate(`({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    visualWidth: window.visualViewport && window.visualViewport.width,
    mobileMedia: window.matchMedia('(max-width:760px)').matches,
    navDisplay: getComputedStyle(document.querySelector('nav')).display,
    gridColumns: getComputedStyle(document.getElementById('pixelGrid')).gridTemplateColumns,
    productCount: document.querySelectorAll('.product-card').length,
    imageFailures: Array.from(document.images).filter(img => !img.complete || img.naturalWidth === 0).length
  })`);

  const filtered = await evaluate(`(() => {
    document.querySelector('.filter[data-filter="7-inch"]').click();
    return {
      visibleCards: Array.from(document.querySelectorAll('.product-card')).filter(card => !card.hidden).length,
      label: document.getElementById('productCount').textContent
    };
  })()`);

  const checkout = await evaluate(`(() => {
    document.querySelector('.product-card:not([hidden]) .card-buy button').click();
    var onlineSummary = document.getElementById('orderSummary').innerText;
    var onlinePayButton = document.getElementById('payBtn').innerText;
    setPixelPayMode('cod');
    return {
      modalOpen: document.getElementById('checkoutModal').classList.contains('open'),
      onlineSummary: onlineSummary,
      onlinePayButton: onlinePayButton,
      codSummary: document.getElementById('orderSummary').innerText,
      codPayButton: document.getElementById('payBtn').innerText
    };
  })()`);

  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false
  });
  fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));

  console.log(JSON.stringify({initial, filtered, checkout, screenshotPath}, null, 2));
  socket.close();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
