// Actual game, touch UI, combat and LocalStorage migration regression.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [url,file] of [['build/three.module.js','three.module.js'],['examples/jsm/loaders/GLTFLoader.js','GLTFLoader.js'],['examples/jsm/utils/BufferGeometryUtils.js','BufferGeometryUtils.js'],['examples/jsm/utils/SkeletonUtils.js','SkeletonUtils.js']])await page.route('**/three@0.160.1/'+url,r=>r.fulfill({path:(process.env.SCOUT_TEST_CACHE||'/tmp/realm-tests')+'/'+file,contentType:'application/javascript'}));
 await page.goto('http://localhost:8000/?test');await page.waitForFunction(()=>window.__realm);await page.evaluate(()=>{window.renderGame=__realm.renderer.render.bind(__realm.renderer);__realm.renderer.render=()=>{}});await page.click('#play');
 assert.deepEqual(await page.evaluate(()=>({count:__realm.prologue.foes.length,buried:__realm.prologue.foes.every(e=>e.buried&&!e.root.visible&&e.skeleton&&!e.scoutModel),weapon:__realm.player.weapon,gate:__realm.blocked(50,118)})),{count:8,buried:true,weapon:'w0',gate:true});
 assert(await page.evaluate(()=>{const a=__realm,e=a.prologue.foes[0],hp=e.hp;a.hurtEnemy(e,999);for(let i=0;i<120;i++)a.step(.05);return e.hp===hp&&a.prologue.foes.every(e=>!e.root.visible)}));
 await page.evaluate(()=>{__realm.setPosition(47.8,150);__realm.pickup()});assert.equal(await page.evaluate(()=>__realm.prologue.data().read),false);await page.tap('#story-next');
 assert.equal(await page.evaluate(()=>__realm.prologue.data().stage),1);
 // Capture actual staggered emergence, not a posed replacement scene.
 await page.evaluate(()=>{const a=__realm;for(const e of a.prologue.foes){e.rise=-e.prologue*.28;e.buried=true;e.state='emerging'}for(let i=0;i<21;i++)a.step(.05);a.setView(0,.18);window.renderGame(a.scene,a.camera)});
 await page.screenshot({path:'/tmp/realm-tests/graves-rising.png'});
 assert(await page.evaluate(()=>__realm.prologue.foes.some(e=>e.root.visible&&e.rig.position.y<-.1)&&__realm.prologue.foes.some(e=>!e.root.visible)));
 await page.evaluate(()=>{const a=__realm;for(let i=0;i<90;i++)a.step(.05);a.setPosition(47.8,150);a.prologue.interact()});await page.tap('#story-next');assert.equal(await page.evaluate(()=>__realm.enemies.length),138);assert(await page.evaluate(()=>__realm.prologue.foes.every(e=>!e.buried&&e.rise>=1.8)));
 await page.evaluate(()=>{const a=__realm;for(const e of a.prologue.foes){e.root.position.set(e.home.x,a.surface(e.home.x,e.home.z),e.home.z);e.cooldown=1000;e.stagger=1000}a.setPosition(44,152);a.setView(0,.18);window.renderGame(a.scene,a.camera)});await page.screenshot({path:'/tmp/realm-tests/graves-skeletons.png'});
 // Sword combat, loot and XP use the original game handlers. Hold other enemies for deterministic input.
 await page.evaluate(()=>{for(const e of __realm.enemies){e.cooldown=1000;e.stagger=1000}__realm.player.hp=1000});
 for(let n=0;n<8;n++){
  await page.evaluate(i=>{const a=__realm,e=a.prologue.foes[i];e.stagger=0;e.root.position.set(e.home.x,a.surface(e.home.x,e.home.z),e.home.z);a.setPosition(e.home.x,e.home.z+1.2);a.hero.root.rotation.y=Math.PI},n);
  for(let j=0;j<16;j++){if(await page.evaluate(i=>__realm.prologue.foes[i].hp<=0,n))break;await page.evaluate(()=>{__realm.startAttack();for(let k=0;k<24;k++)__realm.step(.05)})}
  assert(await page.evaluate(i=>__realm.prologue.foes[i].hp<=0,n),'sword killed skeleton '+n);
  if(n===0){await page.evaluate(()=>{const a=__realm,s=a.snapshot();a.start(false,s);for(const e of a.enemies){e.cooldown=1000;e.stagger=1000}a.player.hp=1000});assert.equal(await page.evaluate(()=>__realm.prologue.data().killed.length),1);assert.equal(await page.evaluate(()=>__realm.prologue.foes.filter(e=>e.hp>0).length),7)}
 }
 assert.equal(await page.evaluate(()=>__realm.prologue.data().killed.length),8);
 await page.evaluate(()=>{__realm.setPosition(50,118);__realm.prologue.interact()});await page.tap('#story-next');assert.equal(await page.evaluate(()=>__realm.prologue.data().stage),2);assert.equal(await page.evaluate(()=>__realm.prologue.blocked(50,118,.36)),false);
 await page.evaluate(()=>__realm.save());await page.reload();await page.waitForFunction(()=>window.__realm);await page.evaluate(()=>__realm.renderer.render=()=>{});await page.click('#continue');assert.equal(await page.evaluate(()=>__realm.prologue.foes.filter(e=>e.hp<=0).length),8);
 await page.evaluate(()=>{__realm.setPosition(0,83);__realm.prologue.interact()});await page.tap('#story-next');assert.equal(await page.evaluate(()=>__realm.prologue.data().stage),3);
 const migration=await page.evaluate(()=>{const a=__realm,s=a.snapshot();s.living.prologue={version:1,stage:1,read:true,killed:[0,2]};a.start(false,s);const partial=a.prologue.foes.filter(e=>e.hp>0).length;s.living.prologue={version:1,stage:2,read:true,killed:[0,1,2]};a.start(false,s);const escaped=a.prologue.foes.every(e=>e.hp<=0);delete s.living.prologue;s.player.level=26;s.player.x=0;s.player.z=64;a.start(false,s);return {partial,escaped,level:a.player.level,stage:a.prologue.data().stage}});assert.deepEqual(migration,{partial:6,escaped:true,level:26,stage:3});
 for(const size of [2,3,4]){const result=await page.evaluate(n=>{const a=__realm,s=a.snapshot();s.player.level=1;s.living.prologue={version:2,stage:1,read:true,killed:[0,8],partySize:n};a.start(false,s);a.prologue.hud();return {count:a.prologue.foes.length,alive:a.prologue.foes.filter(e=>e.hp>0).length,dmg:a.prologue.foes[1].dmg,text:document.getElementById('objective').textContent}},size);assert.equal(result.count,size*8);assert.equal(result.alive,size*8-2);assert.equal(result.dmg,Math.round(8*(1+.1*(size-1))));assert(result.text.includes('2/'+size*8));}
 assert.deepEqual(errors,[]);console.log('PASS eight buried skeletons, warning touch trigger, staggered rise, invulnerable emergence, no duplicate trigger, eight sword kills, partial-save recovery, gate, reload, charter, old save migration and no JS exceptions');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
