const fs = require('fs');
const path = require('path');

const debuggingPort = Number(process.argv[2] || 9224);
const baseUrl = process.argv[3] || 'http://127.0.0.1:4185';
const screenshotPath = path.resolve(process.argv[4] || 'shipping-checkout-qa.png');

async function openTarget(url) {
  const created = await fetch(
    `http://127.0.0.1:${debuggingPort}/json/new?${encodeURIComponent(url)}`,
    {method: 'PUT'}
  ).then(response => response.json());
  const socket = new WebSocket(created.webSocketDebuggerUrl);
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
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, {resolve, reject});
    socket.send(JSON.stringify({id: messageId, method, params}));
  });
  const wait = method => new Promise(resolve => events.set(method, resolve));
  await send('Page.enable');
  await send('Runtime.enable');
  const loaded = wait('Page.loadEventFired');
  await send('Page.navigate', {url});
  await loaded;
  await new Promise(resolve => setTimeout(resolve, 250));
  return {
    evaluate: async expression => {
      const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
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
  const homepage = await openTarget(`${baseUrl}/`);
  const homepageResult = await homepage.evaluate(`(() => {
    addToCart({id:'led-strip-rf-controller',name:'Mini RF Remote Controller',price:339,qty:1});
    closeCart();
    openCheckout();
    var online = document.getElementById('orderSummary').innerText;
    setPayMode('cod');
    return {online:online,cod:document.getElementById('orderSummary').innerText};
  })()`);
  homepage.close();

  const controller = await openTarget(`${baseUrl}/led-strip-remote-controller/`);
  const controllerResult = await controller.evaluate(`(() => {
    openCheckout();
    var online = document.getElementById('orderSummary').innerText;
    setPayMode('cod');
    return {online:online,cod:document.getElementById('orderSummary').innerText};
  })()`);
  controller.close();

  const love = await openTarget(`${baseUrl}/love-neon-led-sign/`);
  const loveResult = await love.evaluate(`(() => {
    openCheckout();
    var online = document.getElementById('orderSummary').innerText;
    setPayMode('cod');
    return {online:online,cod:document.getElementById('orderSummary').innerText};
  })()`);
  await love.screenshot();
  love.close();

  console.log(JSON.stringify({homepage: homepageResult, controller: controllerResult, love: loveResult}, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
