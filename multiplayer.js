import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from './multiplayer-config.js?v=realm-scout-20261010-1';
import {connectSupabase} from './supabase-rooms.js?v=realm-scout-20261010-1';

export function installMultiplayer(api) {
  const {$,THREE,hero,enemies,loot,items,living}=api;
  let transport=null,active=false,host=false,id='',code='',isPublic=false,roster=[],busy=false,applying=false,sequence=0,clock=0,poseTime=0,snapshotTime=0,lastSnapshot=0;
  let connectedAccount=null;const peers=new Map(),seen=new Map();let request=0;
  const shieldGeometry=new THREE.CylinderGeometry(.36,.36,.09,8),shieldMaterial=new THREE.MeshStandardMaterial({color:0x786245,flatShading:true});
  const button=document.createElement('button');button.id='multiplayer';button.textContent='Play together';$('title').querySelector('.buttons').append(button);button.onclick=lobby;
  const party=document.createElement('button');party.id='party-button';party.textContent='Party';party.hidden=true;document.body.append(party);party.onclick=lobby;
  function send(m){transport?.send(m)}
  function event(data,to){if(to===id||!to)applyEvent(data);if(host)send({type:'event',data,to})}
  function command(data){if(host)handleCommand(id,{...data,request:++request});else{sendPose();send({type:'command',data:{...data,request:++request}})}}
  function credentials(){let local={};try{local=JSON.parse(localStorage.getItem('realm-supabase')||'{}')}catch{}return {url:local.url||SUPABASE_URL||'',key:local.key||SUPABASE_PUBLISHABLE_KEY||''}}
  async function connect(){
    if(transport&&connectedAccount!==(api.getAccounts()?.selected?.id||null)){await transport.close();transport=null}if(transport)return true;if(busy)return false;const {url,key}=credentials();if(!url||!key){status('Configure your Supabase project below to connect.');return false}
    busy=true;status('Connecting to Supabase…');
    try{transport=await connectSupabase(url,key,m=>{Promise.resolve(receive(m)).catch(e=>{status(e.message);if(active)void leave('Could not load your adventurer: '+e.message)})},api.getAccounts()?.active?api.getAccounts():null);connectedAccount=api.getAccounts()?.selected?.id||null;status('Connected. Choose a room.');send({type:'list'});return true}catch(e){status(e.message+' Enable Anonymous Sign-ins and apply supabase/multiplayer.sql.');return false}finally{busy=false}
  }
  function status(text){const el=$('room-status');if(el)el.textContent=text;else api.toast(text)}
  function lobby(){
    if(active){
      api.modal('Your adventuring party','<div class="eyebrow" id="room-kind"></div><p class="room-note">Invite code</p><div class="invite-code" id="invite-code"></div><button id="copy-invite">Copy code</button><div id="party-list"></div><p class="room-note">Account adventurers retain their own progression. Guest adventurers last for this session. Solo worlds stay separate. The host must keep this tab open. Menus do not pause the world.</p><button id="leave-room">Leave room & return to solo</button>','party');
      $('room-kind').textContent=(isPublic?'Public world':'Private room')+(host?' · You are hosting':'');$('invite-code').textContent=code;renderRoster();
      $('copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText(code);api.toast('Invite code copied')}catch{api.toast('Select the invite code above to copy it.')}};
      $('leave-room').onclick=()=>leave('Left the party. Your solo journey is restored.');return;
    }
    const c=credentials();api.modal('Gather your party',`<p class="room-note">Explore together with up to four players. Choose an account adventurer for persistent co-op, or use a fresh guest character. Persistent rooms require an account adventurer for every player. Room progress lasts until the host leaves. No friendly fire.</p><button id="choose-adventurer">Choose your adventurer</button><p id="selected-adventurer"></p><label for="room-name">Adventurer name</label><input id="room-name" class="room-input" maxlength="24" placeholder="Wanderer" autocomplete="off"><div class="menu-buttons"><button class="primary" id="create-private">Create private room</button><button id="create-public">Create public world</button></div><label for="join-code">Invite code</label><input id="join-code" class="room-input" maxlength="16" placeholder="Enter a friend's code" autocomplete="off"><button id="join-room">Join with code</button><h3>Public worlds</h3><button id="refresh-rooms">Refresh worlds</button><div id="room-list"></div><p id="room-status" role="status" class="room-note"></p><details><summary>Supabase connection</summary><p class="room-note">Project URL and browser-safe publishable / anon key only. Never enter a secret or service-role key. Enable Anonymous Sign-ins and install the room SQL in your project.</p><label for="supabase-url">Project URL</label><input id="supabase-url" class="room-input" placeholder="https://your-project.supabase.co"><label for="supabase-key">Publishable / anon key</label><input id="supabase-key" class="room-input" autocomplete="off"><button id="save-connection">Save connection</button></details>`,'multiplayer');
    $('choose-adventurer').onclick=()=>api.getAccounts()?.menu();$('selected-adventurer').textContent=api.getAccounts()?.selected?.name||'Guest adventurer · session only';$('supabase-url').value=c.url;$('supabase-key').value=c.key;
    try{$('room-name').value=localStorage.getItem('realm-player-name')||''}catch{}
    const name=()=>{const n=$('room-name').value.trim().slice(0,24)||'Wanderer';try{localStorage.setItem('realm-player-name',n)}catch{}return n};
    async function enter(type,pub=false,invite=''){const n=name();if(api.getAccounts()?.active)await api.getAccounts().settle();if(await connect()){status('Preparing your room…');send({type,name:n,public:pub,code:invite})}}
    $('create-private').onclick=()=>enter('create');$('create-public').onclick=()=>enter('create',true);$('join-room').onclick=()=>enter('join',false,$('join-code').value.trim().toUpperCase());
    $('refresh-rooms').onclick=async()=>{if(await connect())send({type:'list'})};
    $('save-connection').onclick=async()=>{
      const url=$('supabase-url').value.trim(),key=$('supabase-key').value.trim();
      try{const parsed=new URL(url);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw Error();if(!key||key.startsWith('sb_secret_'))throw Error();if(key.startsWith('ey')){const claims=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(claims.role!=='anon')throw Error()}}catch{status('Use an HTTPS project URL and a publishable or anon key, never a privileged key.');return}
      try{localStorage.setItem('realm-supabase',JSON.stringify({url,key}))}catch{status('Browser storage is unavailable. Configure multiplayer-config.js instead.');return}
      await transport?.close();transport=null;await connect();
    };
    status(c.url&&c.key?'Connect or refresh to find worlds.':'Solo is ready. Online rooms need your Supabase project connection.');
  }
  function renderRoster(){const el=$('party-list');if(el){el.replaceChildren();for(const p of roster){const row=document.createElement('p');row.textContent=p.name+(p.id===id?' · you':'')+(p.id===roster.host?' · host':'');el.append(row)}}party.textContent=`Party ${roster.length}/4`}
  function removePeer(uid){const p=peers.get(uid);if(!p)return;api.companions?.removeRemote(uid);api.getHomestead()?.gathering.removeRemote(p.ch);api.scene.remove(p.ch.root);p.ch.bodyMat.dispose();p.ch.bladeMat.dispose();p.label.remove();peers.delete(uid)}
  function getPeer(uid){
    if(peers.has(uid))return peers.get(uid);if(peers.size>=3)return null;
    const ch=api.character(),plate=new THREE.Mesh(shieldGeometry,shieldMaterial),label=document.createElement('div');plate.rotation.x=Math.PI/2;plate.position.set(-.08,-.4,.18);ch.arms[0].add(plate);label.className='party-label';$('world-ui').append(label);ch.root.visible=false;
    const p={ch,label,pose:null,last:0,attack:null,lastAttack:-10};ch.netId=uid;peers.set(uid,p);return p;
  }
  async function receive(m){
    if(m.type==='hello'){id=m.id;return}
    if(m.type==='error'){status(m.message);return}
    if(m.type==='rooms'){
      const el=$('room-list');if(!el)return;el.replaceChildren();if(!m.rooms.length)el.textContent='No open worlds yet. Create one to invite adventurers.';
      for(const r of m.rooms){const row=document.createElement('div');row.className='room-row';const name=document.createElement('span');name.textContent=r.name+` · ${r.count}/4`;const b=document.createElement('button');b.textContent='Join';b.onclick=()=>send({type:'join',code:r.code,name:$('room-name')?.value.trim()||'Wanderer'});row.append(name,b);el.append(row)}return;
    }
    if(m.type==='joined'){
      active=true;host=m.host===m.id;id=m.id;code=m.code;isPublic=m.public;sequence=0;seen.clear();request=0;lastSnapshot=clock;
      if(api.getAccounts()?.active)await api.getAccounts().join(m.worldId);else api.start(false);party.hidden=false;api.toast(host?'Your world is open. Share its invite code.':'Joined the party. Awaiting the host’s world…');
      if(host)sendSnapshot();else send({type:'command',data:{kind:'sync',request:++request}});return;
    }
    if(m.type==='ended'){leave(m.reason,false);return}
    if(!active)return;
    if(m.type==='roster'){roster=m.players;roster.host=m.host;for(const uid of peers.keys())if(!roster.some(p=>p.id===uid))removePeer(uid);renderRoster();return}
    if(m.type==='left'){removePeer(m.id);return}
    if(m.type==='pose'){
      const d=m.data;if(m.id===id||!d||!['x','y','z','yaw','hp','level'].every(k=>Number.isFinite(d[k]))||(d.x < -350 || d.x > 1150)||Math.abs(d.z)>350||d.level<1||d.level>40||!Number.isInteger(d.level))return;
      api.normaliseProgression(d);const p=getPeer(m.id);if(!p)return;const first=!p.pose;p.pose=d;p.last=clock;if(first)p.ch.root.position.set(d.x,d.y,d.z);return;
    }
    if(m.type==='snapshot'&&!host){applySnapshot(m.data);lastSnapshot=clock;return}
    if(m.type==='command'&&host){handleCommand(m.id,m.data);return}
    if(m.type==='event')applyEvent(m.data);
  }
  async function leave(reason,notify=true){
    if(!active)return;active=false;host=false;for(const uid of [...peers.keys()])removePeer(uid);roster=[];seen.clear();party.hidden=true;
    try{if(api.getAccounts()?.active)await api.getAccounts().leave();else api.start(!!api.readSave())}catch(e){status(e.message);if(api.getAccounts()?.active)void api.getAccounts().menu()}finally{if(notify)send({type:'leave'});api.toast(reason)}
  }
  function pose(){const p=hero.root.position;return {x:p.x,y:p.y,z:p.z,yaw:hero.root.rotation.y,hp:api.player.hp,level:api.player.level,attributes:api.player.attributes,skills:api.player.skills,pet:api.player.pet,mount:api.player.mount,mounted:api.companions?.mounted,moving:api.companions?.speed>0.2,weapon:api.player.weapon,armour:api.player.armour,blocking:api.blocking,dodge:api.dodge,away:!!api.panel||api.state!=='playing',gathering:api.getHomestead()?.gathering.animation,attack:api.attack?{t:api.attack.t,duration:api.attack.duration,combo:api.attack.combo,whirlwind:api.attack.whirlwind}:null}}
  function sendPose(){if(active)send({type:'pose',data:pose()})}
  function sendSnapshot(){
    if(!active||!host)return;const data=living.serialize();
    send({type:'snapshot',data:{enemies:enemies.map(e=>({x:e.root.position.x,y:e.root.position.y,z:e.root.position.z,yaw:e.root.rotation.y,hp:e.hp,maxHp:e.maxHp,xp:e.xp,dmg:e.dmg,state:e.state,dead:e.dead,generation:e.accountGeneration||0,recoil:e.recoil,pattern:e.pattern,attack:e.state==='attack'?{t:e.attack.t,duration:e.attack.duration,combo:e.attack.combo,range:e.attack.range,tx:e.attack.tx,tz:e.attack.tz}:null})),loot:loot.map(l=>({uid:l.netId||(l.netId=++sequence),id:l.id,qty:l.qty,x:l.g.position.x,z:l.g.position.z,reward:l.reward})),world:{estates:api.getHomestead()?.serializeNet(),expansion:data.expansion,frontierBosses:data.frontierBosses||[],gateOpen:!!data.gateOpen,keyChest:!!data.keyChest,hiddenChest:!!data.hiddenChest,guardianDead:!!data.guardianDead,sharedKey:!!data.sharedKey},chests:api.chests.map(c=>c.open),bossDead:api.bossDead}});
  }
  function applySnapshot(s){
    if(s&&Array.isArray(s.enemies)&&s.enemies.length!==enemies.length){leave('Your party uses a different game update. Everyone should reload before joining.');return}if(!s||!Array.isArray(s.enemies)||!Array.isArray(s.loot)||s.loot.length>500)return;
    applying=true;try{
      s.enemies.forEach((v,i)=>{if(!v||!['x','y','z','yaw','hp'].every(k=>Number.isFinite(v[k])))return;const e=enemies[i];if(e.hp>v.hp){api.burst(e.root.position,0xc2da78,5);e.recoil=.28;api.sound('hit')}if(Number.isInteger(v.generation)&&v.generation!==(e.accountGeneration||0)){e.accountHits=false;e.accountDamage=0;e.accountGeneration=v.generation}e.hp=v.hp;if(Number.isFinite(v.maxHp)&&v.maxHp>0)e.maxHp=v.maxHp;if(Number.isFinite(v.xp))e.xp=v.xp;if(Number.isFinite(v.dmg))e.dmg=v.dmg;e.state=v.state;e.dead=v.dead||0;e.pattern=v.pattern;e.attack=v.attack;e.netPose=v;e.recoil=Math.max(e.recoil||0,v.recoil||0);});
      const ids=new Set(s.loot.map(l=>l.uid));for(const l of [...loot])if(!ids.has(l.netId))api.removeLoot(l);
      for(const v of s.loot){if(!Number.isSafeInteger(v.uid)||!Number.isFinite(v.x)||!Number.isFinite(v.z)||!Number.isSafeInteger(v.qty)||v.qty<1||v.qty>99999||(!items[v.id]&&v.id!=='coin'))continue;if(!loot.some(l=>l.netId===v.uid)){api.drop(v.id,v.x,v.z,v.qty);loot.at(-1).netId=v.uid;loot.at(-1).reward=v.reward}}
      api.getHomestead()?.receiveNet(s.world?.estates);
      if(s.world?.expansion&&typeof s.world.expansion==='object')living.serialize().expansion={...api.expansion.state(),bosses:structuredClone(s.world.expansion.bosses||[]),dungeons:structuredClone(s.world.expansion.dungeons||{})};
      for(const key of ['gateOpen','keyChest','hiddenChest','guardianDead','sharedKey'])living.serialize()[key]=s.world?.[key]===true;
      living.serialize().frontierBosses=Array.isArray(s.world?.frontierBosses)?s.world.frontierBosses.filter(id=>api.frontier.families.some(f=>f.id===id)):[];
      api.chests.forEach((c,i)=>{c.open=!!s.chests?.[i];c.g.rotation.z=c.open?.1:0});api.setBossDead(s.bossDead===true);
    }finally{applying=false}
  }
  function reward(d){if(api.getAccounts()?.active&&d.id==='relic'&&d.reward&&!enemies[d.reward.target]?.accountHits)return;if(api.getAccounts()?.active&&d.reward)api.getAccounts().event('pickup',{...d.reward,id:d.id});if(d.id==='coin')api.player.coins+=d.qty;else api.addItem(d.id,d.qty);api.sound(d.id==='coin'?'coin':'loot');api.toast(d.id==='coin'?'+'+d.qty+' coins':items[d.id]?.name||d.id)}
  function applyEvent(d){
    if(!active||!d)return;
    if(d.kind==='grant'){if(d.id==='coin'||items[d.id])reward(d)}
    if(d.kind==='hurt'){api.hurtPlayer(d.amount,new THREE.Vector3(d.x,d.y,d.z),null,d.effect)}
    if(d.kind==='kill'&&!host){const e=enemies[d.enemy];if(!e)return;const p=hero.root.position;if(api.getAccounts()?.active?e.accountHits:Math.hypot(p.x-d.x,p.z-d.z)<35){api.awardXP(e.xp);applying=true;try{living.onKill(e,false);api.expansion?.credit(e)}finally{applying=false}api.toast('Party defeated '+e.name)}if(e.guardian)living.serialize().guardianDead=true;if(e.type===3&&!e.guardian)api.setBossDead(true)}
    if(d.kind==='account-structure')api.getAccounts()?.event('structure',{id:d.id});if(d.kind==='account-hit'&&!host){api.getAccounts()?.event('strike',d.hit);const e=enemies[d.hit.target];e.accountDamage=(e.accountDamage||0)+d.hit.damage;e.accountHits=e.accountDamage>=Math.min(e.maxHp*.05,15)}if(d.kind==='kill'&&!host&&api.getAccounts()?.active&&enemies[d.enemy]?.accountHits)api.getAccounts().event('kill',{target:d.enemy});if(d.kind==='notice')api.toast(d.text);if(d.kind==='exp-projectile'&&!host)api.expansion?.projectile(d.enemy,d.attack);
  }
  function point(uid){if(uid===id)return {ch:hero,pose:pose()};const p=peers.get(uid);return p?.pose&&clock-p.last<3?{ch:p.ch,pose:p.pose}:null}
  function handleCommand(uid,d){
    if(!active||!host||!d)return;
    if(d.kind==='sync'){sendSnapshot();return}
    if(!Number.isSafeInteger(d.request)||d.request<1||d.request<=(seen.get(uid)||0))return;seen.set(uid,d.request);
    const p=point(uid);if(!p||p.pose.hp<=0||p.pose.away&&d.kind!=='exp-bounty'&&d.kind!=='build')return;
    if(d.kind==='attack'){
      const peer=peers.get(uid),combat=api.characterStats(p.pose,items);if(!peer||clock-peer.lastAttack<.43/combat.attackSpeed)return;peer.lastAttack=clock;const combo=Number.isInteger(d.combo)&&d.combo>=0&&d.combo<3?d.combo:0;peer.attack={t:0,duration:(combo===2?.72:.48)/combat.attackSpeed,whirlwind:combo===2&&combat.whirlwind,combat,combo,hit:new Set()};return;
    }
    if(d.kind==='build'){try{api.getHomestead()?.remoteCommand(d.baseKind,d.op,p.pose,uid)}catch(e){event({kind:'notice',text:e.message},uid)}sendSnapshot();return}
    if(d.kind==='exp-structure'){if(!api.structureFrom(uid,()=>api.expansion.structure(p.pose,d.action||{})))event({kind:'notice',text:'Check the glyphs, key and nearby guardians.'},uid);sendSnapshot();return}if(d.kind==='exp-bounty'){api.expansion.respawnBounty(d.target,p.pose);sendSnapshot();return}
    if(d.kind==='pickup'){
      for(const l of [...loot])if(Math.hypot(l.g.position.x-p.pose.x,l.g.position.z-p.pose.z)<2.8&&(!Array.isArray(d.ids)||d.ids.includes(l.netId))){
        const item={id:l.id,qty:l.qty,reward:l.reward};api.removeLoot(l);
        if(item.id==='cavekey'){living.serialize().sharedKey=true;event({kind:'notice',text:'The party found the iron gate key.'})}
        else if(item.id==='relic'){for(const member of roster)event({kind:'grant',...item},member.id)}
        else event({kind:'grant',...item},uid);
      }sendSnapshot();return;
    }
    if(d.kind==='structure'){
      const pos=p.pose,data=living.serialize();const near=(x,z,r=3)=>Math.hypot(pos.x-x,pos.z-z)<r;
      const guards=(x,z,r)=>enemies.some(e=>e.hp>0&&Math.hypot(e.root.position.x-x,e.root.position.z-z)<r);
      if(near(300,-31,4)&&!data.gateOpen){if(data.sharedKey){api.structureFrom(uid,()=>api.accountStructure('hollow:gate'));data.gateOpen=true;data.sharedKey=false;event({kind:'notice',text:'The party opened the iron gate.'})}else event({kind:'notice',text:'Find the key in the eastern scaffold chamber.'},uid)}
      for(const [x,z,key] of [[313,-21,'keyChest'],[290,-59,'hiddenChest']])if(near(x,z)&&!data[key]){if(guards(x,z,7)){event({kind:'notice',text:'Defeat the nearby guards first.'},uid);continue}api.structureFrom(uid,()=>api.accountStructure('hollow:'+key));data[key]=true;if(key==='keyChest')api.drop('cavekey',x-.7,z);else{api.drop('gem',x+.4,z,2);api.drop('coin',x-.4,z,55)}}
      for(const c of api.chests)if(near(c.x,c.z)&&!c.open){if(guards(c.x,c.z,9)){event({kind:'notice',text:'Defeat the guardians first.'},uid);continue}api.structureFrom(uid,()=>api.accountStructure('overworld:'+api.chests.indexOf(c)));c.open=true;api.drop(c.z<-50?'w4':'w2',c.x+1,c.z);api.drop(c.z<-50?'a4':'a2',c.x-1,c.z);api.drop('coin',c.x,c.z+1,35)}sendSnapshot();return;
    }
    // Dropping inventory is local-only while in co-op: no client can mint shared loot.
  }
  function interact(){
    if(!active)return false;const nearby=loot.filter(l=>l.g.position.distanceTo(hero.root.position)<2.6&&!(api.getAccounts()?.active&&l.reward?.target!==undefined&&(api.getAccounts().hasUnique(l.id)||!api.getAccounts().canLoot(l.reward))));if(nearby.length){command({kind:'pickup',ids:nearby.map(l=>l.netId)});return true}
    const p=hero.root.position,d=living.serialize();if((p.x>200&&((!d.gateOpen&&Math.hypot(p.x-300,p.z+31)<4)||(!d.keyChest&&Math.hypot(p.x-313,p.z+21)<3)||(!d.hiddenChest&&Math.hypot(p.x-290,p.z+59)<3)))||api.chests.some(c=>!c.open&&Math.hypot(p.x-c.x,p.z-c.z)<3)){command({kind:'structure'});return true}return false;
  }
  function target(e){
    if(!active||!host)return hero;
    const candidates=[];if(api.player.hp>0&&!api.panel&&api.state==='playing')candidates.push(hero);
    for(const p of peers.values())if(p.pose?.hp>0&&!p.pose.away&&clock-p.last<3)candidates.push(p.ch);
    if(e.state==='attack'&&e.netTarget){const locked=candidates.find(c=>(c.netId||id)===e.netTarget);if(locked)return locked}
    candidates.sort((a,b)=>a.root.position.distanceToSquared(e.root.position)-b.root.position.distanceToSquared(e.root.position));const result=candidates[0];if(!result)return null;e.netTarget=result.netId||id;return result;
  }
  function update(dt){
    clock+=dt;if(!active)return;poseTime+=dt;snapshotTime+=dt;
    if(poseTime>=.1){poseTime=0;sendPose()}
    if(host&&snapshotTime>=.1){snapshotTime=0;sendSnapshot()}
    if(!host&&clock-lastSnapshot>20){leave('The host stopped responding. Your solo save is unchanged.');return}
    for(const [uid,p] of peers){
      if(!p.pose)continue;const d=p.pose,old=p.ch.root.position.clone();p.ch.root.position.lerp(new THREE.Vector3(d.x,d.y,d.z),1-Math.exp(-dt*18));api.face(p.ch,d.yaw,dt);
      const speed=Math.min(7,old.distanceTo(p.ch.root.position)/Math.max(dt,.001));api.resetRoll(p.ch);api.animate(p.ch,speed,dt,d.attack,d.hp<=0?2:0);p.ch.weapon.visible=!!d.weapon;api.getHomestead()?.gathering.remote(p.ch,d.hp>0&&!d.attack?d.gathering:null);
      if(d.blocking)p.ch.arms[0].rotation.x=-1.35;
      if(d.dodge>0)api.groundedRoll(p.ch,d.dodge/.58);
      p.ch.root.visible=clock-p.last<5&&(d.x>200)===(hero.root.position.x>200)&&p.ch.root.position.distanceTo(hero.root.position)<55;
      const armour=items[d.armour],weapon=items[d.weapon];p.ch.bodyMat.color.setHex(armour?.color||0x42614c);p.ch.bodyMat.metalness=(armour?.defence||0)>=4?.65:0;p.ch.bladeMat.color.setHex(weapon?.color||0xaabbbc);p.ch.weapon.visible=!!weapon;
      api.companions?.syncRemote(uid,p.ch,{...d,moving:speed>.1},dt);p.label.textContent=(roster.find(r=>r.id===uid)?.name||'Adventurer')+` · Lv ${d.level} · ${Math.max(0,Math.ceil(d.hp))} HP`+(d.hp<=0?' · fallen':d.away?' · away':'');if(p.ch.root.visible)api.project(p.ch.root.position.clone().add(new THREE.Vector3(0,2.8,0)),p.label);else p.label.style.display='none';
      if(host&&p.attack){const a=p.attack;a.t+=dt;const t=a.t/a.duration;if(t>.3&&t<.72&&!d.away&&d.hp>0)for(const e of enemies){if(e.hp<=0||a.hit.has(e))continue;const dx=e.root.position.x-d.x,dz=e.root.position.z-d.z,angle=Math.atan2(dx,dz)-d.yaw;if(Math.hypot(dx,dz)<(a.whirlwind?3.1:2.5)+e.scale*.25&&(a.whirlwind||Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<1.25)&&Math.abs(e.root.position.y-d.y)<2){a.hit.add(e);api.hitFrom(e,a.combat.attack*(a.combo===2?a.combat.finisher:1),a.combo===2,p.ch,a.combat)}}if(t>=1)p.attack=null}
    }
    if(!host)for(const e of enemies){const d=e.netPose;if(!d)continue;e.root.position.lerp(new THREE.Vector3(d.x,d.y,d.z),1-Math.exp(-dt*18));api.face(e,d.yaw,dt);e.root.visible=(d.x>200)===(hero.root.position.x>200)&&e.root.position.distanceTo(hero.root.position)<55&&(e.hp>0||e.dead<3);api.animate(e,e.state==='chase'?e.speed:e.state==='patrol'?e.speed*.35:0,dt,e.attack,e.hp<=0?e.dead:0);e.recoil=Math.max(0,(e.recoil||0)-dt);if(e.guardian)living.guardianTell(e)}
  }
  function onKill(e){if(active&&host)send({type:'event',data:{kind:'kill',enemy:enemies.indexOf(e),x:e.root.position.x,z:e.root.position.z}})}
  return {get active(){return active},get host(){return host},get applying(){return applying},get peers(){return peers},get code(){return code},get id(){return id},lobby,leave,update,interact,target,onKill,
    build(baseKind,op){command({kind:'build',baseKind,op})},expansionStructure(action){command({kind:'exp-structure',action})},expansionBounty(target){command({kind:'exp-bounty',target})},expansionProjectile(enemy,attack){if(active&&host)send({type:'event',data:{kind:'exp-projectile',enemy,attack}})},
    accountStructure(uid,id){if(active&&host)event({kind:'account-structure',id},uid)},accountHit(uid,hit){if(active&&host)event({kind:'account-hit',hit},uid)},
    onAttack(combo){if(active&&!host)command({kind:'attack',combo})},
    routeDamage(n,source,targetId,effect){if(active&&host&&targetId&&targetId!==id){event({kind:'hurt',amount:n,x:source.x,y:source.y,z:source.z,effect},targetId);return true}return false},
    suppressDrop(){return active&&!host&&!applying},
    canDrop(){if(active){api.toast('Sell unwanted equipment at the merchant during co-op.');return false}return true},
  };
}
