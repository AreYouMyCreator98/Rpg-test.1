// Two WebGL clients (drawing throttled to spare software GPU), real game logic
// and the real Supabase adapter, with a deterministic
// Supabase SDK service double. Live project/network authorization is separate.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const sdk=`export function createClient(){const uid=crypto.randomUUID(),listeners=new Map();window.__roomEmit=(topic,payload)=>listeners.get(topic)?.({payload});return {
 auth:{getSession:async()=>({data:{session:{user:{id:uid},access_token:uid}}}),stopAutoRefresh:async()=>{}},
 realtime:{setAuth:async()=>{},disconnect(){}},
 rpc:async(name,args)=>{try{return {data:await window.__roomRpc(uid,name,args),error:null}}catch(e){return {error:{message:e.message}}}},
 channel(topic){return {on(event,filter,callback){listeners.set(topic,callback);return this},subscribe(callback){window.__roomSubscribe(uid,topic).then(()=>callback('SUBSCRIBED')).catch(()=>callback('CHANNEL_ERROR'));return this},send(message){return window.__roomSend(uid,topic,message.payload)},topic}},
 async removeChannel(ch){listeners.delete(ch.topic);await window.__roomRemove(ch.topic)},async removeAllChannels(){for(const topic of listeners.keys())await window.__roomRemove(topic);listeners.clear()}
}}`;
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-background-timer-throttling','--disable-renderer-backgrounding']});
 const rooms=new Map(),members=new Map(),subscriptions=new Map(),errors=[];let serial=0,delayPage=null,releaseState=null,stateWaiting=null;
 function roomState(uid){const r=rooms.get(members.get(uid));return r?{...r,players:[...r.players]}:null}
 try{
 const context=await browser.newContext({viewport:{width:960,height:700}});
 await context.route('**/@supabase/supabase-js@2.117.3/+esm',r=>r.fulfill({body:sdk,contentType:'application/javascript'}));
 if(process.env.THREE_TEST_MODULE)await context.route('**/three@0.160.1/build/three.module.js',r=>r.fulfill({path:process.env.THREE_TEST_MODULE,contentType:'application/javascript'}));
 if(process.env.SCOUT_TEST_CACHE)for(const file of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js'])await context.route('**/examples/jsm/'+file,r=>r.fulfill({path:process.env.SCOUT_TEST_CACHE+'/'+file.split('/').pop(),contentType:'application/javascript'}));
 await context.addInitScript(()=>{localStorage.setItem('realm-fallen-settings',JSON.stringify({quality:'low',sound:false}));localStorage.setItem('realm-supabase',JSON.stringify({url:'https://realm-test.supabase.co',key:'sb_publishable_test'}))});
 await context.exposeBinding('__roomRpc',({page},uid,name,args)=>{
  if(name==='realm_create_room'){if(members.has(uid))throw Error('Already joined');const code=String(++serial).padStart(16,'0'),r={id:crypto.randomUUID(),code,host:uid,public:args.is_public,name:args.player_name+'’s world',players:[{id:uid,name:args.player_name}]};rooms.set(code,r);members.set(uid,code);return roomState(uid)}
  if(name==='realm_join_room'){const r=rooms.get(args.invite_code);if(!r)throw Error('Room not found');if(r.players.length>=4)throw Error('Room full');r.players.push({id:uid,name:args.player_name});members.set(uid,r.code);return roomState(uid)}
  if(name==='realm_room_state'){if(page===delayPage){delayPage=null;const stale=roomState(uid);return new Promise(resolve=>{releaseState=()=>resolve(stale);stateWaiting?.()})}return roomState(uid);}
  if(name==='realm_list_rooms')return [...rooms.values()].filter(r=>r.public).map(r=>({code:r.code,name:r.name,count:r.players.length}));
  if(name==='realm_leave_room'){const r=rooms.get(members.get(uid));if(r){if(r.host===uid){rooms.delete(r.code);for(const p of r.players)members.delete(p.id)}else{r.players=r.players.filter(p=>p.id!==uid);members.delete(uid)}}return null}
  throw Error('Unknown RPC '+name);
 });
 await context.exposeBinding('__roomSubscribe',({page},uid,topic)=>{const r=roomState(uid);assert(r&&topic.startsWith('realm:'+r.id+':'));const list=subscriptions.get(topic)||new Set();list.add(page);subscriptions.set(topic,list)});
 await context.exposeBinding('__roomRemove',({page},topic)=>subscriptions.get(topic)?.delete(page));
 await context.exposeBinding('__roomSend',async({page},uid,topic,payload)=>{assert(topic.endsWith(':'+uid));for(const dest of subscriptions.get(topic)||[])if(dest!==page&&!dest.isClosed())await dest.evaluate(([t,p])=>window.__roomEmit(t,p),[topic,payload]);return 'ok'});
 const a=await context.newPage(),b=await context.newPage();for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));await p.goto((process.env.GAME_URL||'http://127.0.0.1:8000/')+'?test');await p.waitForFunction(()=>window.__realm?.net);await p.evaluate(()=>{const setRatio=__realm.renderer.setPixelRatio.bind(__realm.renderer);__realm.renderer.setPixelRatio=value=>setRatio(Math.min(value,.25));__realm.renderer.setPixelRatio(.25);__realm.renderer.render=()=>{}})}
 await a.click('#play');await a.evaluate(()=>{__realm.player.coins=321;__realm.save()});const saved=await a.evaluate(()=>localStorage.getItem('realm-fallen-save-v1'));
 await a.evaluate(()=>__realm.net.lobby());await a.fill('#room-name','Host');await a.click('#create-private');await a.waitForFunction(()=>__realm.net.active&&__realm.net.host);const code=await a.evaluate(()=>__realm.net.code);
 await b.click('#multiplayer');await b.click('#refresh-rooms');await b.waitForFunction(()=>document.querySelector('#room-list').textContent.includes('No open'));
 await b.fill('#join-code',code);await b.fill('#room-name','Ally');await b.click('#join-room');await b.waitForFunction(()=>__realm.net.active&&!__realm.net.host);
 await a.evaluate(()=>__realm.closeModal());await b.evaluate(()=>__realm.closeModal());
 await a.waitForFunction(()=>__realm.net.peers.size===1);await b.waitForFunction(()=>__realm.net.peers.size===1);
 assert.equal(await a.evaluate(()=>__realm.player.coins),45);assert.equal(await a.evaluate(()=>localStorage.getItem('realm-fallen-save-v1')),saved);
 console.log('PASS private room creation, hidden discovery, code join, remote hero and isolated solo save');
 // Remote equipment and movement.
 await b.evaluate(()=>{__realm.setPosition(4,60);__realm.addItem('w2');__realm.player.weapon='w2';__realm.equipVisual()});
 await a.waitForFunction(()=>[...__realm.net.peers.values()][0]?.pose?.weapon==='w2');
 assert(Math.abs(await a.evaluate(()=>[...__realm.net.peers.values()][0].pose.x)-4)<.1);
 // Drop the same shared coin pile; race both pickup requests, only one may win.
 await a.evaluate(()=>{__realm.closeModal();__realm.setPosition(4,60);__realm.drop('coin',4,60,17)});await b.waitForFunction(()=>__realm.loot.some(l=>l.id==='coin'));
 await Promise.all([a.evaluate(()=>__realm.pickup()),b.evaluate(()=>__realm.pickup())]);
 await a.waitForFunction(()=>!__realm.loot.some(l=>l.id==='coin'));await b.waitForFunction(()=>!__realm.loot.some(l=>l.id==='coin'));
 assert.equal((await a.evaluate(()=>__realm.player.coins))+(await b.evaluate(()=>__realm.player.coins)),107);
 console.log('PASS movement/equipment replication and atomic shared-loot pickup');
 await a.evaluate(()=>__realm.setPosition(-440,-590));await b.evaluate(()=>__realm.setPosition(-443,-590));await a.waitForFunction(()=>[...__realm.net.peers.values()].some(p=>p.pose?.x===-443&&p.pose.z===-590&&p.ch.root.visible));await b.waitForFunction(()=>[...__realm.net.peers.values()].some(p=>p.pose?.x===-440&&p.pose.z===-590&&p.ch.root.visible));console.log('PASS both heroes replicate and remain visible in expanded western/northern regions');
 // Host stays in village. Enemy must chase and damage the remote player.
 await a.evaluate(()=>{__realm.setPosition(0,64);const e=__realm.enemies[0];e.hp=e.maxHp;e.root.position.set(-21,__realm.surface(-21,39),39);e.state='patrol';e.cooldown=0});
 await b.evaluate(()=>{__realm.setPosition(-21,40.5);__realm.player.hp=100});
 await b.waitForFunction(()=>__realm.player.hp<100,{},{timeout:20000}).catch(async e=>{console.log('HOST',await a.evaluate(()=>({panel:__realm.panel,enemy:__realm.enemies[0].state,pos:__realm.enemies[0].root.position.toArray(),peers:[...__realm.net.peers.values()].map(p=>({pose:p.pose,last:p.last}))})));console.log('GUEST',await b.evaluate(()=>({panel:__realm.panel,state:__realm.state,hp:__realm.player.hp,pos:__realm.hero.root.position.toArray()})));throw e});
 const before=await a.evaluate(()=>__realm.enemies[0].hp);
 await b.evaluate(()=>{const e=__realm.enemies[0];__realm.setPosition(e.root.position.x,e.root.position.z+1.5);__realm.startAttack()});
 await a.waitForFunction(hp=>__realm.enemies[0].hp<hp,before,{timeout:10000});
 for(const page of [a,b])assert.equal(await page.evaluate(()=>__realm.enemies[0].scoutModel?.actions.Attack.getClip().name),'Attack');
 console.log('PASS host AI targets guest, guest takes damage, guest sword contact damages host enemy');
 // Kill with real queued sword swings; both clients converge and see the loot.
 for(let i=0;i<12;i++){if(await a.evaluate(()=>__realm.enemies[0].hp<=0))break;await b.waitForFunction(()=>!__realm.attack);await b.evaluate(()=>{__realm.player.hp=100;const e=__realm.enemies[0];__realm.setPosition(e.root.position.x,e.root.position.z+1.4);__realm.startAttack()});await b.waitForFunction(()=>!__realm.attack);await b.waitForTimeout(250)}
 await b.waitForFunction(()=>__realm.enemies[0].hp<=0);assert(await b.evaluate(()=>__realm.player.xp>0));await b.waitForFunction(()=>__realm.loot.some(l=>l.id==='tooth'));
 await a.evaluate(()=>{__realm.setPosition(-60,-308);const e=__realm.enemies.find(e=>e.family==='elemental'&&e.isBoss);e.hp=e.maxHp;e.state='chase';e.cooldown=0});
 await b.evaluate(()=>{__realm.setPosition(-69,-310);__realm.player.hp=100});
 await a.waitForFunction(()=>[...__realm.net.peers.values()].some(p=>p.pose?.z<-300));
 await a.evaluate(()=>{const e=__realm.enemies.find(e=>e.family==='elemental'&&e.isBoss);__realm.hurtEnemy(e,9999)});
 await b.waitForFunction(()=>__realm.living.serialize().frontierBosses.includes('elemental')&&__realm.loot.some(l=>l.id==='frontier_elemental'));
 console.log('PASS expanded northern coordinates, new boss death flags and unique loot replicate');
 // Shared cave key/chest and gate through actual pickup/interaction API.
 await a.evaluate(()=>{for(const e of __realm.enemies)if(e.cave&&!e.guardian){e.hp=0;e.dead=4}__realm.setPosition(-46,38);__realm.living.enterCave();__realm.setPosition(313,-21);__realm.pickup()});
 await b.evaluate(()=>{__realm.setPosition(-46,38);__realm.living.enterCave();__realm.setPosition(312.3,-21)});
 await b.waitForFunction(()=>__realm.loot.some(l=>l.id==='cavekey'));await b.evaluate(()=>__realm.pickup());await b.waitForFunction(()=>__realm.living.serialize().sharedKey===true);
 await b.evaluate(()=>{__realm.setPosition(300,-29);__realm.pickup()});await a.waitForFunction(()=>__realm.living.serialize().gateOpen);await b.waitForFunction(()=>__realm.living.serialize().gateOpen);
 console.log('PASS shared enemy death, XP and loot; guest key pickup opens the shared cave gate');

 // Expansion dungeons remain host authoritative even when only the guest is inside.
 await a.evaluate(()=>{for(const e of __realm.expansion.creatures)if(e.dungeon==='frost'&&!e.isBoss){e.hp=0;e.dead=4}});
 await b.evaluate(()=>{__realm.setPosition(915,-21);__realm.living.setArea('cave');__realm.pickup()});
 await a.waitForFunction(()=>__realm.expansion.state().dungeons.frost?.key);await b.waitForFunction(()=>__realm.expansion.state().dungeons.frost?.key);
 await b.evaluate(()=>{__realm.setPosition(900,-31);__realm.pickup()});await a.waitForFunction(()=>__realm.expansion.state().dungeons.frost?.gate);await b.waitForFunction(()=>__realm.expansion.state().dungeons.frost?.gate);
 await b.evaluate(()=>{__realm.player.pets=['owl'];__realm.player.pet='owl';__realm.player.mounts=['horse'];__realm.player.mount='horse';__realm.living.setArea('world');__realm.setPosition(0,64);__realm.companions.summon()});
 await a.waitForFunction(()=>[...__realm.net.peers.values()].some(p=>p.pose?.pet==='owl'&&p.pose?.mounted));
 assert(await a.evaluate(()=>[...__realm.net.peers.values()][0].ch.rig.position.y>.5));
 await b.evaluate(()=>{__realm.companions.dismount(true);__realm.setPosition(299,-48);__realm.living.setArea('cave')});
 console.log('PASS guest opens expansion chest/gate through host and replicated pet/mounted rider');
 // Menus must not stop the host simulating another player's fight.
 await a.evaluate(()=>__realm.net.lobby());await a.bringToFront();await b.evaluate(()=>{__realm.setPosition(299,-48);__realm.player.hp=100;for(let i=0;i<30;i++)__realm.step(.05)});await b.waitForFunction(()=>__realm.player.hp<100,{},{timeout:30000}).catch(async e=>{console.log('GUARDIAN',await a.evaluate(()=>({attack:__realm.living.guardian.attack,hit:__realm.living.guardian.hit,state:__realm.living.guardian.state,hp:__realm.living.guardian.hp,pos:__realm.living.guardian.root.position.toArray(),target:__realm.living.guardian.netTarget,peers:[...__realm.net.peers.values()].map(p=>({pose:p.pose,position:p.ch.root.position.toArray()}))})));console.log('GUEST',await b.evaluate(()=>({invulnerable:__realm.invulnerable,mounted:__realm.companions.mounted,panel:__realm.panel,state:__realm.state,hp:__realm.player.hp})));throw e});
 console.log('PASS host menu keeps guardian combat running for guest');
 await b.evaluate(()=>{__realm.closeModal();__realm.living.setArea('overworld');__realm.setPosition(-74,118)});await b.waitForTimeout(600);
 await b.evaluate(()=>__realm.homestead.change({action:'place',piece:{id:crypto.randomUUID(),type:'foundation',x:0,z:0,rotation:0,level:0}},'coop'));
 await a.waitForFunction(()=>__realm.homestead.states.coop.pieces.length===1);await b.waitForFunction(()=>__realm.homestead.states.coop.pieces.length===1);
 assert.equal(await b.evaluate(()=>__realm.homestead.states.home.canEdit),false);
 console.log('PASS anonymous guest builds shared foundation through host, with private home read-only');
 await b.evaluate(()=>__realm.setPosition(-59,133));await b.waitForTimeout(500);await b.evaluate(()=>__realm.homestead.change({action:'craft',recipe:'axe'},'coop'));
 await b.waitForFunction(()=>__realm.homestead.states.coop.workshop.packs[__realm.net.id]?.tools.axe===1);
 assert.equal(await a.evaluate(()=>__realm.homestead.states.coop.workshop.packs.owner?.tools.axe||0),0);
 await b.evaluate(()=>__realm.setPosition(-86,142));await b.waitForTimeout(500);
 for(let i=0;i<3;i++){await b.evaluate(()=>__realm.pickup());await b.waitForFunction(()=>!!__realm.homestead.gathering.animation);await b.waitForFunction(()=>!__realm.homestead.gathering.animation);await b.waitForTimeout(250)}
 await b.waitForFunction(()=>__realm.homestead.states.coop.workshop.packs[__realm.net.id]?.bag.logs===6);
 await b.evaluate(()=>__realm.setPosition(-59,129));await b.waitForTimeout(500);await b.evaluate(()=>__realm.homestead.change({action:'transfer',direction:'deposit',resource:'all'},'coop'));
 await a.waitForFunction(()=>__realm.homestead.states.coop.workshop.stock.logs===6);
 console.log('PASS anonymous guest tools remain personal; animated gathering deposits into shared host storage');
 const hostPosition=await a.evaluate(()=>__realm.hero.root.position.toArray());await b.evaluate(()=>__realm.townReturnMenu());await b.click('#town-return-confirm');assert.equal(await b.evaluate(()=>__realm.hero.root.position.z),64);assert.deepEqual(await a.evaluate(()=>__realm.hero.root.position.toArray()),hostPosition);console.log('PASS guest town return leaves host position and party intact');


 await a.click('#leave-room');await b.waitForFunction(()=>!__realm.net.active,{},{timeout:12000});
 assert.equal(await a.evaluate(()=>__realm.player.coins),321);assert.equal(await b.evaluate(()=>__realm.player.coins),321);
 // Public discovery uses the same working join flow.
 await a.evaluate(()=>__realm.net.lobby());await a.click('#create-public');await a.waitForFunction(()=>__realm.net.active);
 await b.setViewportSize({width:390,height:844});await b.evaluate(()=>__realm.net.lobby());await b.locator('#room-name').fill('');await b.locator('#room-name').pressSequentially('Mira');assert.equal(await b.evaluate(()=>__realm.panel),'multiplayer');await b.click('#refresh-rooms');await b.waitForSelector('#room-list button');await b.click('#room-list button');await b.waitForFunction(()=>__realm.net.active);
 assert.equal(await b.evaluate(()=>__realm.net.code),await a.evaluate(()=>__realm.net.code));await b.evaluate(()=>__realm.net.lobby());assert(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await b.screenshot({path:process.env.MULTIPLAYER_SCREENSHOT||'/tmp/realm-multiplayer-mobile.png'});
 const waiting=new Promise(resolve=>{stateWaiting=resolve});delayPage=b;await waiting;await b.evaluate(()=>__realm.net.leave('Done'));releaseState();await b.waitForTimeout(500);await b.evaluate(()=>__realm.net.lobby());await b.click('#refresh-rooms');await b.waitForSelector('#room-list button');await b.click('#room-list button');await b.waitForFunction(()=>__realm.net.active);await b.evaluate(()=>__realm.net.leave('Done'));await a.evaluate(()=>__realm.net.leave('Done'));
 assert.deepEqual(errors,[]);console.log('PASS host departure restores solo, public discovery/join, leave cleanup, no browser exceptions');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
