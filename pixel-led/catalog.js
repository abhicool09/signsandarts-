var pixelPayMode='online',pixelOrder=null,COD_CHARGE=50,LOW_PRICE_SHIPPING=125;
function formatPixelPrice(value){return Number(value).toLocaleString('en-IN')}
function getPixelProduct(id){return (window.PIXEL_PRODUCTS||[]).find(function(item){return item.id===id})}
function initPixelCatalog(){
  document.querySelectorAll('.filter').forEach(function(button){
    button.addEventListener('click',function(){
      var filter=button.dataset.filter,count=0;
      document.querySelectorAll('.product-card').forEach(function(card){
        var show=filter==='all'||card.dataset.group===filter;
        card.hidden=!show;if(show)count++;
      });
      document.querySelectorAll('.filter').forEach(function(item){item.classList.toggle('active',item===button)});
      var countEl=document.getElementById('productCount');if(countEl)countEl.textContent=count+' products';
    });
  });
}
function buyPixelProduct(id){var product=getPixelProduct(id);if(product)openPixelCheckout(product,1)}
function changeProductQty(delta){
  var input=document.getElementById('productQty');if(!input)return;
  input.value=Math.max(1,Math.min(99,Number(input.value||1)+delta));
}
function buyCurrentPixelProduct(){
  var qty=Math.max(1,Math.min(99,Number(document.getElementById('productQty').value||1)));
  openPixelCheckout(window.PIXEL_PRODUCT,qty);
}
function openPixelCheckout(product,qty){
  pixelOrder={product:product,qty:qty||1};pixelPayMode='online';
  setPixelPayMode('online');
  document.getElementById('checkoutModal').classList.add('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
}
function closePixelCheckout(){
  document.getElementById('checkoutModal').classList.remove('open');
  document.getElementById('checkoutModal').setAttribute('aria-hidden','true');
  document.body.style.overflow='';
}
function pixelTotals(){
  var subtotal=pixelOrder.product.price*pixelOrder.qty;
  var shipping=subtotal<300?LOW_PRICE_SHIPPING:0;
  var onlineTotal=subtotal+shipping;
  var codTotal=onlineTotal+COD_CHARGE;
  var advance=Math.min(200,codTotal);
  return {subtotal:subtotal,shipping:shipping,onlineTotal:onlineTotal,codTotal:codTotal,advance:advance,remaining:Math.max(codTotal-advance,0)};
}
function renderPixelSummary(){
  if(!pixelOrder)return;
  var totals=pixelTotals(),summary=document.getElementById('orderSummary');
  var rows='<div class="summary-row"><span>'+pixelOrder.product.name+' x'+pixelOrder.qty+'</span><span>&#8377;'+formatPixelPrice(totals.subtotal)+'</span></div>';
  if(totals.shipping){
    rows+='<div class="summary-row"><span>Shipping charge</span><span>&#8377;'+formatPixelPrice(totals.shipping)+'</span></div>';
  }
  if(pixelPayMode==='cod'){
    rows+='<div class="summary-row"><span>COD handling charge</span><span>&#8377;'+COD_CHARGE+'</span></div>';
    rows+='<div class="summary-row"><span>Advance payable now</span><span>&#8377;'+formatPixelPrice(totals.advance)+'</span></div>';
    rows+='<div class="summary-row"><span>Balance on delivery</span><span>&#8377;'+formatPixelPrice(totals.remaining)+'</span></div>';
    rows+='<div class="summary-row total"><span>Total order value</span><span>&#8377;'+formatPixelPrice(totals.codTotal)+'</span></div>';
  }else{
    rows+='<div class="summary-row total"><span>Total payable</span><span>&#8377;'+formatPixelPrice(totals.onlineTotal)+'</span></div>';
  }
  summary.innerHTML=rows;
  document.getElementById('codAdvanceText').innerHTML='&#8377;'+formatPixelPrice(totals.advance)+' advance';
  document.getElementById('payBtn').innerHTML=pixelPayMode==='cod'?'Pay &#8377;'+formatPixelPrice(totals.advance)+' Advance & Place COD Order':'Pay &#8377;'+formatPixelPrice(totals.onlineTotal)+' Securely';
}
function setPixelPayMode(mode){
  pixelPayMode=mode;
  document.getElementById('btnOnline').classList.toggle('active',mode==='online');
  document.getElementById('btnCOD').classList.toggle('active',mode==='cod');
  document.getElementById('codInfo').classList.toggle('show',mode==='cod');
  document.getElementById('payBtn').style.background=mode==='cod'?'#e67e22':'#111';
  renderPixelSummary();
}
async function placePixelOrder(){
  if(!pixelOrder)return;
  var fields={name:'custName',phone:'custPhone',email:'custEmail',address:'custAddr',city:'custCity',state:'custState',pincode:'custPin'};
  var data={};Object.keys(fields).forEach(function(key){data[key]=document.getElementById(fields[key]).value.trim()});
  if(Object.keys(data).some(function(key){return !data[key]})){alert('Please fill all fields.');return}
  if(!/^\d{10}$/.test(data.phone)){alert('Enter a valid 10-digit phone number.');return}
  if(!/^\S+@\S+\.\S+$/.test(data.email)){alert('Enter a valid email address.');return}
  if(!/^\d{6}$/.test(data.pincode)){alert('Enter a valid 6-digit PIN code.');return}
  var totals=pixelTotals(),isCOD=pixelPayMode==='cod';
  var payAmount=isCOD?totals.advance:totals.onlineTotal;
  var orderTotal=isCOD?totals.codTotal:totals.onlineTotal;
  var orderId='';
  var orderData={name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,state:data.state,pincode:data.pincode,items:[{id:pixelOrder.product.id,name:pixelOrder.product.name,price:pixelOrder.product.price,qty:pixelOrder.qty}],total:orderTotal,productTotal:totals.subtotal,shippingCharge:totals.shipping,isCOD:isCOD,codAdvance:isCOD?totals.advance:0,codCharge:isCOD?COD_CHARGE:0};
  var button=document.getElementById('payBtn');button.disabled=true;button.textContent='Creating order...';
  try{
    var response=await fetch('/api/create-order',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ orderData: orderData })});
    var paymentOrder=await response.json();
      orderId = paymentOrder.order_id;
      Object.assign(orderData, paymentOrder.order_data || {});
    if(!paymentOrder.payment_session_id)throw new Error(paymentOrder.error||'Could not create order');
    var cashfree=Cashfree({mode:'production'});
    cashfree.checkout({paymentSessionId:paymentOrder.payment_session_id,redirectTarget:'_modal'}).then(async function(result){
      if(result.error){alert('Payment failed. Please try again or order through WhatsApp.');button.disabled=false;renderPixelSummary();return}
      var verifyResponse=await fetch('/api/verify-payment',{method:'POST',headers:{'Content-Type':'application/json'},body: JSON.stringify({ orderId: orderId })});
      var verification=await verifyResponse.json();
      if(verification.success){window.location.href='/thank-you.html?order_id='+encodeURIComponent(orderId)+'&product='+encodeURIComponent(pixelOrder.product.name)+'&amount='+orderData.total+(isCOD?'&cod=1':'')}
      else alert('Payment received. Please WhatsApp us with Order ID: '+orderId);
    });
  }catch(error){alert('Could not start payment. Please order through WhatsApp.');button.disabled=false;renderPixelSummary()}
}
document.addEventListener('click',function(event){if(event.target&&event.target.id==='checkoutModal')closePixelCheckout()});
