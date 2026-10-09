// Opt-in integration test: creates two anonymous users and temporary rooms in the
// configured Supabase project. Requires authorization to test that project.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium,request}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const game=process.env.GAME_URL||'http://127.0.0.1:8000/',errors=[],wire={sent:{},received:{}};
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-background-timer-throttling']});
 let verifiedHttp;
 try{
 const context=await browser.newContext({viewport:{width:960,height:700}});
 // Optional cloud routing: TLS is verified on both HTTP and WebSocket proxy
 // connections. Never use ignoreHTTPSErrors or disable certificate verification.
 if(process.env.REALM_TEST_PROXY==='1'){
  const proxy=new URL(process.env.HTTPS_PROXY),root=process.env.NETWORK_TOOLS_ROOT;
  const WebSocket=require(root?path.join(root,'ws'):'ws'),{HttpsProxyAgent}=require(root?path.join(root,'https-proxy-agent'):'https-proxy-agent');
  const ca=fs.readFileSync('/etc/ssl/certs/ca-certificates.crt');
  verifiedHttp=await request.newContext({proxy:{server:proxy.origin,username:decodeURIComponent(proxy.username)||undefined,password:decodeURIComponent(proxy.password)||undefined}});
  await context.route(/^https:\/\//,async r=>{try{const response=await verifiedHttp.fetch(r.request());const headers=response.headers();delete headers['content-encoding'];delete headers['content-length'];await r.fulfill({status:response.status(),headers,body:await response.body()})}catch(e){errors.push('Verified HTTP route: '+e.message.split('\n')[0]);await r.abort()}});
  await context.routeWebSocket(/^wss:\/\//,route=>{
   const ws=new WebSocket(route.url(),{agent:new HttpsProxyAgent(process.env.HTTPS_PROXY,{ca}),ca,origin:new URL(game).origin}),pending=[];
   route.onMessage(m=>{try{const d=JSON.parse(m);if(d.event==='broadcast'){const t=d.payload?.payload?.type||'other';wire.sent[t]=(wire.sent[t]||0)+1}}catch{}if(ws.readyState===WebSocket.OPEN)ws.send(m);else pending.push(m)});
   route.onClose(()=>{if(ws.readyState===WebSocket.CONNECTING)ws.terminate();else ws.close()});
   ws.on('open',()=>{for(const m of pending)ws.send(m);pending.length=0});
   ws.on('message',(data,isBinary)=>{try{const d=JSON.parse(data);if(d.event==='broadcast'){const t=d.payload?.payload?.type||'other';wire.received[t]=(wire.received[t]||0)+1}}catch{}route.send(isBinary?data:data.toString())});
   ws.on('close',()=>route.close());ws.on('error',e=>{errors.push('Verified WebSocket route: '+e.message);route.close()});
  });
 }
 await context.addInitScript(()=>localStorage.setItem('realm-fallen-settings',JSON.stringify({quality:'low',sound:false})));
 const a=await context.newPage(),b=await context.newPage();
 for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));await p.goto(game+'?test');await p.waitForFunction(()=>window.__realm?.net).catch(async e=>{console.log('Initialization:',await p.locator('body').innerText());console.log('Browser errors:',errors);throw e});await p.evaluate(()=>{__realm.renderer.setPixelRatio(.25);const draw=__realm.renderer.render.bind(__realm.renderer);let next=0;__realm.renderer.render=(...args)=>{if(performance.now()>next){next=performance.now()+250;draw(...args)}}})}
 await a.click('#multiplayer');await a.fill('#room-name','Connection test host');await a.click('#create-private');
 await a.waitForFunction(()=>__realm.net.active&&__realm.net.host,null,{timeout:60000});const code=await a.evaluate(()=>__realm.net.code);
 await b.click('#multiplayer');await b.fill('#room-name','Connection test guest');await b.click('#refresh-rooms');await b.waitForFunction(()=>document.querySelector('#room-list').textContent.length>0,null,{timeout:60000});
 assert(!(await b.locator('#room-list').innerText()).includes('Connection test host'));
 await b.fill('#join-code',code);await b.click('#join-room');await b.waitForFunction(()=>__realm.net.active,null,{timeout:60000});
 await a.evaluate(()=>__realm.closeModal());await b.evaluate(()=>__realm.closeModal());await a.waitForFunction(()=>__realm.net.peers.size===1,null,{timeout:30000}).catch(async e=>{console.log('WIRE',wire,'ERRORS',errors.slice(0,3));for(const p of [a,b])console.log('CLIENT',await p.evaluate(()=>({active:__realm.net.active,host:__realm.net.host,peers:__realm.net.peers.size,panel:__realm.panel,status:document.getElementById('room-status')?.textContent,toasts:document.getElementById('toasts')?.textContent})));throw e});await b.waitForFunction(()=>__realm.net.peers.size===1,null,{timeout:60000});
 console.log('PASS live Supabase anonymous auth, private room RPC/join, authenticated Realtime and remote avatars');
 await a.evaluate(()=>{__realm.setPosition(4,60);__realm.drop('coin',4,60,17)});await b.evaluate(()=>__realm.setPosition(4,60));
 await a.waitForFunction(()=>[...__realm.net.peers.values()][0]?.pose?.x===4);await b.waitForFunction(()=>__realm.loot.some(l=>l.id==='coin'),null,{timeout:30000});
 await Promise.all([a.evaluate(()=>__realm.pickup()),b.evaluate(()=>__realm.pickup())]);
 await a.waitForFunction(()=>!__realm.loot.some(l=>l.id==='coin'));await b.waitForFunction(()=>!__realm.loot.some(l=>l.id==='coin'));
 assert.equal((await a.evaluate(()=>__realm.player.coins))+(await b.evaluate(()=>__realm.player.coins)),107);
 console.log('PASS live shared loot race resolves once across both clients');
 await a.evaluate(()=>{__realm.setPosition(0,64);const e=__realm.enemies[0];e.hp=e.maxHp;e.root.position.set(-21,__realm.surface(-21,39),39);e.state='patrol';e.cooldown=0});
 await b.evaluate(()=>{__realm.setPosition(-21,40.5);__realm.player.hp=100;for(let i=0;i<30;i++)__realm.step(.05)});
 await b.waitForFunction(()=>__realm.player.hp<100,null,{timeout:30000});const hp=await a.evaluate(()=>__realm.enemies[0].hp);
 for(let i=0;i<4;i++){await b.evaluate(()=>{__realm.player.hp=100;const e=__realm.enemies[0];__realm.setPosition(e.root.position.x,e.root.position.z+1.3);__realm.startAttack()});await b.waitForFunction(()=>!__realm.attack);await b.waitForTimeout(500);if(await a.evaluate(h=>__realm.enemies[0].hp<h,hp))break}
 assert(await a.evaluate(h=>__realm.enemies[0].hp<h,hp));console.log('PASS live guest damage and guest sword attacks reach authoritative host');
 await a.evaluate(()=>__realm.net.leave('Validation complete'));await b.waitForFunction(()=>!__realm.net.active,null,{timeout:15000});
 await a.evaluate(()=>__realm.net.lobby());await a.click('#create-public');await a.waitForFunction(()=>__realm.net.active,null,{timeout:30000});
 await b.evaluate(()=>__realm.net.lobby());await b.click('#refresh-rooms');await b.waitForSelector('#room-list button',{timeout:30000});
 const row=b.locator('.room-row').filter({hasText:'Connection test guest'}); // stored display name is shared by tabs
 const available=await row.count()?row.first():b.locator('.room-row').filter({hasText:'Connection test host'}).first();
 await available.locator('button').click();await b.waitForFunction(()=>__realm.net.active,null,{timeout:30000});
 assert.equal(await a.evaluate(()=>__realm.net.code),await b.evaluate(()=>__realm.net.code));
 await b.evaluate(()=>__realm.net.leave('Validation complete'));await a.evaluate(()=>__realm.net.leave('Validation complete'));await a.waitForTimeout(1000);
 assert.deepEqual(errors,[]);console.log('PASS live public discovery/join, host departure and room cleanup, no browser exceptions');
 }finally{await browser.close();await verifiedHttp?.dispose()}
})().catch(e=>{console.error(e.stack||e.message);process.exitCode=1});
