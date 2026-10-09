const path=require('node:path'),os=require('node:os');
const artifacts=process.env.TEST_ARTIFACT_DIR||path.join(os.tmpdir(),'realm-tests');require('node:fs').mkdirSync(artifacts,{recursive:true});
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:960,height:640}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 if(process.env.THREE_TEST_MODULE)await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({path:process.env.THREE_TEST_MODULE,contentType:'application/javascript'}));
 const oldSave={version:1,player:{level:6,xp:44,hp:113,maxHp:160,coins:321,inventory:[{id:'w3',qty:1},{id:'a2',qty:1},{id:'potion',qty:3},{id:'tooth',qty:4},{id:'gem',qty:2}],weapon:'w3',armour:'a2',x:0,z:64},killCount:17,visited:[0,1,2,4],bossDead:true,chests:[true,false],loot:[{id:'coin',qty:12,x:-23,z:30}],settings:{quality:'low',sound:false}};
 await page.addInitScript(data=>{if(!localStorage.getItem('fixture-written')){localStorage.setItem('realm-fallen-save-v1',JSON.stringify(data));localStorage.setItem('fixture-written','1')}localStorage.setItem('realm-fallen-settings',JSON.stringify(data.settings))},oldSave);
 await page.goto((process.env.GAME_URL||'http://127.0.0.1:8000/')+'?test');await page.waitForFunction(()=>window.__realm);await page.click('#continue');
 let p=await page.evaluate(()=>__realm.player);for(const k of ['level','xp','hp','coins','weapon','armour'])assert.equal(p[k],oldSave.player[k]);assert.deepEqual(p.inventory,oldSave.player.inventory);
 assert.equal(await page.evaluate(()=>__realm.bossDead),true);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('realm-fallen-save-v1-backup')).version),1);
 assert.equal(p.stamina,100);console.log('PASS V1 migration preserves equipment, inventory, XP, level, health, coins, chief completion, and backup');
 const step=frames=>page.evaluate(n=>{for(let i=0;i<n;i++)__realm.step(1/60)},frames);
 await step(80);await page.keyboard.down('KeyF');await step(1);assert.equal(await page.evaluate(()=>__realm.blocking),true);
 let before=await page.evaluate(()=>({hp:__realm.player.hp,stamina:__realm.player.stamina}));await page.evaluate(()=>__realm.hurtPlayer(20));let after=await page.evaluate(()=>({hp:__realm.player.hp,stamina:__realm.player.stamina}));assert(before.hp-after.hp<=5);assert(before.stamina-after.stamina>=18);
 await page.keyboard.up('KeyF');await step(40);before=await page.evaluate(()=>__realm.player.hp);await page.evaluate(()=>__realm.hurtPlayer(20));assert.equal(before-await page.evaluate(()=>__realm.player.hp),16);
 await step(40);await page.evaluate(()=>__realm.player.stamina=2);await page.keyboard.down('KeyF');await step(1);await page.evaluate(()=>__realm.hurtPlayer(20));assert.equal(await page.evaluate(()=>__realm.player.stamina),0);assert(await page.evaluate(()=>__realm.guardBreak)>0);await page.keyboard.up('KeyF');
 before=await page.evaluate(()=>__realm.hero.root.position.z);await page.keyboard.down('KeyW');await step(20);await page.keyboard.up('KeyW');assert(before-await page.evaluate(()=>__realm.hero.root.position.z)>1);
 await page.evaluate(()=>{__realm.player.stamina=0;__realm.startDodge()});before=await page.evaluate(()=>__realm.hero.root.position.z);await step(8);assert.equal(await page.evaluate(()=>__realm.hero.root.position.z),before);
 await step(160);await page.evaluate(()=>__realm.startDodge());await step(15);assert(Math.abs(before-await page.evaluate(()=>__realm.hero.root.position.z))>1);
 console.log('PASS shield reduction and stamina debit, guard break, movement while exhausted, dodge lockout and recovery');
 await step(60);await page.keyboard.down('ShiftLeft');await page.keyboard.down('KeyW');before=await page.evaluate(()=>__realm.player.stamina);await step(30);await page.keyboard.up('KeyW');await page.keyboard.up('ShiftLeft');assert(await page.evaluate(()=>__realm.player.stamina)<before);console.log('PASS sprint drains stamina');
 await page.evaluate(()=>{for(const e of __realm.enemies)e.hp=0;const e=__realm.enemies[9];e.hp=400;e.maxHp=400;e.state='patrol';e.cooldown=99;__realm.setPosition(e.home.x,e.home.z+2);e.root.position.set(e.home.x,__realm.surface(e.home.x,e.home.z),e.home.z);__realm.player.hp=160});
 const combos=[];for(let i=0;i<3;i++){await page.evaluate(()=>__realm.startAttack());combos.push(await page.evaluate(()=>__realm.attack.combo));const hp=await page.evaluate(()=>__realm.enemies[9].hp);await step(i===2?48:33);assert(await page.evaluate(()=>__realm.enemies[9].hp)<hp)}assert.deepEqual(combos,[0,1,2]);console.log('PASS original three-hit combo contact windows and damage');
 await page.evaluate(()=>{__realm.enemies[9].hp=0;__realm.setPosition(-46,39);__realm.living.enterCave();__realm.living.serialize().gateOpen=true;const e=__realm.living.guardian;e.hp=260;e.state='chase';e.cooldown=0;e.root.position.set(299,0,-51);__realm.setPosition(299,-49);__realm.player.hp=160});
 const patterns=await page.evaluate(()=>{const seen=new Set();for(let i=0;i<620&&__realm.player.hp>0;i++){__realm.step(1/60);const g=__realm.living.guardian;if(g.state==='attack')seen.add(g.pattern%3)}return {patterns:[...seen],hp:__realm.player.hp}});assert.equal(patterns.patterns.length,3);assert(patterns.hp<160&&patterns.hp>0);console.log('PASS Guardian AI naturally selects three telegraphed, damaging patterns');
 await page.evaluate(()=>{const g=__realm.living.guardian;g.hp=260;g.state='chase';g.stagger=0;g.root.position.set(299,0,-51);__realm.setPosition(299,-49);__realm.player.hp=160});
 for(let i=0;i<18;i++){if(await page.evaluate(()=>__realm.living.guardian.hp<=0))break;await page.evaluate(()=>__realm.startAttack());await step(48)}
 assert.equal(await page.evaluate(()=>__realm.living.guardian.hp),0);assert.equal(await page.evaluate(()=>__realm.state),'playing');console.log('PASS Guardian defeated through normal sword combat');
 await page.evaluate(()=>{__realm.setPosition(300,5);__realm.living.exitCave()});await page.click('#pause-button');await page.click('#reset-boss');await page.evaluate(()=>{__realm.setPosition(-8,-65);__realm.player.hp=__realm.player.maxHp});
 for(let i=0;i<22;i++){if(await page.evaluate(()=>__realm.bossDead))break;await page.evaluate(()=>__realm.startAttack());await step(48)}assert.equal(await page.evaluate(()=>__realm.bossDead),true);console.log('PASS existing Goblin Chief still takes sword damage, dies and awards victory');
 assert.deepEqual(errors,[]);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
