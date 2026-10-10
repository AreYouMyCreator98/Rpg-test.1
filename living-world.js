// Realm of the Fallen V2. Local ES module; no build or new external assets.
export function migrateSave(data) {
  if (!data || ![1, 2, 3].includes(data.version)) return null;
  const living = data.version >= 2 && data.living && typeof data.living === 'object' ? data.living : {};
  return {...data, living};
}

export function installLivingWorld(api) {
  const {THREE, scene, mesh, mat, hero, items, ground, character, obstacle, $} = api;
  api.poi[0].name="Wanderer’s Village";
  const npcs = [], village = new THREE.Group(); scene.add(village);
  const buildings = [];
  let data = {}, vendor = null;
  const quantity = id => api.player.inventory.find(i => i.id === id)?.qty || 0;
  const removeItem = (id, count) => {
    const i = api.player.inventory.find(i => i.id === id);
    if (!i || i.qty < count) return false;
    i.qty -= count;
    if (!i.qty) api.player.inventory.splice(api.player.inventory.indexOf(i), 1);
    return true;
  };
  items.caveblade={name:'Hollowroot Fang',type:'weapon',rarity:2,damage:24,icon:'⚔',color:0x70c8c7,desc:'A rare crystal-edged blade from the Guardian.'};
  // Upgrade variants represent individual items, never a global bonus to every copy.
  for (const id of Object.keys(items)) if (items[id].type === 'weapon') {
    items[id].base = id; items[id].upgrade = 0;
    for (let rank = 1; rank <= 3; rank++) items[id + '~' + rank] = {
      ...items[id], name: items[id].name + ' +' + rank, damage: items[id].damage + rank * 4,
      upgrade: rank, desc: items[id].desc + ' Tempered at the village forge.'
    };
  }
  function building(x, z, roof, label) {
    const y = ground(x, z), g = new THREE.Group(); g.position.set(x, y, z); village.add(g);
    mesh('box', 0xb9ad85, 0, 1.65, 0, 5.4, 3.3, 4.4, g);
    mesh('box', 0x748071, 0, .22, 0, 5.7, .5, 4.7, g);
    for (const side of [-1, 1]) {
      const r = mesh('box', roof, side * 1.55, 4, 0, 3.8, .25, 5.2, g); r.rotation.z = -side * .48;
      mesh('box', 0x65462f, side * 2.62, 1.8, 2.25, .18, 3.5, .18, g);
      mesh('box', 0x65462f, side * 1.65, 1.8, 2.26, .13, 3.4, .15, g);
      mesh('box', mat(0xe9c47d, {emissive:0x8d591f,emissiveIntensity:.45}), side * 1.6, 1.9, 2.25, .8, .9, .04, g);
      mesh('box', 0x614b35, side * 1.6, 1.9, 2.3, .07, 1, .07, g);
    }
    mesh('box', 0x594530, 0, 1, 2.26, 1.2, 2, .1, g);
    mesh('orb', 0xdeb969, .37, 1, 2.35, .08, .08, .08, g);
    mesh('box', 0x614b35, 0, 3, 2.3, 5.5, .15, .13, g);
    mesh('box', 0x7e8173, 1.7, 4.5, -1.1, .65, 2, .65, g);
    // Timber framing and glazing on every side, including the camera-facing rear.
    for(const side of [-1,1]){
      for(const h of [.7,2.8])mesh('box',0x6c5036,side*2.74,h,0,.1,.13,4.4,g);
      for(const z of [-1.9,0,1.9])mesh('box',0x6c5036,side*2.74,1.7,z,.1,3.3,.13,g);
      mesh('box',mat(0xe5c782,{emissive:0x705128,emissiveIntensity:.3}),side*2.8,1.8,.6,.025,.75,.7,g);
      for(const xx of [-2.6,0,2.6])mesh('box',0x6c5036,xx,1.7,side*2.24,.14,3.3,.1,g);
      const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute([-2.7,3.3,side*2.2,2.7,3.3,side*2.2,0,4.8,side*2.2],3));shape.computeVertexNormals();g.add(new THREE.Mesh(shape,mat(0xb9ad85,{side:THREE.DoubleSide})));
      mesh('box',0x6c5036,0,3.3,side*2.3,5.4,.15,.15,g);mesh('box',0x6c5036,0,4,side*2.3,.15,1.5,.15,g);
    }
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#5b4530';ctx.fillRect(0,0,512,96);ctx.strokeStyle='#cfb477';ctx.strokeRect(5,5,502,86);ctx.fillStyle='#f2dcad';ctx.font='30px Georgia';ctx.textAlign='center';ctx.fillText(label,256,57);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.53),new THREE.MeshBasicMaterial({map:texture}));sign.position.set(0,2.75,2.4);g.add(sign);
    obstacle(x,z,3.25); buildings.push({x,z,w:6.7,d:5.2,label,g});
  }
  building(-12,65,0x805b48,'Ember & Iron'); building(12,72,0x466764,'The Wayfarer Tavern');
  building(-14,55,0x647656,'Weaver’s Cottage'); building(14,55,0x976a4d,'Village Storehouse');
  function barrel(x,z) {
    const y=ground(x,z); mesh('cyl',0x8c6440,x,y+.55,z,.42,1.1,.42,village);
    for (const h of [.15,.9]) mesh('cyl',0x58675f,x,y+h,z,.44,.08,.44,village);
  }
  [[-8,68],[-9,68],[8,74],[9,74],[-9,81],[9,56],[10,56]].forEach(p=>barrel(...p));
  for (let x=-18;x<=18;x+=3) if(Math.abs(x)>4) {
    const y=ground(x,90);mesh('box',0x8d6b43,x,y+.7,90,.2,1.4,.2,village);
    mesh('box',0x8d6b43,x,y+.8,90,3,.15,.15,village);obstacle(x,90,.25);
  }
  const lanterns=[];
  for(const [x,z] of [[-6,56],[7,61],[-6,76],[7,82]]) {
    const y=ground(x,z);mesh('cyl',0x6c5438,x,y+1.5,z,.09,3,.09,village);
    const glow=mesh('box',mat(0xffd68d,{emissive:0xffa440,emissiveIntensity:1}),x,y+2.7,z,.3,.42,.3,village);
    mesh('cone',0x53665e,x,y+3,z,.3,.25,.3,village);lanterns.push(glow);
  }
  const fy=ground(-7,63);mesh('box',0x626962,-7,fy+.65,63,1.5,1.3,1.2,village);
  const forge=mesh('cone',mat(0xffc464,{emissive:0xff5c0b,emissiveIntensity:2}),-7,fy+1.4,63,.6,1,.45,village);
  mesh('box',0x454f50,-7,ground(-7,60)+.85,60,1.2,.3,.6,village);
  mesh('box',0x535950,-7,ground(-7,60)+.4,60,.45,.8,.45,village);
  obstacle(8,57,1.3);obstacle(-7,63,.8);obstacle(-7,60,.6);
  const stallY=ground(8,57);mesh('box',0x8c6949,8,stallY+.8,57,3,1,.8,village);
  for(const s of [-1,1]) mesh('cyl',0x695037,8+s*1.6,stallY+1.6,57,.09,3.2,.09,village);
  for(let i=0;i<6;i++) mesh('box',i%2?0xe5cd94:0x547970,6.5+i*.6,stallY+3.1,57,.6,.12,2.2,village);
  for(let i=0;i<5;i++) mesh('orb',0xc99058,7+i*.4,stallY+1.4,57,.17,.2,.17,village);
  const board={x:1,z:72};mesh('box',0x73553b,1,ground(1,72)+1.8,72,2.8,1.6,.18,village);
  for(const x of [-.1,2.1]) mesh('box',0x695139,x,ground(x,72)+1,72,.13,2.5,.15,village);
  for(let i=0;i<3;i++)for(const side of [-1,1])mesh('box',0xdfd0a0,.2+i*.75,ground(1,72)+1.8,72+side*.12,.55,.8,.025,village);
  function npc(id,name,role,x,z,color) {
    const ch=character();ch.root.position.set(x,ground(x,z),z);ch.weapon.visible=false;ch.bodyMat.color.setHex(color);ch.cape.material=mat(id==='elder'?0x6b7050:0x4d586d);if(id==='smith'){ch.cape.visible=false;mesh('box',0x634632,0,1.14,.28,.5,.7,.05,ch.rig)}for(const m of ch.head.children)if(m.material?.color?.getHex()===0x775331)m.material=mat(id==='elder'?0xb8b29c:id==='merchant'?0x39342e:0x775331);
    const label=document.createElement('div');label.className='npc-label';label.textContent=name+' · '+role;label.style.display='none';$('world-ui').append(label);const n={...ch,id,name,role,x,z,color,label};npcs.push(n);return n;
  }
  const smith=npc('smith','Bram','Blacksmith',-7,58,0x87583c);
  mesh('box',0x6b7370,0,-.65,.35,.4,.25,.2,smith.arms[1]);
  npc('merchant','Mira','Merchant',8,54,0x657392);
  npc('elder','Elowen','Village Keeper',-1,70,0x79805b);
  const prices={w1:30,w2:85,w3:170,w4:290,a1:25,a2:70,a3:140,a4:250,potion:12};
  const sellPrice=id=>id==='tooth'?4:id==='gem'?32:Math.max(2,Math.floor((prices[items[id]?.base||id]||10)*.4)+(items[id]?.upgrade||0)*10);
  function nearestNPC(){return npcs.filter(n=>n.root.position.distanceTo(hero.root.position)<3.1).sort((a,b)=>a.root.position.distanceToSquared(hero.root.position)-b.root.position.distanceToSquared(hero.root.position))[0]}
  function canTrade(role) {return api.state==='playing' && api.panel==='shop' && (vendor?.trade||vendor?.id)===role && nearestNPC()===vendor;}
  function recordTrade(action,id){const account=api.getAccounts?.();if(account?.active&&vendor?.civic&&!account.regionalTrading){api.toast('Regional cloud trading is not available yet. Bram and Mira can still trade in Wanderer’s Village.');return false}const result=api.accountEvent?.(action,{id,vendor:vendor?.id});return !account?.active||!!result;}
  function purchase(id) {
    if(!vendor||!canTrade(vendor.trade||vendor.id))return false;
    const allowed=(vendor.trade||vendor.id)==='smith'?['w1','w2','w3','w4']:['potion','a1','a2','a3','a4'];
    if(!allowed.includes(id)||api.player.coins<prices[id]||(items[id].type!=='consumable'&&quantity(id)))return false;
    if(!recordTrade('buy',id))return false;api.player.coins-=prices[id];api.addItem(id);api.save();api.sound('coin');api.toast('Purchased '+items[id].name);return true;
  }
  function sell(id) {
    if(!canTrade('merchant')||!quantity(id)||['quest'].includes(items[id]?.type)||[api.player.weapon,api.player.armour].includes(id))return false;
    if(!recordTrade('sell',id)||!removeItem(id,1))return false;api.player.coins+=sellPrice(id);api.save();api.sound('coin');return true;
  }
  function upgradeCost(id) {const rank=items[id]?.upgrade||0;return{coins:35+rank*40,tooth:2+rank*2,gem:rank>=1?1:0};}
  function upgrade(id) {
    const item=items[id],cost=upgradeCost(id);
    if(!canTrade('smith')||item?.type!=='weapon'||item.upgrade>=3||!quantity(id)||api.player.coins<cost.coins||quantity('tooth')<cost.tooth||quantity('gem')<cost.gem)return false;
    // Validate everything before the synchronous debit. One copy in, one copy out.
    if(!recordTrade('upgrade',id))return false;api.player.coins-=cost.coins;removeItem('tooth',cost.tooth);if(cost.gem)removeItem('gem',cost.gem);removeItem(id,1);
    const next=item.base+'~'+(item.upgrade+1);api.addItem(next);if(api.player.weapon===id)api.player.weapon=next;
    api.equipVisual();api.save();api.sound('level');api.toast('Tempered '+items[next].name);return true;
  }
  function portrait(n){return `<svg class="portrait" viewBox="0 0 80 90" aria-hidden="true"><path fill="#${n.color.toString(16)}" d="M7 90V62L25 50H55L73 62V90Z"/><path fill="#d4a676" d="M23 18L40 10L57 18V43L48 56H31L23 43Z"/><path fill="#67503a" d="M20 27V16L38 5L59 16V27L42 19Z"/><path fill="#273f32" d="M29 30H34V35H29ZM46 30H51V35H46Z"/><path stroke="#7d543b" d="M34 45H46"/></svg>`}
  function dialogue(n) {
    vendor=n;api.modal(n.name+' · '+n.role,`<div class="dialogue-intro">${portrait(n)}<p>${n.intro|| (n.id==='smith'?'A good blade grows with its bearer. Bring me coins, goblin teeth, and moonstones; I will temper your steel.':n.id==='merchant'?'Welcome home, traveller. I trade armour and healing draughts, and pay fairly for trophies from the wilds.':'Our village needs you. The forest grows restless, and something ancient stirs beneath the hills.')}</p></div><div class="menu-buttons">${['smith','merchant'].includes(n.trade||n.id)?'<button id="open-shop" class="primary">'+((n.trade||n.id)==='smith'?'Browse swords & upgrades':'Buy & sell goods')+'</button>':''}${n.id==='smith'?'<button id="npc-shelter">Learn to gather &amp; build a shelter</button>':''}${n.destination?'<button id="npc-directions">Mark '+n.destination.name+' on my map</button>':''}<button id="npc-quests">Ask about village work</button><button id="npc-leave">Farewell</button></div>`,'dialogue');
    if($('open-shop'))$('open-shop').onclick=()=>shop(n);if($('npc-shelter'))$('npc-shelter').onclick=()=>api.getHomestead()?.gathering.menu('quest');
    if($('npc-directions'))$('npc-directions').onclick=()=>{api.getFrontier().setWaypoint(n.destination.x,n.destination.z);api.closeModal();api.toast('Route marked · '+n.destination.name)};
    $('npc-quests').onclick=()=>questDialogue(n);$('npc-leave').onclick=api.closeModal;
  }
  function shop(n) {
    vendor=n;const stock=(n.trade||n.id)==='smith'?['w1','w2','w3','w4']:['potion','a1','a2','a3','a4'];
    api.modal(n.name+'’s '+((n.trade||n.id)==='smith'?'forge':'market'),`<div class="shop-wallet">${api.player.coins} coins · ${quantity('tooth')} teeth · ${quantity('gem')} moonstones</div><div id="shop-rows"></div><button id="shop-back">Back to conversation</button>`,'shop');
    const rows=$('shop-rows');
    function row(text,label,action,disabled=false){const el=document.createElement('div');el.className='shop-row';const span=document.createElement('span');span.textContent=text;const button=document.createElement('button');button.textContent=label;button.disabled=disabled;button.onclick=()=>{action();shop(n)};el.append(span,button);rows.append(el)}
    for(const id of stock){const it=items[id],owned=quantity(id);row(it.name+' · '+(it.damage?it.damage+' damage':it.defence!==undefined?it.defence+' defence':'65 healing'),owned&&it.type!=='consumable'?'Owned':'Buy · '+prices[id],()=>purchase(id),api.player.coins<prices[id]||!!(owned&&it.type!=='consumable'));}
    for(const entry of [...api.player.inventory]) {
      const it=items[entry.id],equipped=[api.player.weapon,api.player.armour].includes(entry.id);
      if((n.trade||n.id)==='smith'&&it.type==='weapon'&&it.upgrade<3){const c=upgradeCost(entry.id);row(it.name+': '+it.damage+' → '+(it.damage+4)+' damage · '+c.coins+' coins, '+c.tooth+' teeth'+(c.gem?', 1 moonstone':''),'Temper +'+(it.upgrade+1),()=>upgrade(entry.id),api.player.coins<c.coins||quantity('tooth')<c.tooth||quantity('gem')<c.gem)}
      if(['weapon','armour'].includes(it.type))row(it.name+' ×'+entry.qty,equipped?'Equipped':'Equip',()=>{api.player[it.type]=entry.id;api.equipVisual();api.save()},equipped);
      if((n.trade||n.id)==='merchant'&&it.type!=='quest')row(it.name+' ×'+entry.qty,equipped?'Unequip to sell':'Sell one · '+sellPrice(entry.id),()=>sell(entry.id),equipped);
    }
    $('shop-back').onclick=()=>dialogue(n);
  }
  const questDefinitions = [
    {id:'scouts',name:'A quieter forest',kind:'Side',giver:'smith',description:'Defeat five goblin scouts after accepting this task.',goal:5,gold:45,xp:40,target:[-23,36]},
    {id:'teeth',name:'Teeth for the forge',kind:'Side',giver:'smith',description:'Bring Bram ten goblin teeth. Turning them in consumes them.',goal:10,gold:60,xp:55,target:[-23,36]},
    {id:'supplies',name:'The missing caravan',kind:'Side',giver:'merchant',description:'Clear the goblin encampment and recover the marked supply crate.',goal:1,gold:75,xp:65,target:[24,-29]},
    {id:'trail',name:'Beyond Stonebridge',kind:'Main',giver:'elder',description:'Discover Stonebridge River and investigate the Mountain Ruins.',goal:2,gold:60,xp:70,target:[-14,9]},
    {id:'guardian',name:'Beneath the roots',kind:'Main',giver:'elder',description:'Enter Hollowroot Cave, find the gate key and defeat its Guardian.',goal:1,gold:130,xp:120,target:[-46,36]},
    {id:'relic',name:'A light brought home',kind:'Main',giver:'elder',description:'Recover the ancient relic from the Guardian and bring it to Elowen.',goal:1,gold:180,xp:140,target:[-46,36]}
  ];
  Object.assign(items,{
    supplies:{name:'Village Supplies',type:'quest',rarity:1,icon:'▣',desc:'Recovered caravan goods. Return to Mira.'},
    cavekey:{name:'Hollowroot Key',type:'quest',rarity:2,icon:'⚿',desc:'Opens the gate in Hollowroot Cave.'},
    relic:{name:'Ancient Relic',type:'quest',rarity:3,icon:'✧',desc:'A fragment of the old light. Return it to Elowen.'}
  });
  const supplyCrate=mesh('box',0xa17a4c,24,ground(24,-29)+.55,-29,1.2,1.1,1.2);
  mesh('box',0xe8cb7f,0,0,.51,.16,1.03,.03,supplyCrate);
  const beacon=mesh('orb',mat(0xe9c579,{emissive:0xb58132,emissiveIntensity:.6}),0,3,0,.18,.28,.18);beacon.visible=false;beacon.castShadow=false;
  const marker=document.createElement('div');marker.id='quest-marker';$('hud').append(marker);
  const journalButton=document.createElement('button');journalButton.id='journal-button';journalButton.textContent='J · Journal / Map';journalButton.onclick=()=>journal();document.querySelector('.quest').append(journalButton);
  function progress(q) {const extra=api.getExpansion?.()?.progress(q);if(extra!==null&&extra!==undefined)return extra;
    if(q.enemyFamily)return data.quests[q.id]?.count||0;
    if(q.bossFamily)return data.frontierBosses.includes(q.bossFamily)?1:0;
    if(q.id==='scouts')return data.quests.scouts.count;
    if(q.id==='teeth')return Math.min(10,quantity('tooth'));
    if(q.id==='supplies')return quantity('supplies')?1:0;
    if(q.id==='trail')return [2,4].filter(i=>api.visited.includes(i)).length;
    if(q.id==='guardian')return data.guardianDead?1:0;
    return quantity('relic')?1:0;
  }
  function acceptQuest(id) {
    const q=questDefinitions.find(q=>q.id===id);
    if(!q||api.panel!=='quest-dialogue'||vendor?.id!==q.giver||nearestNPC()!==vendor||data.quests[id].status!=='available')return false;
    api.accountEvent?.('quest_accept',{id});data.quests[id].status='active';data.tracked=id;api.save();api.toast('Quest accepted · '+q.name);return true;
  }
  function claimQuest(id) {
    const q=questDefinitions.find(q=>q.id===id);
    if(!q||api.panel!=='quest-dialogue'||vendor?.id!==q.giver||nearestNPC()!==vendor||data.quests[id].status!=='active'||progress(q)<q.goal)return false;
    // Mark claimed before awarding: repeated clicks cannot repeat the transaction.
    api.accountEvent?.('quest_claim',{id});data.quests[id].status='claimed';
    if(id==='teeth')removeItem('tooth',10);if(id==='supplies')removeItem('supplies',1);if(id==='relic')removeItem('relic',1);
    api.player.coins+=q.gold;api.awardXP(q.xp);api.save();api.sound('level');api.toast('Completed · '+q.name);return true;
  }
  function questDialogue(n) {
    vendor=n;api.modal(n.name+' · Village work','<div id="quest-list"></div><button id="quest-back">Back to conversation</button>','quest-dialogue');
    for(const q of questDefinitions.filter(q=>q.giver===n.id)){
      const status=data.quests[q.id].status,ready=progress(q)>=q.goal;
      const row=document.createElement('section');row.className='quest-entry';
      row.innerHTML=`<div class="eyebrow">${q.kind} quest</div><h3>${q.name}</h3><p>${q.description}</p><small>${status==='claimed'?'Completed':progress(q)+' / '+q.goal} · ${q.gold} coins + ${q.xp} XP</small>`;
      const b=document.createElement('button');b.textContent=status==='available'?'Accept quest':status==='claimed'?'Reward claimed':ready?'Complete quest':'In progress';b.disabled=status==='claimed'||status==='active'&&!ready;
      b.onclick=()=>{status==='available'?acceptQuest(q.id):claimQuest(q.id);questDialogue(n)};row.append(b);$('quest-list').append(row);
    }
    $('quest-back').onclick=()=>dialogue(n);
  }
  function journal() {
    if(api.state!=='playing')return;
    api.modal('Journal of the wilds','<div class="journal-tabs"><button id="journal-map">World map</button><button id="journal-shelter">Bram’s shelter contract</button></div><div id="journal-quests"></div>','journal');
    for(const kind of ['Main','Side'])for(const q of questDefinitions.filter(q=>q.kind===kind)){
      const state=data.quests[q.id],n=npcs.find(n=>n.id===q.giver),row=document.createElement('section');row.className='quest-entry';
      row.innerHTML=`<div class="eyebrow">${kind} · ${state.status}</div><h3>${q.name}</h3><p>${q.description}</p><small>${state.status==='claimed'?'Completed':progress(q)+' / '+q.goal} · ${q.gold} coins / ${q.xp} XP · Speak to ${n.name}</small>`;
      if(state.status==='active'){const b=document.createElement('button');b.textContent=data.tracked===q.id?'Tracked':'Track objective';b.onclick=()=>{data.tracked=q.id;api.save();journal()};row.append(b)}$('journal-quests').append(row);
    }$('journal-map').onclick=worldMap;$('journal-shelter').onclick=()=>api.getHomestead()?.gathering.menu('quest');
  }
  function worldMap() {
    if(api.getFrontier?.())return api.getFrontier().worldMap();
    const points=[...api.poi,{name:'Hollowroot Cave',x:-46,z:36}];
    const px=x=>(x+95)*2,py=z=>(z+100)*2;
    const labels=points.map((p,i)=>{const known=i===0||api.visited.includes(i)||i===5&&data.caveDiscovered;return `<g><circle cx="${px(p.x)}" cy="${py(p.z)}" r="5" fill="${known?'#edca80':'#879785'}"/><text x="${px(p.x)+8}" y="${py(p.z)-7}" fill="${known?'#f4e3b6':'#a7b19c'}">${known?(i===0?'Wanderer’s Village':p.name):'Undiscovered'}</text></g>`}).join('');
    const river=Array.from({length:39},(_,i)=>{const x=-95+i*5;return px(x)+','+py(9+Math.sin(x*.052)*7)}).join(' ');
    const p=hero.root.position,cave=p.x>200;
    api.modal('The Emerald Wilds',`<div class="eyebrow">North ↑ · ${cave?'You are in Hollowroot Cave':'Your discoveries'}</div><svg class="world-map" viewBox="0 0 440 420" role="img" aria-label="Map of the forest, village, river, ruins and cave"><rect width="440" height="420" rx="12" fill="#273f34"/><polyline points="${river}" stroke="#72b9bb" stroke-width="9" fill="none"/><polyline points="${[[0,64],[-23,36],[-14,18],[-14,-4],[28,-23],[11,-43],[-8,-66]].map(([x,z])=>px(x)+','+py(z)).join(' ')}" stroke="#b6a477" stroke-width="3" fill="none"/>${labels}<circle cx="${px(cave?-46:p.x)}" cy="${py(cave?36:p.z)}" r="5" fill="#fff" stroke="#e9c579" stroke-width="2"/></svg><p class="map-note">White: you · Gold: discovered · Grey: uncharted. Follow the trail north; the cave branches west from Whispering Forest.</p><button id="map-journal">Quest journal</button>`,'map');$('map-journal').onclick=journal;
  }
  function onKill(e,spawnLoot=true) {
    if(e.family){if(e.isBoss){if(!data.frontierBosses.includes(e.family))data.frontierBosses.push(e.family)}else if(api.eligibleKill?.(e)!==false){const q=data.quests['hunt_'+e.family];if(q?.status==='active')q.count=Math.min(4,q.count+1)}}
    if(api.eligibleKill?.(e)!==false&&e.type===0&&data.quests.scouts.status==='active')data.quests.scouts.count=Math.min(5,data.quests.scouts.count+1);
    // A tooth is real loot; collecting or turning it in still requires interaction.
    if(spawnLoot&&e.type!==3&&!e.family)api.drop('tooth',e.root.position.x-.4,e.root.position.z+.4);
  }
  function updateQuestHUD() {
    if(!data.quests)return;let q=questDefinitions.find(q=>q.id===data.tracked&&data.quests[q.id].status==='active');
    q??=questDefinitions.find(q=>data.quests[q.id].status==='active');
    if(data.area==='cave')$('location').textContent='Hollowroot Cave';if(!q){marker.style.display='none';beacon.visible=false;return}
    $('objective').textContent=q.name+' · '+progress(q)+' / '+q.goal;
    let target=q.target;const complete=progress(q)>=q.goal;
    if(complete){const n=npcs.find(n=>n.id===q.giver);target=[n.root.position.x,n.root.position.z]}else if(q.id==='trail'&&api.visited.includes(2))target=[-8,-66];
    if(hero.root.position.x>200){beacon.visible=false;marker.textContent=complete?'◆ Return to the village':'◆ Explore Hollowroot · find the gate key';marker.style.display='block';return}
    const dx=target[0]-hero.root.position.x,dz=target[1]-hero.root.position.z;beacon.visible=Math.hypot(dx,dz)<55;beacon.position.set(target[0],ground(...target)+2.7,target[1]);beacon.rotation.y+=.08;
    marker.textContent='◆ '+(complete?'Return to '+npcs.find(n=>n.id===q.giver).name:q.name)+' · '+Math.round(Math.hypot(dx,dz))+'m';marker.style.display='block';
  }
  // A separate coordinate region shares the same renderer, hero, inventory and AI.
  const cave=new THREE.Group();scene.add(cave);cave.visible=false;
  const rooms=[[296,304,-34,8],[300,316,-24,-14],[288,312,-62,-32]];
  const inFloor=(x,z)=>rooms.some(([l,r,t,b])=>x>=l&&x<=r&&z>=t&&z<=b);
  function caveBlocked(x,z,r=.4) {
    r+=.8; // Keep bodies outside the faceted wall silhouettes.
    if(![[x-r,z-r],[x+r,z-r],[x-r,z+r],[x+r,z+r]].every(([x,z])=>inFloor(x,z)))return true;
    if(!data.gateOpen&&Math.abs(z+31)<.4+r)return true;
    return x+r>306&&z+r>-53&&z-r<-43;
  }
  const floorMatrices=[],rockMatrices=[],dummy=new THREE.Object3D();
  for(let x=287;x<318;x+=2)for(let z=-63;z<10;z+=2)if(inFloor(x,z)){
    dummy.position.set(x,-.2,z);dummy.scale.set(2,.4,2);dummy.rotation.set(0,0,0);dummy.updateMatrix();floorMatrices.push(dummy.matrix.clone());
    for(const [dx,dz] of [[2,0],[-2,0],[0,2],[0,-2]])if(!inFloor(x+dx,z+dz)){
      dummy.position.set(x+dx*.55,2.8,z+dz*.55);dummy.scale.set(dx?1.4:1.7,3.5,dx?1.7:1.4);dummy.rotation.set(0,Math.sin(x*z)*.3,0);dummy.updateMatrix();rockMatrices.push(dummy.matrix.clone());
    }
  }
  const caveFloor=new THREE.InstancedMesh(api.geo.box,mat(0x465653),floorMatrices.length);floorMatrices.forEach((m,i)=>caveFloor.setMatrixAt(i,m));cave.add(caveFloor);
  const caveRocks=new THREE.InstancedMesh(api.geo.orb,mat(0x46535a),rockMatrices.length);rockMatrices.forEach((m,i)=>caveRocks.setMatrixAt(i,m));cave.add(caveRocks);
  mesh('box',mat(0x25353c,{side:THREE.DoubleSide}),302,8,-27,36,.3,76,cave);
  const pool=mesh('box',mat(0x297f98,{emissive:0x103e58,emissiveIntensity:.4,transparent:true,opacity:.86,metalness:.3,roughness:.25}),309,.08,-48,6,.12,10,cave);
  const torchPositions=[],torchFlames=[];
  for(const [x,z] of [[296.7,3],[303.3,-9],[296.7,-23],[314.8,-20],[289.2,-38],[310.7,-57],[298.5,-56]]){
    mesh('cyl',0x745333,x,1.6,z,.09,1,.09,cave);
    const flame=mesh('cone',mat(0xffc379,{emissive:0xff8c2d,emissiveIntensity:1.7}),x,2.2,z,.22,.7,.22,cave);
    torchPositions.push(new THREE.Vector3(x,2.3,z));torchFlames.push(flame);
  }
  const caveLights=Array.from({length:3},()=>{const l=new THREE.PointLight(0xffb775,10,18,1.6);l.visible=false;scene.add(l);return l});
  for(let i=0;i<28;i++){
    const x=i%2?289+Math.sin(i)*.6:311+Math.sin(i)*.4,z=-35-(i%14)*1.8;
    const crystal=mesh('cone',mat(i%3?0x68c6bf:0x9878db,{emissive:i%3?0x246b70:0x462e78,emissiveIntensity:.9}),x,.8,z,.35,1.4+(i%3)*.4,.35,cave);crystal.rotation.z=Math.sin(i)*.4;
  }
  for(const x of [297,303])for(const z of [-4,-16,-28]){
    mesh('box',0x756047,x,2,z,.22,4,.24,cave);mesh('box',0x756047,300,4,z,6.4,.22,.25,cave);
  }
  for(const x of [309,314])mesh('box',0x786449,x,1.5,-18,.2,3,.2,cave);
  mesh('box',0x8f7855,311.5,2.7,-18,5.5,.16,2,cave);
  for(let y=.3;y<2.7;y+=.4)mesh('box',0x997f5a,308.7,y,-17.4,.7,.09,.09,cave);
  const gate=new THREE.Group();gate.position.set(300,0,-31);cave.add(gate);
  for(let x=-3.8;x<4;x+=.7)mesh('box',0x7f9287,x,1.6,0,.13,3.2,.16,gate);
  mesh('box',0x8e7d51,0,1.4,.13,.45,.55,.12,gate);
  const dungeonChests=[];
  function caveChest(x,z,key){const g=new THREE.Group();g.position.set(x,.5,z);cave.add(g);mesh('box',0x88603d,0,0,0,1.2,.8,.85,g);mesh('box',0xd3bc72,0,.05,.44,.2,.4,.05,g);dungeonChests.push({x,z,key,g})}
  caveChest(313,-21,'keyChest');caveChest(290,-59,'hiddenChest');
  const entranceY=ground(-46,35);obstacle(-49,35,1.8);obstacle(-43,35,1.8);obstacle(-46,33,1.4);
  for(const x of [-49,-43])mesh('orb',0x687773,x,entranceY+2,35,2.3,3,2);
  mesh('orb',0x748279,-46,entranceY+4.2,35,4,1.6,2.2);
  mesh('box',0x152b2c,-46,entranceY+1.6,34.5,3.6,3.2,.12);
  const outsideRoots=scene.children.filter(o=>o!==cave&&!caveLights.includes(o)&&o!==hero.root&&!api.enemies.some(e=>e.root===o)&&!o.isLight&&o!==api.sun.target);
  const cavePatrols=[[300,-8,0],[301,-20,1],[309,-19,0],[298,-37,1]].map(p=>api.spawnEnemy(...p));cavePatrols.forEach(e=>e.cave=true);
  const guardian=api.spawnEnemy(299,-51,3);Object.assign(guardian,{guardian:true,cave:true,name:'Varg',hp:260,maxHp:260,xp:110,dmg:22,speed:2});guardian.bodyMat.color.setHex(0x566e80);guardian.bladeMat.color.setHex(0x72c1c0);guardian.label.firstChild.textContent='Varg · Guardian';
  const tell=new THREE.Mesh(new THREE.RingGeometry(.95,1,48),mat(0xf0b560,{emissive:0xe87d30,emissiveIntensity:.8,side:THREE.DoubleSide,transparent:true,opacity:.7}));tell.rotation.x=-Math.PI/2;tell.visible=false;scene.add(tell);
  function setArea(area) {
    data.area=area;const inside=area==='cave';cave.visible=inside;outsideRoots.forEach(o=>o.visible=!inside);
    npcs.forEach(n=>n.root.visible=!inside);caveLights.forEach(l=>l.visible=inside);
    scene.background.setHex(inside?0x172730:0x9dbab0);scene.fog.color.copy(scene.background);scene.fog.density=inside?.027:api.settings.quality==='low'?.0095:.0075;
    api.sun.intensity=inside?.55:2.7;api.sun.castShadow=!inside;
    scene.children.filter(o=>o.isHemisphereLight).forEach(l=>l.intensity=inside?1.4:1.55);
    for(const e of api.enemies){e.label.style.display='none';e.root.visible=e.hp>0&&!!e.cave===inside}
    tell.visible=false;
  }
  function enterCave() {
    if(api.state!=='playing'||Math.hypot(hero.root.position.x+46,hero.root.position.z-38)>4)return false;
    data.caveDiscovered=true;setArea('cave');api.setPosition(300,0);api.accountEvent?.('travel');api.clearAction();api.save();api.toast('Discovered · Hollowroot Cave');return true;
  }
  function exitCave() {
    if(Math.hypot(hero.root.position.x-300,hero.root.position.z-5)>3.5)return false;
    setArea('world');api.setPosition(-46,39);api.accountEvent?.('travel');api.clearAction();api.save();api.toast('The forest air welcomes you back.');return true;
  }
  function returnToVillage(){setArea('world');api.setPosition(0,64);api.clearAction()}
  function caveInteract() {
    if(data.area!=='cave'){if(Math.hypot(hero.root.position.x+46,hero.root.position.z-38)<3)return enterCave();return false}
    if(Math.hypot(hero.root.position.x-300,hero.root.position.z-5)<3)return exitCave();
    if(!data.gateOpen&&Math.abs(hero.root.position.z+31)<3&&Math.abs(hero.root.position.x-300)<4){
      if(!quantity('cavekey')){api.toast('A key lies in the eastern scaffold chamber.');return true}
      api.accountStructure?.('hollow:gate');removeItem('cavekey',1);data.gateOpen=true;gate.visible=false;api.sound('loot');api.save();api.toast('The iron gate opens.');return true;
    }
    const c=dungeonChests.find(c=>!data[c.key]&&Math.hypot(hero.root.position.x-c.x,hero.root.position.z-c.z)<2.6);
    if(c){if(api.enemies.some(e=>e.hp>0&&e.root.position.distanceTo(hero.root.position)<7)){api.toast('Defeat the nearby guards first.');return true}
      api.accountStructure?.('hollow:'+c.key);data[c.key]=true;c.g.rotation.z=.16;
      if(c.key==='keyChest')api.drop('cavekey',c.x-.7,c.z);else{api.drop('gem',c.x+.4,c.z,2);api.drop('coin',c.x-.4,c.z,55)}api.save();return true;
    }return false;
  }
  function caveHint(){const p=hero.root.position;if(data.area!=='cave')return Math.hypot(p.x+46,p.z-38)<3?'Enter Hollowroot Cave':null;
    if(Math.hypot(p.x-300,p.z-5)<3)return 'Return to Whispering Forest';
    if(!data.gateOpen&&Math.abs(p.z+31)<3)return quantity('cavekey')?'Unlock the iron gate':'Gate locked · find the key';
    if(dungeonChests.some(c=>!data[c.key]&&Math.hypot(p.x-c.x,p.z-c.z)<2.6))return 'Open cave chest';return null;
  }
  function guardianDefeated(e) {
    if(data.guardianDead)return;data.guardianDead=true;tell.visible=false;
    api.drop('caveblade',e.root.position.x+.7,e.root.position.z);api.drop('relic',e.root.position.x-.7,e.root.position.z);api.drop('coin',e.root.position.x,e.root.position.z+1,65);
    api.sound('victory');api.toast('Varg has fallen • recover the ancient relic');
  }
  function guardianAttack(e,dt,target=hero) {
    const a=e.attack;a.t+=dt;const phase=a.t/a.duration,pattern=e.pattern%3;
    if(!a.aim)a.aim=target.root.position.clone().sub(e.root.position).setY(0).normalize();
    api.face(e,Math.atan2(a.aim.x,a.aim.z),dt*2);api.animate(e,0,dt,a);
    guardianTell(e);
    if(pattern===1&&phase>.5&&phase<.75){const distance=target.root.position.distanceTo(e.root.position),step=Math.min(dt*8,Math.max(0,distance-.8));api.move(e,a.aim.x*step,a.aim.z*step)}
    if(phase>.67&&!e.hit){e.hit=true;const d=target.root.position.clone().sub(e.root.position),range=pattern===2?4.3:pattern===0?3.6:2.6;
      if(d.length()<range&&(pattern===2||d.normalize().dot(a.aim)>-.2))api.hurtPlayer(e.dmg*(pattern===2?1.3:1),e.root.position,target.netId);
      api.burst(e.root.position,0xdbb778,pattern===2?22:8);api.sound('heavy');
    }
    if(phase>=1){e.state='chase';e.cooldown=1.3;tell.visible=false}
  }
  function guardianTell(e){const phase=e.attack?e.attack.t/e.attack.duration:1,pattern=e.pattern%3;tell.visible=data.area==='cave'&&e.hp>0&&e.state==='attack'&&phase<.7;tell.position.copy(e.root.position);tell.position.y=.06;tell.scale.setScalar(pattern===2?4.3:pattern===0?3.6:2.4);tell.material.opacity=.25+Math.min(1,phase)*.6}
  function caveUpdate(time) {
    gate.visible=!data.gateOpen;dungeonChests.forEach(c=>c.g.rotation.z=data[c.key]?.16:0);
    if(data.area!=='cave'||hero.root.position.x>350){tell.visible=false;caveLights.forEach(l=>l.visible=false);return}caveLights.forEach(l=>l.visible=true);
    const nearest=[...torchPositions].sort((a,b)=>a.distanceToSquared(hero.root.position)-b.distanceToSquared(hero.root.position));
    caveLights.forEach((l,i)=>{l.position.copy(nearest[i]);l.intensity=9+Math.sin(time*7+i)});
    torchFlames.forEach((f,i)=>f.scale.y=.65+Math.sin(time*8+i)*.12);pool.position.y=.08+Math.sin(time*1.5)*.015;
    if(guardian.state!=='attack'||guardian.hp<=0)tell.visible=false;
  }
  function afterStart(){setArea(data.area==='cave'?'cave':'world');if(data.guardianDead){guardian.hp=0;guardian.dead=4;guardian.state='death';guardian.root.visible=false}}
  function interact() {if(caveInteract())return true;const n=nearestNPC();if(n){dialogue(n);return true}if(Math.hypot(hero.root.position.x-24,hero.root.position.z+29)<2.7&&!data.suppliesRecovered){if(api.enemies.some(e=>e.hp>0&&Math.hypot(e.root.position.x-24,e.root.position.z+29)<10)){api.toast('Clear the camp before recovering its supplies.');return true}api.accountStructure?.('supplies');api.accountEvent?.('pickup',{structure:'supplies',id:'supplies'});data.suppliesRecovered=true;api.addItem('supplies');api.save();api.toast('Recovered the village supplies');return true}if(Math.hypot(hero.root.position.x-board.x,hero.root.position.z-board.z)<3){journal();return true}return false}
  function hint(){const c=caveHint();if(c)return c;if(!data.suppliesRecovered&&Math.hypot(hero.root.position.x-24,hero.root.position.z+29)<2.7)return 'Recover village supplies';const n=nearestNPC();return n?'Talk to '+n.name:Math.hypot(hero.root.position.x-board.x,hero.root.position.z-board.z)<3?'Read village noticeboard':null}
  function update(dt,time) {
    caveUpdate(time);supplyCrate.visible=data.area!=='cave'&&!data.suppliesRecovered;forge.scale.y=.8+Math.sin(time*9)*.15;lanterns.forEach((m,i)=>m.material.emissiveIntensity=.85+Math.sin(time*3+i)*.15);
    for(const n of npcs){if(n.civic){n.root.visible=data.area!=='cave'&&n.root.position.distanceTo(hero.root.position)<65;if(!n.root.visible){n.label.style.display='none';continue}}if(data.area!=='cave'&&api.state!=='title'&&n.root.position.distanceTo(hero.root.position)<17)api.project(n.root.position.clone().add(new THREE.Vector3(0,2.7,0)),n.label);else n.label.style.display='none';const near=n.root.position.distanceTo(hero.root.position)<4;let speed=n.walkSpeed||0;
      if(n.id==='merchant'&&!near){const x=n.x+Math.sin(time*.22)*1.2;speed=Math.abs(x-n.root.position.x)/Math.max(dt,.001);n.root.position.x=x;}
      api.animate(n,speed,dt);if(near)api.face(n,Math.atan2(hero.root.position.x-n.root.position.x,hero.root.position.z-n.root.position.z),dt);
      if(n.id==='smith'&&!near){n.arms[1].rotation.x=-.6-Math.max(0,Math.sin(time*3))*.9;}
    }
  }
  function restore(saved) {
    const old=saved?.living||{};data={...old,quests:{},tracked:typeof old.tracked==='string'?old.tracked:'',suppliesRecovered:!!old.suppliesRecovered};
    for(const q of questDefinitions){const p=old.quests?.[q.id];data.quests[q.id]={status:['available','active','claimed'].includes(p?.status)?p.status:'available',count:Number.isFinite(p?.count)?Math.max(0,Math.min(q.goal,p.count)):0}}
    data.frontierBosses=Array.isArray(old.frontierBosses)?[...new Set(old.frontierBosses.filter(id=>questDefinitions.some(q=>q.bossFamily===id)))]:[];
    vendor=null;data.area=old.area==='cave'?'cave':'world';data.guardianDead=old.guardianDead===true;data.gateOpen=old.gateOpen===true;data.keyChest=old.keyChest===true;data.hiddenChest=old.hiddenChest===true;
  }
  restore(null);
  function serialize(){return data}
  return {setArea,registerNPC:npc,enterCave,exitCave,returnToVillage,caveBlocked,afterStart,guardian,guardianDefeated,guardianAttack,guardianTell,cavePatrols,interact,hint,update,restore,serialize,onKill,updateQuestHUD,journal,worldMap,acceptQuest,claimQuest,questDialogue,questDefinitions,progress,purchase,sell,upgrade,upgradeCost,shop,dialogue,npcs,buildings,quantity};
}
