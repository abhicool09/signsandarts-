const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2] || 9224);
const baseUrl = process.argv[3] || 'http://127.0.0.1:4186';
const screenshotPath = path.resolve(process.argv[4] || 'marketplace-products-qa.png');

async function openPage(url) {
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, {method: 'PUT'}).then(r => r.json());
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const events = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const handler = pending.get(message.id);
      pending.delete(message.id);
      return message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result);
    }
    if (events.has(message.method)) {
      events.get(message.method)(message.params);
      events.delete(message.method);
    }
  };
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, {resolve, reject});
    socket.send(JSON.stringify({id: messageId, method, params}));
  });
  const wait = method => new Promise(resolve => events.set(method, resolve));
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 844, deviceScaleFactor: 1, mobile: true});
  const loaded = wait('Page.loadEventFired');
  await send('Page.navigate', {url});
  await loaded;
  await new Promise(resolve => setTimeout(resolve, 350));
  return {
    eval: async expression => {
      const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (result.exceptionDetails) {
        const detail = result.exceptionDetails.exception && result.exceptionDetails.exception.description;
        throw new Error(detail || result.exceptionDetails.text);
      }
      return result.result.value;
    },
    screenshot: async () => {
      const result = await send('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
      fs.writeFileSync(screenshotPath, Buffer.from(result.data, 'base64'));
    },
    close: () => socket.close()
  };
}

async function main() {
  const results = {};
  for (const slug of ['pan-shop-led-sign-board', '12v-5a-60w-led-adapter']) {
    const page = await openPage(`${baseUrl}/${slug}/`);
    results[slug] = await page.eval(`(() => {
      openCheckout();
      var online=document.getElementById('summary').innerText;
      setMode('cod');
      return {
        width:innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        images:Array.from(document.images).filter(img=>img.complete&&img.naturalWidth>0).length,
        title:document.querySelector('h1').innerText,
        online:online,
        cod:document.getElementById('summary').innerText
      };
    })()`);
    if (slug === 'pan-shop-led-sign-board') await page.screenshot();
    page.close();
  }

  const pixel = await openPage(`${baseUrl}/pixel-led/`);
  results.threshold = await pixel.eval(`(() => {
    var product=window.PIXEL_PRODUCTS.find(item=>item.price===165);
    openPixelCheckout(product,1);
    var one=document.getElementById('orderSummary').innerText;
    closePixelCheckout();
    openPixelCheckout(product,2);
    return {one:one,two:document.getElementById('orderSummary').innerText};
  })()`);
  pixel.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
