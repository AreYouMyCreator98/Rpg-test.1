// Realm of the Fallen V2. Local ES module; no build or new external assets.
export function migrateSave(data) {
  if (!data || ![1, 2].includes(data.version)) return null;
  const living = data.version === 2 && data.living && typeof data.living === 'object' ? data.living : {};
  return {...data, version: 2, living};
}

export function installLivingWorld(api) {
  const {THREE, scene, mesh, mat, hero, items, ground, character, obstacle, $} = api;
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
    obstacle(x,z,3.25); buildings.push({x,z,label});
  }
  building(-12,65,0x805b48,'Ember & Iron'); building(12,72,0x466764,'The Wayfarer Tavern');
  building(-13,80,0x647656,'Weaver’s Cottage'); building(12,85,0x976a4d,'Village Storehouse');
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
  const stallY=ground(8,57);mesh('box',0x8c6949,8,stallY+.8,57,3,1,.8,village);
  for(const s of [-1,1]) mesh('cyl',0x695037,8+s*1.6,stallY+1.6,57,.09,3.2,.09,village);
  for(let i=0;i<6;i++) mesh('box',i%2?0xe5cd94:0x547970,6.5+i*.6,stallY+3.1,57,.6,.12,2.2,village);
  for(let i=0;i<5;i++) mesh('orb',0xc99058,7+i*.4,stallY+1.4,57,.17,.2,.17,village);
  const board={x:1,z:72};mesh('box',0x73553b,1,ground(1,72)+1.8,72,2.8,1.6,.18,village);
  for(const x of [-.1,2.1]) mesh('box',0x695139,x,ground(x,72)+1,72,.13,2.5,.15,village);
  for(let i=0;i<3;i++)mesh('box',0xdfd0a0,.2+i*.75,ground(1,72)+1.8,72.12,.55,.8,.025,village);
  function npc(id,name,role,x,z,color) {
    const ch=character();ch.root.position.set(x,ground(x,z),z);ch.weapon.visible=false;ch.bodyMat.color.setHex(color);
    const n={...ch,id,name,role,x,z,color};npcs.push(n);return n;
  }
  const smith=npc('smith','Bram','Blacksmith',-7,58,0x87583c);
  mesh('box',0x6b7370,0,-.65,.35,.4,.25,.2,smith.arms[1]);
  npc('merchant','Mira','Merchant',8,54,0x657392);
  npc('elder','Elowen','Village Keeper',-1,70,0x79805b);
  const prices={w1:30,w2:85,w3:170,w4:290,a1:25,a2:70,a3:140,a4:250,potion:12};
  const sellPrice=id=>id==='tooth'?4:id==='gem'?32:Math.max(2,Math.floor((prices[items[id]?.base||id]||10)*.4)+(items[id]?.upgrade||0)*10);
  function nearestNPC(){return npcs.find(n=>n.root.position.distanceTo(hero.root.position)<3.1)}
  function canTrade(role) {return api.state==='playing' && api.panel==='shop' && vendor?.id===role && nearestNPC()===vendor;}
  function purchase(id) {
    if(!vendor||!canTrade(vendor.id))return false;
    const allowed=vendor.id==='smith'?['w1','w2','w3','w4']:['potion','a1','a2','a3','a4'];
    if(!allowed.includes(id)||api.player.coins<prices[id]||(items[id].type!=='consumable'&&quantity(id)))return false;
    api.player.coins-=prices[id];api.addItem(id);api.save();api.sound('coin');api.toast('Purchased '+items[id].name);return true;
  }
  function sell(id) {
    if(!canTrade('merchant')||!quantity(id)||['quest'].includes(items[id]?.type)||[api.player.weapon,api.player.armour].includes(id))return false;
    if(!removeItem(id,1))return false;api.player.coins+=sellPrice(id);api.save();api.sound('coin');return true;
  }
  function upgradeCost(id) {const rank=items[id]?.upgrade||0;return{coins:35+rank*40,tooth:2+rank*2,gem:rank>=1?1:0};}
  function upgrade(id) {
    const item=items[id],cost=upgradeCost(id);
    if(!canTrade('smith')||item?.type!=='weapon'||item.upgrade>=3||!quantity(id)||api.player.coins<cost.coins||quantity('tooth')<cost.tooth||quantity('gem')<cost.gem)return false;
    // Validate everything before the synchronous debit. One copy in, one copy out.
    api.player.coins-=cost.coins;removeItem('tooth',cost.tooth);if(cost.gem)removeItem('gem',cost.gem);removeItem(id,1);
    const next=item.base+'~'+(item.upgrade+1);api.addItem(next);if(api.player.weapon===id)api.player.weapon=next;
    api.equipVisual();api.save();api.sound('level');api.toast('Tempered '+items[next].name);return true;
  }
  function portrait(n){return `<svg class="portrait" viewBox="0 0 80 90" aria-hidden="true"><path fill="#${n.color.toString(16)}" d="M7 90V62L25 50H55L73 62V90Z"/><path fill="#d4a676" d="M23 18L40 10L57 18V43L48 56H31L23 43Z"/><path fill="#67503a" d="M20 27V16L38 5L59 16V27L42 19Z"/><path fill="#273f32" d="M29 30H34V35H29ZM46 30H51V35H46Z"/><path stroke="#7d543b" d="M34 45H46"/></svg>`}
  function dialogue(n) {
    vendor=n;api.modal(n.name+' · '+n.role,`<div class="dialogue-intro">${portrait(n)}<p>${n.id==='smith'?'A good blade grows with its bearer. Bring me coins, goblin teeth, and moonstones; I will temper your steel.':n.id==='merchant'?'Welcome home, traveller. I trade armour and healing draughts, and pay fairly for trophies from the wilds.':'Our village needs you. The forest grows restless, and something ancient stirs beneath the hills.'}</p></div><div class="menu-buttons">${n.id!=='elder'?'<button id="open-shop" class="primary">'+(n.id==='smith'?'Browse swords & upgrades':'Buy & sell goods')+'</button>':''}<button id="npc-quests">Ask about village work</button><button id="npc-leave">Farewell</button></div>`,'dialogue');
    if($('open-shop'))$('open-shop').onclick=()=>shop(n);
    $('npc-quests').onclick=()=>questDialogue(n);$('npc-leave').onclick=api.closeModal;
  }
  function shop(n) {
    vendor=n;const stock=n.id==='smith'?['w1','w2','w3','w4']:['potion','a1','a2','a3','a4'];
    api.modal(n.name+'’s '+(n.id==='smith'?'forge':'market'),`<div class="shop-wallet">${api.player.coins} coins · ${quantity('tooth')} teeth · ${quantity('gem')} moonstones</div><div id="shop-rows"></div><button id="shop-back">Back to conversation</button>`,'shop');
    const rows=$('shop-rows');
    function row(text,label,action,disabled=false){const el=document.createElement('div');el.className='shop-row';const span=document.createElement('span');span.textContent=text;const button=document.createElement('button');button.textContent=label;button.disabled=disabled;button.onclick=()=>{action();shop(n)};el.append(span,button);rows.append(el)}
    for(const id of stock){const it=items[id],owned=quantity(id);row(it.name+' · '+(it.damage?it.damage+' damage':it.defence!==undefined?it.defence+' defence':'65 healing'),owned&&it.type!=='consumable'?'Owned':'Buy · '+prices[id],()=>purchase(id),api.player.coins<prices[id]||!!(owned&&it.type!=='consumable'));}
    for(const entry of [...api.player.inventory]) {
      const it=items[entry.id],equipped=[api.player.weapon,api.player.armour].includes(entry.id);
      if(n.id==='smith'&&it.type==='weapon'&&it.upgrade<3){const c=upgradeCost(entry.id);row(it.name+': '+it.damage+' → '+(it.damage+4)+' damage · '+c.coins+' coins, '+c.tooth+' teeth'+(c.gem?', 1 moonstone':''),'Temper +'+(it.upgrade+1),()=>upgrade(entry.id),api.player.coins<c.coins||quantity('tooth')<c.tooth||quantity('gem')<c.gem)}
      if(['weapon','armour'].includes(it.type))row(it.name+' ×'+entry.qty,equipped?'Equipped':'Equip',()=>{api.player[it.type]=entry.id;api.equipVisual();api.save()},equipped);
      if(n.id==='merchant'&&it.type!=='quest')row(it.name+' ×'+entry.qty,equipped?'Unequip to sell':'Sell one · '+sellPrice(entry.id),()=>sell(entry.id),equipped);
    }
    $('shop-back').onclick=()=>dialogue(n);
  }
  function questDialogue(n) {api.modal('Village work','<p>The village keeper can guide your next journey.</p><button id="work-back">Back</button>','dialogue');$('work-back').onclick=()=>dialogue(n)}
  function interact() {const n=nearestNPC();if(n){dialogue(n);return true}if(Math.hypot(hero.root.position.x-board.x,hero.root.position.z-board.z)<3){questDialogue(npcs[2]);return true}return false}
  function hint(){const n=nearestNPC();return n?'Talk to '+n.name:Math.hypot(hero.root.position.x-board.x,hero.root.position.z-board.z)<3?'Read village noticeboard':null}
  function update(dt,time) {
    forge.scale.y=.8+Math.sin(time*9)*.15;lanterns.forEach((m,i)=>m.material.emissiveIntensity=.85+Math.sin(time*3+i)*.15);
    for(const n of npcs){const near=n.root.position.distanceTo(hero.root.position)<4;let speed=0;
      if(n.id==='merchant'&&!near){const x=n.x+Math.sin(time*.22)*1.2;speed=Math.abs(x-n.root.position.x)/Math.max(dt,.001);n.root.position.x=x;}
      api.animate(n,speed,dt);if(near)api.face(n,Math.atan2(hero.root.position.x-n.root.position.x,hero.root.position.z-n.root.position.z),dt);
      if(n.id==='smith'&&!near){n.arms[1].rotation.x=-.6-Math.max(0,Math.sin(time*3))*.9;}
    }
  }
  function restore(saved) {data=saved?.living||{};vendor=null;}
  function serialize(){return data}
  return {interact,hint,update,restore,serialize,purchase,sell,upgrade,upgradeCost,shop,dialogue,npcs,buildings,quantity};
}
