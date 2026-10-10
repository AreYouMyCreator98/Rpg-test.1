const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
for(const [width,height]of [[360,650],[320,568],[844,390],[1440,900]]){
 if(process.env.QUIET_VIEWPORTS&&!process.env.QUIET_VIEWPORTS.split(',').includes(String(width)))continue;console.log('Checking '+width+'x'+height);
 const touch=width<1000,context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({path:process.env.THREE_TEST_MODULE||'/tmp/realm-tests/three.module.js',contentType:'application/javascript'}));
 await page.addInitScript(()=>localStorage.setItem('realm-fallen-settings',JSON.stringify({quality:'low',sound:false})));await page.goto('http://localhost:8000/?test');await page.waitForFunction(()=>window.__realm);await page.click('#play');
 await page.evaluate(()=>{const r=__realm.renderer,draw=r.render.bind(r);if(innerWidth>1000)r.setPixelRatio(.5);let last=0;r.render=(...a)=>{if(performance.now()-last>250){last=performance.now();draw(...a)}};document.getElementById('toasts').replaceChildren()});
 for(const s of ['.quest','.loadout','#gold-counter','#bag-touch','#frontier-mini'])assert(!await page.locator(s).isVisible(),s);
 for(const s of ['#pause-touch',...(touch?['#stick','#attack-touch','#block-touch','#potion-touch','#dodge-touch']:[])]){const r=await page.locator(s).boundingBox();assert(r&&r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1,s+' bounds');assert(r.width>=44&&r.height>=44,s+' target')}
 if(touch){const circles=[];for(const s of ['#stick','#attack-touch','#block-touch','#potion-touch','#dodge-touch']){const r=await page.locator(s).boundingBox();for(const q of circles)assert(Math.hypot(r.x+r.width/2-q.x-q.width/2,r.y+r.height/2-q.y-q.height/2)>=(r.width+q.width)/2-1,'overlap');circles.push(r)}}
 await page.screenshot({path:`/tmp/realm-tests/quiet-${width}.png`});
 await page.click('#pause-touch');assert.equal(await page.evaluate(()=>__realm.panel),'journey');assert((await page.locator('#journey-summary').textContent()).includes('45 gold'));await page.waitForTimeout(250);await page.screenshot({path:`/tmp/realm-tests/quiet-menu-${width}.png`});
 await page.click('#journey-equipment');assert.equal(await page.evaluate(()=>__realm.panel),'inventory');await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#journey-journal');assert.equal(await page.evaluate(()=>__realm.panel),'journal');await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#journey-map');assert(await page.locator('#frontier-atlas').isVisible());await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#menu-settings');assert(await page.locator('#quality').isVisible());await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#menu-controls');assert.equal(await page.evaluate(()=>__realm.panel),'controls');await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#journey-party');assert(await page.locator('#modal').isVisible());assert.notEqual(await page.evaluate(()=>__realm.panel),'journey');await page.click('#close-modal');
 await page.click('#pause-touch');await page.click('#journey-options');assert(await page.locator('#reset-boss').isVisible());await page.click('#resume');
 await page.click('#pause-touch');await page.click('#toggle-minimap');await page.click('#resume');assert(await page.locator('#frontier-mini').isVisible());await page.click('#mini-map');assert(await page.locator('#frontier-atlas').isVisible());await page.click('#close-modal');
 await page.evaluate(()=>{__realm.player.coins=567;__realm.save()});await page.reload();await page.waitForFunction(()=>window.__realm);await page.click('#continue');assert.equal(await page.evaluate(()=>__realm.player.coins),567);assert(await page.locator('#frontier-mini').isVisible());await page.click('#pause-touch');await page.click('#toggle-minimap');await page.click('#resume');
 if(width===360){
  const client=await context.newCDPSession(page),stick=await page.locator('#stick').boundingBox(),attack=await page.locator('#attack-touch').boundingBox();const a={x:stick.x+stick.width/2,y:stick.y+8,id:1},b={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2};const z=await page.evaluate(()=>__realm.hero.root.position.z);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,b]});assert(await page.evaluate(()=>!!__realm.attack));await page.evaluate(()=>{for(let i=0;i<30;i++)__realm.step()});assert(await page.evaluate(()=>__realm.hero.root.position.z)<z-1);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.evaluate(()=>__realm.setPosition(-7,57));await page.waitForFunction(()=>!document.getElementById('pickup-touch').classList.contains('hidden'));await page.click('#pickup-touch');assert.equal(await page.evaluate(()=>__realm.panel),'dialogue');await page.click('#open-shop');assert.equal(await page.evaluate(()=>__realm.panel),'shop');await page.click('#close-modal');
 }
 assert.deepEqual(errors,[]);console.log(`PASS ${width}x${height}: uncluttered HUD, bounded controls, menu destinations, optional minimap and save persistence`);await context.close();
}
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
