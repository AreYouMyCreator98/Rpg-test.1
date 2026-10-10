const assert=require('node:assert/strict');const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 for(const legacyFails of [false,true]){
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{const raf=requestAnimationFrame;window.requestAnimationFrame=fn=>raf(t=>{if(window.__realm)__realm.renderer.render=()=>{};fn(t)});localStorage.setItem('realm-fallen-settings',JSON.stringify({quality:'low',sound:false}))});
  const cache=process.env.SCOUT_TEST_CACHE;if(cache)for(const file of ['three.module.js','GLTFLoader.js','BufferGeometryUtils.js','SkeletonUtils.js'])await page.route('**/'+file,r=>r.fulfill({path:cache+'/'+file,contentType:'text/javascript'}));
  await page.route('**/assets/models/goblin_scout.glb*',r=>r.abort());if(legacyFails)await page.route('**/assets/goblin-scout.gltf*',r=>r.abort());
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:8000/')+'?test');await page.waitForFunction(()=>window.__realm,{timeout:60000});await page.click('#play');
  const result=await page.evaluate(()=>({state:__realm.state,scouts:__realm.enemies.filter(e=>e.scoutModel).length,skinned:!!__realm.enemies[0].scoutModel?.skinned,hp:__realm.enemies[0].maxHp,count:__realm.enemies.length}));
  assert.equal(result.state,'playing');assert.equal(result.hp,30);assert.equal(result.count,109);assert.equal(result.scouts,legacyFails?0:7);assert.equal(result.skinned,false);assert.deepEqual(errors,[]);console.log('PASS',legacyFails?'procedural fallback when both assets fail':'original glTF fallback when new GLB fails',result);await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
