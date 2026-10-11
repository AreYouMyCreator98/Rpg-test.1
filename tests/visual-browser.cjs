// Presentation regression checks: real WebGL scene, preserved world state and mobile budget.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 if(process.env.THREE_TEST_MODULE)await page.route('**/three@0.160.1/build/three.module.js',r=>r.fulfill({path:process.env.THREE_TEST_MODULE,contentType:'application/javascript'}));
 if(process.env.SCOUT_TEST_CACHE)for(const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js'])await page.route('**/examples/jsm/'+file,r=>r.fulfill({path:process.env.SCOUT_TEST_CACHE+'/'+file.split('/').pop(),contentType:'application/javascript'}));
 await page.addInitScript(()=>localStorage.setItem('realm-fallen-settings',JSON.stringify({quality:'low',sound:false})));
 await page.goto((process.env.GAME_URL||'http://localhost:8000/')+'?test');await page.waitForFunction(()=>window.__realm);await page.tap('#play');await page.evaluate(()=>__realm.setPosition(0,64));await page.waitForTimeout(300);
 const initial=await page.evaluate(()=>{
  const r=__realm;r.visuals.update(.3,1,1/60);r.renderer.render(r.scene,r.camera);
  return {calls:r.renderer.info.render.calls,triangles:r.renderer.info.render.triangles,enemies:r.enemies.length,quests:r.living.questDefinitions.length,shadows:r.visuals.shadows.count,instanced:r.visuals.chunks.filter(c=>c.m.isInstancedMesh).length};
 });assert(await page.evaluate(()=>{const n=__realm.scene.children.find(o=>o.isHemisphereLight).intensity;return n>=.48&&n<=1.14}));assert.equal(initial.enemies,114);assert.equal(initial.quests,33);assert(initial.shadows>=58);assert(initial.instanced>50);assert(initial.calls<300,JSON.stringify(initial));assert(initial.triangles<180000,JSON.stringify(initial));console.log('PASS Low village rendering budget and preserved enemies/quests:',initial);
 for(const [x,z]of [[0,64],[-5,61],[-7,57],[-20,43],[-180,57],[-20,-225]]){
  await page.evaluate(([x,z])=>__realm.setPosition(x,z),[x,z]);await page.waitForTimeout(150);
  const view=await page.evaluate(()=>{const r=__realm;const top=r.hero.root.position.clone().add(new r.THREE.Vector3(0,2.2,0)).project(r.camera),feet=r.hero.root.position.clone().project(r.camera);return{distance:r.camera.position.distanceTo(r.hero.root.position),height:Math.abs(top.y-feet.y)/2,ground:r.camera.position.y-r.surface(r.camera.position.x,r.camera.position.z)}});
  assert(view.distance>3.5,JSON.stringify({x,z,...view}));assert(view.height<.55);assert(view.ground>.5);
 }
 console.log('PASS third-person framing at village, forge, forest, city and mountains');
 const detail=await page.evaluate(()=>{const r=__realm,textures=r.visuals.detailTextures;let vertices=0,wood=false,stone=false;r.visuals.root.traverse(o=>{const a=o.geometry?.getAttribute('surfaceKind');if(a){vertices+=a.count;for(const v of a.array){wood ||= v===1;stone ||= v===0}}});return{textures:textures.map(t=>({w:t.image.width,h:t.image.height,varying:new Set(t.image.getContext('2d').getImageData(0,0,128,128).data).size>4})),vertices,wood,stone}});
 assert.equal(detail.textures.length,3);assert(detail.textures.every(t=>t.w===128&&t.h===128&&t.varying));assert(detail.vertices>0&&detail.wood&&detail.stone);console.log('PASS generated ground/wood/masonry texture data and merged material assignments');

 await page.evaluate(()=>{__realm.setPosition(-5,61);document.getElementById('toasts').replaceChildren()});await page.waitForTimeout(300);
 const out=process.env.TEST_ARTIFACT_DIR||'/tmp/realm-tests';fs.mkdirSync(out,{recursive:true});await page.screenshot({path:out+'/cinematic-mobile-low.png'});
 const adaptive=await page.evaluate(()=>{const r=__realm,before=JSON.stringify(r.player);r.visuals.resetResolution();for(let i=0;i<1100;i++)r.visuals.sampleFrame(.04);const low=r.visuals.resolutionScale;r.visuals.resetResolution();for(let i=0;i<40;i++)r.visuals.sampleFrame(.3);const severe=r.visuals.resolutionScale;for(let i=0;i<15000;i++)r.visuals.sampleFrame(.016);const high=r.visuals.resolutionScale;r.visuals.resetResolution();return{low,severe,high,same:before===JSON.stringify(r.player),quality:r.settings.quality}});assert(adaptive.low>=.65&&adaptive.low<.8);assert(adaptive.severe<1);assert.equal(adaptive.high,1);assert(adaptive.same);assert.equal(adaptive.quality,'low');console.log('PASS adaptive resolution lowers and recovers without changing player state or preset');
 await page.evaluate(()=>{__realm.setPosition(-46,39);__realm.living.enterCave()});await page.waitForFunction(()=>!__realm.visuals.root.visible);
 assert.equal(await page.evaluate(()=>__realm.hero.root.position.x),300);assert(await page.evaluate(()=>__realm.living.guardian.hp>0));
 await page.screenshot({path:out+'/cinematic-cave.png'});await page.evaluate(()=>{__realm.setPosition(300,5);__realm.living.exitCave()});await page.waitForFunction(()=>__realm.visuals.root.visible);assert(await page.evaluate(()=>{const n=__realm.scene.children.find(o=>o.isHemisphereLight).intensity;return n>=.48&&n<=1.14}));console.log('PASS overworld decoration and lighting hide in cave and restore on exit');
 await page.tap('#pause-touch');await page.tap('#menu-settings');await page.selectOption('#quality','medium');await page.tap('#close-modal');await page.waitForTimeout(300);assert(await page.evaluate(()=>__realm.renderer.shadowMap.enabled));await page.screenshot({path:out+'/cinematic-mobile-medium.png'});
 await page.tap('#pause-touch');await page.tap('#menu-settings');await page.selectOption('#quality','low');await page.tap('#close-modal');assert.equal(await page.evaluate(()=>__realm.renderer.shadowMap.enabled),false);
 await page.evaluate(()=>__realm.save());const saved=await page.evaluate(()=>JSON.stringify({...__realm.readSave().player,playtime:0}));await page.reload();await page.waitForFunction(()=>window.__realm);await page.tap('#continue');assert.equal(await page.evaluate(()=>JSON.stringify({...__realm.readSave().player,playtime:0})),saved);console.log('PASS quality switch and save/reload');
 assert.deepEqual(errors,[]);console.log('PASS no JavaScript, WebGL shader or console errors');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
