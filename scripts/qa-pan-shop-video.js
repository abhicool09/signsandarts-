const port = Number(process.argv[2] || 9224);
const url = process.argv[3] || 'http://127.0.0.1:4184/pan-shop-led-sign-board/';

async function main() {
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
  const loaded = wait('Page.loadEventFired');
  await send('Page.navigate', {url});
  await loaded;
  const evaluated = await send('Runtime.evaluate', {
    expression: `(() => {
      var button=document.querySelector('.video-button');
      button.click();
      var open={
        buttonText:button.innerText,
        modalOpen:document.getElementById('productVideoModal').classList.contains('open'),
        source:document.getElementById('productVideoFrame').src,
        checkoutStillPresent:typeof openCheckout==='function'
      };
      closeProductVideo();
      open.closed=!document.getElementById('productVideoModal').classList.contains('open')&&!document.getElementById('productVideoFrame').getAttribute('src');
      return open;
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(evaluated.result.value, null, 2));
  socket.close();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
