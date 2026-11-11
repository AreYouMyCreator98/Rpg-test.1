'use strict';
/* CHAINFALL — Oath of Ash. Original canvas engine, procedural animation and art. */
(() => {
const W=960,H=540,FLOOR=427,PI=Math.PI,TAU=PI*2;
const cv=document.getElementById('game'),g=cv.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const smooth=t=>t*t*(3-2*t);
const COLORS=['#f5a35d','#b5d6f4','#dfbc80','#9d9be9','#d7a170','#f17c64','#9fe1cf','#e7bb6a'];
const names=['CHAIN BLADES','OATHBREAKER','DAWN SPEAR','NIGHTFANG','EARTHSHAKER','TWIN RAVAGERS','SOUL SCYTHE','RUNE GAUNTLETS'];
const icons=['chainblades','greatsword','spear','daggers','hammer','axes','scythe','gauntlets'];
// Move fields: name, damage, reach, windup, active, recovery, knockback, lift, stagger, multi, shape.
function m(name,dmg,reach,wind,active,rec,knock,lift,stagger,shape='arc',multi=1){
 return {name,dmg,reach,wind,active,rec,knock,lift,stagger,shape,multi};
}
const WEAPONS=[
 {name:names[0],tag:'REACH / CROWD',speed:1,stamina:7,moves:[m('Serpent Lash',12,154,7,12,11,15,0,8,'chain',2),m('Twin Eclipse',16,174,7,13,12,22,0,11,'chain',2),m('Infernal Cyclone',28,195,12,17,18,37,5,23,'spin',2)],heavy:m('Chainbreaker',34,210,19,13,23,53,10,32,'spin'),special:m('ABYSSAL TEMPEST',62,255,9,43,25,65,21,70,'spin',4)},
 {name:names[1],tag:'POWER / GUARD BREAK',speed:.78,stamina:11,moves:[m('Iron Requiem',26,125,15,10,20,40,4,19),m('Falling Oath',32,140,17,11,20,47,12,28),m('Kingbreaker',48,156,21,12,22,65,20,44)],heavy:m('Sundering Blade',62,168,28,14,28,83,35,63,'crush'),special:m('LAST JUDGEMENT',115,210,24,17,37,105,55,100,'crush',2)},
 {name:names[2],tag:'PRECISION / PIERCE',speed:1.08,stamina:7,moves:[m('Dawn Thrust',16,175,7,8,9,21,0,11,'thrust'),m('Sunspike',22,205,10,10,12,31,2,16,'thrust'),m('Heaven Piercer',33,235,14,12,16,43,13,30,'thrust')],heavy:m('Lance of Ruin',47,258,20,13,18,59,17,37,'thrust'),special:m('RADIANT IMPALE',85,340,15,18,25,81,30,87,'thrust',2)},
 {name:names[3],tag:'SPEED / CRITICAL',speed:1.31,stamina:5,moves:[m('Shadow Nick',12,105,4,7,6,13,0,7,'dagger',2),m('Backstab Waltz',14,115,5,10,7,17,0,9,'dagger',2),m('Nightfall',25,135,8,11,10,25,3,20,'dagger',3)],heavy:m('Assassin Cross',37,145,14,13,13,38,6,32,'dagger',2),special:m('THOUSAND CUTS',18,170,5,48,12,15,2,65,'dagger',7)},
 {name:names[4],tag:'STAGGER / SHOCKWAVE',speed:.75,stamina:12,moves:[m('Stone Crack',29,117,16,11,20,48,7,32,'crush'),m('Fault Line',40,137,18,13,22,58,15,42,'crush'),m('Titan Break',57,165,24,13,25,80,29,63,'crush')],heavy:m('Seismic Slam',69,190,30,18,30,92,32,75,'crush'),special:m('WORLDQUAKE',105,270,29,20,36,98,44,100,'crush',2)},
 {name:names[5],tag:'FEROCITY / CLEAVE',speed:1.09,stamina:8,moves:[m('Ravager Cut',19,123,8,10,11,29,0,14,'axes',2),m('Feral Cross',23,136,10,11,13,34,3,18,'axes',2),m('Blood Spiral',36,160,12,17,15,44,10,33,'spin',2)],heavy:m('Executioner',48,171,19,14,20,72,20,46,'axes',2),special:m('RED MAELSTROM',21,220,10,48,24,33,5,75,'spin',5)},
 {name:names[6],tag:'SOUL STEAL / WIDE ARC',speed:.96,stamina:9,moves:[m('Pale Crescent',21,165,10,13,13,25,0,15,'scythe'),m('Grave Dance',26,186,12,14,14,33,4,22,'scythe'),m('Reaper Embrace',35,205,16,18,17,46,9,36,'scythe')],heavy:m('Harvest Moon',49,228,23,18,23,62,13,49,'scythe'),special:m('SOUL HARVEST',82,265,21,26,28,71,18,95,'scythe',3)},
 {name:names[7],tag:'BRAWLER / COMBO',speed:1.18,stamina:5,moves:[m('Rune Jab',12,91,4,7,6,14,0,7,'fist',2),m('Cross Counter',16,99,5,9,8,19,3,11,'fist',2),m('Dragon Uppercut',26,112,9,12,11,29,24,29,'fist',3)],heavy:m('Meteor Knuckle',41,130,16,13,16,48,28,41,'fist'),special:m('CELESTIAL BARRAGE',20,152,6,48,17,29,7,80,'fist',6)}
];
const ENEMY={
 husk:{hp:65,speed:.72,damage:10,range:52,wind:37,recovery:50,color:'#85847c',scale:1,points:6},
 raider:{hp:100,speed:1.06,damage:15,range:66,wind:27,recovery:45,color:'#b16f55',scale:1.08,points:11},
 shade:{hp:72,speed:1.55,damage:13,range:50,wind:21,recovery:37,color:'#73829f',scale:.88,points:15},
 brute:{hp:190,speed:.52,damage:24,range:74,wind:49,recovery:68,color:'#766e72',scale:1.43,points:23},
 warden:{hp:1050,speed:.77,damage:30,range:125,wind:44,recovery:51,color:'#ad7258',scale:2.02,points:250}
};
let audio=null,soundOn=true,records={best:0,souls:0};
const unlockCosts=[0,120,250,400,620,900,1300,1800];
let progression={wallet:0,equipped:0,unlocked:[true,false,false,false,false,false,false,false]};
let armoryChoice=0,armoryReturn="mainMenu",resetConfirm=false;
try {const saved=JSON.parse(localStorage.getItem('chainfall_v2_progress')||'null');if(saved&&Array.isArray(saved.unlocked)){
 progression.wallet=Math.max(0,Number(saved.wallet)||0);
 progression.equipped=Number.isInteger(saved.equipped)&&saved.equipped>=0&&saved.equipped<8?saved.equipped:0;
 progression.unlocked=unlockCosts.map((_,i)=>i===0||!!saved.unlocked[i]);
}}catch(e){}
function saveProgress(){try{localStorage.setItem('chainfall_v2_progress',JSON.stringify(progression))}catch(e){}}
function unlocked(i){return i===0||!!progression.unlocked[i]}

try{records={best:0,souls:0,...JSON.parse(localStorage.getItem('chainfall_v1_records')||'{}')};soundOn=localStorage.getItem('chainfall_sound')!=='off'}catch(e){}
function save(){try{localStorage.setItem('chainfall_v1_records',JSON.stringify(records))}catch(e){}}
function setupAudio(){if(!soundOn)return;try{if(!audio)audio=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume()}catch(e){}}
function tone(freq=180,duration=.1,type='sawtooth',vol=.045,sweep=0){if(!audio||!soundOn)return;try{const o=audio.createOscillator(),v=audio.createGain(),now=audio.currentTime;o.type=type;o.frequency.setValueAtTime(freq,now);if(sweep)o.frequency.exponentialRampToValueAtTime(Math.max(32,freq+sweep),now+duration);v.gain.setValueAtTime(.001,now);v.gain.exponentialRampToValueAtTime(Math.max(.001,vol),now+.012);v.gain.exponentialRampToValueAtTime(.001,now+duration);o.connect(v).connect(audio.destination);o.start(now);o.stop(now+duration+.025)}catch(e){}}
const state={phase:'menu',t:0,wave:1,kills:0,runSouls:0,pending:0,spawnTimer:0,advance:-1,flash:0,shake:0,slow:0,announcement:0};
let hero={},enemies=[],particles=[],shocks=[],projectiles=[],texts=[],ambient=[];
let id=0,lastTime=0,stickAxis=0,lastHUD=0,toastHandle=0;
const keys=new Set();
const makeHero=()=>({x:210,y:FLOOR,vx:0,vy:0,face:1,ground:true,hp:140,maxHp:140,stamina:100,fury:0,weapon:unlocked(progression.equipped)?progression.equipped:0,action:null,dodge:0,inv:0,combo:0,comboTimer:0,step:0,landing:0,hit:0});
hero=makeHero();
function resize(){const dpi=Math.min(window.devicePixelRatio||1,2);cv.width=Math.round(W*dpi);cv.height=Math.round(H*dpi);g.setTransform(dpi,0,0,dpi,0,0)}
resize();window.addEventListener('resize',resize);
function waveName(n){if(n%4===0)return 'THE WARDEN AWAKENS';return ['THE SUNDERED GATE','CATHEDRAL OF EMBERS','THE BONE FORGE','MOONLIT ABYSS','THRONE OF ASH'][Math.floor((n-1)/4)%5]}
function toast(msg,time=100){$('toast').textContent=msg;$('toast').classList.add('show');toastHandle=time}
function show(id){document.querySelectorAll('.overlay').forEach(el=>el.classList.remove('visible'));if(id)$(id).classList.add('visible')}
function weaponUI(){const bar=$('weaponBar');bar.innerHTML='';WEAPONS.forEach((w,i)=>{const b=document.createElement('button');b.type='button';b.className='weapon-slot'+(hero.weapon===i?' active':'')+(unlocked(i)?'':' locked');b.setAttribute('aria-label',w.name+(unlocked(i)?'':' locked'));b.innerHTML='<img src="assets/'+icons[i]+'.svg" alt=""><span class="weapon-num">'+(i+1)+'</span>'+(unlocked(i)?'':'<span class="slot-lock">🔒</span>')+'<span class="weapon-tip">'+(unlocked(i)?w.name:unlockCosts[i]+' SOULS')+'</span>';b.addEventListener('pointerdown',e=>{e.preventDefault();setupAudio();selectWeapon(i)});bar.appendChild(b)})}
function selectWeapon(i){if(state.phase!=='playing')return;if(!unlocked(i)){toast('LOCKED · '+unlockCosts[i]+' SOULS IN ARMORY',72);tone(80,.08,'sawtooth',.018,-30);return}hero.weapon=i;progression.equipped=i;saveProgress();hero.combo=0;hero.action=null;weaponUI();toast(WEAPONS[i].name,58);tone(330+i*33,.1,'triangle',.042,150)}
function hud(){const hp=100*hero.hp/hero.maxHp;$('hpFill').style.width=clamp(hp,0,100)+'%';$('hpText').textContent=Math.ceil(hero.hp)+' / '+hero.maxHp;$('stFill').style.width=hero.stamina+'%';$('furyFill').style.width=hero.fury+'%';$('furyText').textContent='FURY '+Math.floor(hero.fury)+'%';$('hudSouls').textContent=state.runSouls+' SOULS';$('waveText').textContent='WAVE '+state.wave;$('killsText').textContent=state.kills+' SLAIN';$('chapterName').textContent=waveName(state.wave);$('specialCost').textContent=hero.fury>=50?'READY':'50';document.querySelector('.combat-btn.special').classList.toggle('cooling',hero.fury<50)}
function recordsUI(){$('bestWave').textContent=records.best;$('totalSouls').textContent=records.souls;if($('walletSouls'))$('walletSouls').textContent=progression.wallet}
function bankRun(){if(state.banked||state.runSouls<=0)return;state.banked=true;progression.wallet+=state.runSouls;records.souls+=state.runSouls;records.best=Math.max(records.best,state.wave);saveProgress();save()}
function showArmory(from){armoryReturn=from||'mainMenu';if(state.phase==='playing')pause();armoryChoice=hero.weapon;renderArmory();show('armoryOverlay')}
function closeArmory(){show(armoryReturn);recordsUI()}
function renderArmory(){
 const grid=$('armoryGrid');grid.innerHTML='';
 WEAPONS.forEach((w,i)=>{const b=document.createElement('button');b.className='armory-entry'+(unlocked(i)?' owned':'')+(armoryChoice===i?' selected':'');b.type='button';
 b.innerHTML='<img src="assets/'+icons[i]+'.svg" alt=""><span>'+w.name+'</span>'+(unlocked(i)?'':'<b class="lock">🔒</b>');
 b.addEventListener('click',()=>{armoryChoice=i;renderArmory();tone(260,.08,'triangle',.02,40)});grid.appendChild(b)});
 const w=WEAPONS[armoryChoice],cost=unlockCosts[armoryChoice],owned=unlocked(armoryChoice);
 $('walletSouls').textContent=progression.wallet;
 $('armoryDetails').innerHTML='<h3>'+w.name+'</h3><p>'+w.tag+' · Base damage '+w.moves[0].dmg+'–'+w.moves[2].dmg+' · '+w.special.name+'. '+(owned?'Unlocked. Ready to equip.':'<span class="price">Unlock for '+cost+' souls.</span> Souls are banked when a run ends.')+'</p>';
 $('armoryAction').textContent=owned?(hero.weapon===armoryChoice?'EQUIPPED':'EQUIP WEAPON'):'UNLOCK · '+cost+' SOULS';
 $('armoryAction').disabled=owned&&hero.weapon===armoryChoice;
}
function armoryAction(){const i=armoryChoice;if(!unlocked(i)){if(progression.wallet<unlockCosts[i]){toast('NOT ENOUGH SOULS',64);tone(90,.2,'sawtooth',.025,-60);return}progression.wallet-=unlockCosts[i];progression.unlocked[i]=true;saveProgress();toast(WEAPONS[i].name+' UNLOCKED',110);tone(470,.32,'triangle',.07,240)}
 if(unlocked(i)){hero.weapon=i;progression.equipped=i;saveProgress();hero.action=null;hero.combo=0;weaponUI();renderArmory();tone(270,.15,'triangle',.04,120)}
}
function start(){setupAudio();hero=makeHero();enemies=[];particles=[];projectiles=[];shocks=[];texts=[];state.phase='playing';state.wave=1;state.kills=0;state.runSouls=0;state.banked=false;state.t=0;state.shake=0;state.flash=0;state.slow=0;waveStart();show(null);$('hud').classList.remove('hidden');$('weaponBar').classList.remove('hidden');$('touchControls').classList.remove('hidden');weaponUI();hud();tone(90,.65,'sawtooth',.07,65)}
function waveStart(){state.pending=state.wave%4===0?1:Math.min(12,3+state.wave*2);state.spawnTimer=50;state.advance=-1;state.announcement=130;toast(state.wave%4===0?'THE WARDEN APPROACHES':'WAVE '+state.wave+' — '+waveName(state.wave),125);hero.hp=Math.min(hero.maxHp,hero.hp+16);hero.stamina=100;hud()}
function spawn(){let type;if(state.wave%4===0)type='warden';else{const pool=['husk','husk','raider'];if(state.wave>1)pool.push('shade');if(state.wave>2)pool.push('brute');type=pool[Math.floor(Math.random()*pool.length)]}const def=ENEMY[type],fromRight=Math.random()<.78;enemies.push({id:++id,type,x:fromRight?rnd(820,910):rnd(50,100),y:FLOOR+rnd(-7,7),vx:0,vy:0,hp:def.hp*(1+(state.wave-1)*.13),maxHp:def.hp*(1+(state.wave-1)*.13),face:fromRight?-1:1,attack:0,telegraph:0,cooldown:rnd(40,90),stagger:0,inv:0,dead:false,walk:rnd(0,TAU),aggro:0,phase:0,flash:0})}
function pause(){if(state.phase!=='playing')return;state.phase='paused';show('pauseOverlay')}
function resume(){if(state.phase!=='paused')return;state.phase='playing';show(null);lastTime=performance.now()}
function toTitle(){if(state.phase==='playing'||state.phase==='paused')bankRun();state.phase='menu';show('mainMenu');$('hud').classList.add('hidden');$('weaponBar').classList.add('hidden');$('touchControls').classList.add('hidden');recordsUI()}
function die(){state.phase='dead';records.best=Math.max(records.best,state.wave);bankRun();save();$('resultWave').textContent=state.wave;$('resultKills').textContent=state.kills;$('resultSouls').textContent=state.runSouls;show('deathOverlay');$('touchControls').classList.add('hidden');$('weaponBar').classList.add('hidden');tone(180,.7,'sawtooth',.07,-130)}
function jump(){if(state.phase!=='playing'||!hero.ground||hero.stamina<8||hero.dodge>0)return;hero.vy=-13.9;hero.ground=false;hero.stamina-=8;tone(190,.11,'triangle',.025,90);dust(hero.x,hero.y,7,'#bcac90')}
function dodge(){if(state.phase!=='playing'||hero.dodge>0||hero.stamina<22)return;hero.dodge=18;hero.inv=23;hero.vx=hero.face*12;hero.stamina-=22;hero.action=null;hero.combo=0;dust(hero.x,hero.y-30,17,'#9ab6c8');tone(280,.13,'triangle',.044,-220)}
function light(){attack('light')}
function heavy(){attack('heavy')}
function special(){attack('special')}
function attack(kind){
 if(state.phase!=='playing'||hero.dodge>0)return;
 const w=WEAPONS[hero.weapon];
 if(kind==='special'&&hero.fury<50){toast('FURY NOT READY',32);return}
 if(hero.action){if(kind!=='light'||hero.action.kind!=='light'||hero.action.elapsed<hero.action.move.wind+hero.action.move.active*.55)return;hero.action=null}
 const cost=kind==='special'?0:kind==='heavy'?18:w.stamina;
 if(hero.stamina<cost){toast('EXHAUSTED',35);return}
 let move;
 if(kind==='light'){
   hero.combo=hero.comboTimer>0?(hero.combo+1)%3:0;
   move=w.moves[hero.combo];hero.comboTimer=52;
 }else {move=kind==='heavy'?w.heavy:w.special;hero.combo=0;hero.comboTimer=0}
 if(kind==='special'){hero.fury-=50;state.flash=9;toast(move.name,65);tone(100,.43,'sawtooth',.09,350)}
 else {hero.stamina-=cost;tone(kind==='heavy'?88:170+rnd(-20,90),kind==='heavy'?.22:.12,'sawtooth',.03,kind==='heavy'?-55:150)}
 hero.action={move,kind,elapsed:0,done:0,hitIds:new Set(),strikeTimes:move.multi>1?Array.from({length:move.multi},(_,i)=>move.wind+(i+.35)*move.active/move.multi):[move.wind+move.active*.32]};
 hero.vx*=kind==='special'?.4:.55;
}
function enemyHit(e,dmg,knock,lift,stagger,from,healing=0){
 if(e.dead||e.inv>0)return false;
 const guard=e.type==='brute'||e.type==='warden';
 const actual=Math.max(1,Math.round(dmg*(guard?.94:1)*rnd(.87,1.13)));
 e.hp-=actual;e.stagger+=stagger*(guard?.58:1);e.flash=8;e.aggro=45;e.vx+=from*knock*.12/(e.type==='warden'?2.4:e.type==='brute'?1.5:1);e.vy=Math.min(e.vy,-lift*.12);
 hero.fury=clamp(hero.fury+Math.max(2,actual*.17),0,100);hero.hp=Math.min(hero.maxHp,hero.hp+healing);
 popText(e.x+rnd(-16,16),e.y-74*ENEMY[e.type].scale,actual,Math.random()<.12?'#ffe1a6':'#f0b37d',actual>55?20:15);
 spark(e.x,e.y-58*ENEMY[e.type].scale,Math.min(28,5+actual*.24),COLORS[hero.weapon]);
 state.shake=Math.min(16,state.shake+actual*.055);state.slow=Math.max(state.slow,actual>50?4:2);tone(70+rnd(0,80),.09,'square',.018,-45);
 if(e.stagger>=(e.type==='warden'?120:55)){e.stagger=0;e.telegraph=0;e.attack=0;e.cooldown=34;dust(e.x,e.y-40,10,'#e3bc85')}
 if(e.hp<=0){e.dead=true;e.deathTimer=22;e.inv=999;state.kills++;state.runSouls+=ENEMY[e.type].points;records.best=Math.max(records.best,state.wave);spark(e.x,e.y-45,36,e.type==='warden'?'#ed8a50':'#b7a4c8');shock(e.x,e.y-35,100,'#ca8864');popText(e.x,e.y-120,'+'+ENEMY[e.type].points+' SOULS','#e4c68c',13);tone(82,.25,'sawtooth',.033,-45);if(e.type==='warden'){state.flash=18;toast('WARDEN VANQUISHED',120);hero.hp=Math.min(hero.maxHp,hero.hp+42)}}
 return true;
}
function strikeAt(a,idx){
 const move=a.move,dir=hero.face,w=hero.weapon,radial=move.shape==='spin'||(a.kind==='special'&&(w===4||w===6)),isPierce=move.shape==='thrust',baseDmg=move.dmg;
 const mult=move.multi>1?(w===3||w===7?.67:w===0?.65:.7):1;
 const attackX=hero.x+dir*move.reach*.48;
 if(move.shape==='crush'||w===4){shock(attackX,FLOOR-16,move.reach*.93,COLORS[w]);dust(attackX,FLOOR-6,21,'#c7a17b')}
 if(a.kind==='special'&&w===2){projectiles.push({x:hero.x+dir*65,y:hero.y-79,vx:dir*22,vy:0,r:17,damage:move.dmg*.6,life:18,color:COLORS[w],piercing:true,ids:new Set()})}
 if(a.kind==='special'&&w===6){shock(hero.x,hero.y-52,move.reach,COLORS[w])}
 if(a.kind==='special'&&w===3){hero.x=clamp(hero.x+dir*25,48,912);spark(hero.x,hero.y-60,8,'#a99ee3')}
 if(a.kind==='special'&&w===7){hero.x=clamp(hero.x+dir*9,48,912)}
 enemies.forEach(e=>{
   if(e.dead)return;
   const dx=e.x-hero.x,dy=Math.abs(e.y-hero.y);
   const inRange=radial?Math.abs(dx)<move.reach:dx*dir>-26&&dx*dir<move.reach+(isPierce?24:0);
   if(inRange&&dy<112+Math.max(0,hero.y-e.y)*.15){
     if(a.hitIds.has(e.id+':'+idx))return;
     a.hitIds.add(e.id+':'+idx);
     const crit=w===3&&Math.random()<.24?1.7:1;
     const heal=w===6?Math.round(baseDmg*.16):0;
     enemyHit(e,baseDmg*mult*crit*(a.kind==='special'&&w===7?1.15:1),move.knock,move.lift,move.stagger,radial?(dx>0?1:-1):dir,heal);
   }
 });
 if(a.kind==='special'&&idx===0){state.shake+=6;state.flash=10}
 if(w===4||a.kind==='heavy')state.shake+=2;
}
function hurtHero(amount,from){
 if(state.phase!=='playing'||hero.inv>0||hero.dodge>0)return;
 hero.hp=Math.max(0,hero.hp-amount);hero.inv=31;hero.hit=13;hero.vx=from*4;hero.action=null;hero.combo=0;state.flash=10;state.shake=13;spark(hero.x,hero.y-55,15,'#e75e54');popText(hero.x,hero.y-100,'-'+amount,'#ff736a',19);tone(72,.28,'sawtooth',.09,-46);
 if(hero.hp<=0)die();
}
function updateHero(dt){
 const move=(keys.has('a')||keys.has('arrowleft')?-1:0)+(keys.has('d')||keys.has('arrowright')?1:0);
 const axis=clamp(move+stickAxis,-1,1);
 const w=WEAPONS[hero.weapon],canSteer=hero.dodge<=0;
 if(canSteer){
   const target=axis*3.4*w.speed*(hero.action?.36:1);
   hero.vx=lerp(hero.vx,target,clamp((hero.ground?.22:.13)*dt,0,1));
   if(Math.abs(axis)>.12)hero.face=axis>0?1:-1;
 }else hero.vx*=Math.pow(.96,dt);
 hero.x=clamp(hero.x+hero.vx*dt,45,915);
 hero.vy+=.71*dt;hero.y+=hero.vy*dt;
 if(hero.y>=FLOOR){if(!hero.ground&&hero.vy>4){hero.landing=12;dust(hero.x,FLOOR,9,'#aaa08d')}hero.y=FLOOR;hero.vy=0;hero.ground=true}else hero.ground=false;
 hero.step+=Math.abs(hero.vx)*.055*dt;
 hero.stamina=clamp(hero.stamina+(.28+(hero.action?0:.36))*dt,0,100);
 hero.inv=Math.max(0,hero.inv-dt);hero.dodge=Math.max(0,hero.dodge-dt);hero.hit=Math.max(0,hero.hit-dt);hero.landing=Math.max(0,hero.landing-dt);hero.comboTimer=Math.max(0,hero.comboTimer-dt);
 if(hero.comboTimer===0&&!hero.action)hero.combo=0;
 const a=hero.action;
 if(a){
   const old=a.elapsed;a.elapsed+=dt;
   for(let i=0;i<a.strikeTimes.length;i++)if(old<a.strikeTimes[i]&&a.elapsed>=a.strikeTimes[i])strikeAt(a,i);
   const total=a.move.wind+a.move.active+a.move.rec;if(a.elapsed>=total)hero.action=null;
 }
}
function updateEnemies(dt){
 for(const e of enemies){
  if(e.dead){e.deathTimer-=dt;continue;}
  const d=ENEMY[e.type],dx=hero.x-e.x,dist=Math.abs(dx);
  e.walk+=dt*.08;e.inv=Math.max(0,e.inv-dt);e.flash=Math.max(0,e.flash-dt);e.aggro=Math.max(0,e.aggro-dt);e.stagger=Math.max(0,e.stagger-.11*dt);
  e.vy+=.63*dt;e.y=Math.min(FLOOR,e.y+e.vy*dt);if(e.y>=FLOOR)e.vy=0;
  if(e.telegraph>0){
   e.telegraph-=dt;e.vx*=.83;
   if(e.telegraph<=0){e.attack=15;e.aggro=14;const reach=d.range*(e.type==='warden'?1.6:1);if(Math.abs(e.x-hero.x)<reach&&Math.abs(e.y-hero.y)<100){hurtHero(d.damage*(e.type==='warden'&&e.hp<e.maxHp*.4?1.3:1)|0,e.x<hero.x?1:-1)}spark(e.x+e.face*45,e.y-65,8,'#ff7856');shock(e.x+e.face*42,e.y-42,d.range*.85,'#d66b58');e.cooldown=d.recovery}
  }else if(e.attack>0){e.attack-=dt;e.vx*=.82}
  else if(e.cooldown>0){e.cooldown-=dt;if(dist>d.range*.75)e.vx=lerp(e.vx,Math.sign(dx)*d.speed*.55,.07*dt);else e.vx*=.8}
  else if(dist<d.range+12&&Math.abs(e.y-hero.y)<110){e.telegraph=d.wind*(e.type==='warden'&&e.hp<e.maxHp*.5?.65:1);e.face=dx>0?1:-1;e.vx*=.5;tone(120,.12,'sine',.015,45)}
  else {e.vx=lerp(e.vx,Math.sign(dx)*d.speed*(e.type==='shade'?1.55:1),.08*dt);if(Math.abs(e.vx)>.1)e.face=e.vx>0?1:-1}
  e.x=clamp(e.x+e.vx*dt,25,940);
  if(e.type==='warden'&&e.hp<e.maxHp*.5&&e.phase===0){e.phase=1;state.flash=16;toast('THE WARDEN ENRAGES',80);shock(e.x,e.y-60,220,'#ec5d3a');e.cooldown=5}
 }
 for(let i=0;i<enemies.length;i++)for(let j=i+1;j<enemies.length;j++){const a=enemies[i],b=enemies[j];if(a.dead||b.dead)continue;const dx=b.x-a.x;if(Math.abs(dx)<30&&Math.abs(a.y-b.y)<25){const dir=dx>=0?1:-1;a.x-=dir*.35*dt;b.x+=dir*.35*dt}}
 enemies=enemies.filter(e=>!e.dead||e.deathTimer>0);
}
function updateProjectiles(dt){
 for(const p of projectiles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;dust(p.x,p.y,1,p.color);
  for(const e of enemies)if(!e.dead&&!p.ids.has(e.id)&&Math.abs(e.x-p.x)<38&&Math.abs(e.y-62-p.y)<58){p.ids.add(e.id);enemyHit(e,p.damage,26,5,24,p.vx>0?1:-1);if(!p.piercing)p.life=0}}
 projectiles=projectiles.filter(p=>p.life>0&&p.x>-50&&p.x<1010);
}
function addParticle(x,y,vx,vy,life,size,color,gravity=.12){particles.push({x,y,vx,vy,life,max:life,size,color,gravity});if(particles.length>440)particles.shift()}
function spark(x,y,n,color){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(1.4,7);addParticle(x,y,Math.cos(a)*s,Math.sin(a)*s,rnd(10,34),rnd(1.2,3.8),Math.random()<.25?'#fff0ce':color,.12)}}
function dust(x,y,n,color){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(.3,2.4);addParticle(x+rnd(-5,5),y,Math.cos(a)*s,Math.sin(a)*s,rnd(16,37),rnd(2,6),color,.02)}}
function shock(x,y,r,color){shocks.push({x,y,r,life:25,max:25,color})}
function popText(x,y,value,color,size=15){texts.push({x,y,value:String(value),color,size,life:45,max:45})}
function updateFX(dt){
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;p.vx*=Math.pow(.98,dt);p.life-=dt}
 particles=particles.filter(p=>p.life>0);
 for(const s of shocks)s.life-=dt;shocks=shocks.filter(s=>s.life>0);
 for(const t of texts){t.y-=.68*dt;t.life-=dt}texts=texts.filter(t=>t.life>0);
 if(Math.random()<.25)ambient.push({x:rnd(0,W),y:H+10,vx:rnd(-.25,.4),vy:rnd(-1.3,-.35),size:rnd(.6,2.3),life:rnd(140,320)});
 for(const e of ambient){e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt}ambient=ambient.filter(e=>e.life>0&&e.y>-30).slice(-95);
 state.flash=Math.max(0,state.flash-dt);state.shake*=Math.pow(.78,dt);if(state.shake<.3)state.shake=0;
 if(toastHandle>0){toastHandle-=dt;if(toastHandle<=0)$('toast').classList.remove('show')}
}
function update(dt){
 state.t+=dt;updateFX(dt);
 if(state.phase!=='playing')return;
 updateHero(dt);updateEnemies(dt);updateProjectiles(dt);
 if(state.pending>0){state.spawnTimer-=dt;if(state.spawnTimer<=0){spawn();state.pending--;state.spawnTimer=state.wave%4===0?1:clamp(63-state.wave*4,23,54)}}
 else if(enemies.length===0){if(state.advance<0)state.advance=130;else {state.advance-=dt;if(state.advance<=0){state.wave++;waveStart()}}}
 if(++lastHUD%5===0)hud();
}
const strokes=(x1,y1,x2,y2,width,col)=>{g.strokeStyle=col;g.lineWidth=width;g.lineCap='round';g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()};
function poly(points,color,stroke,line=1){g.beginPath();g.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)g.lineTo(points[i][0],points[i][1]);g.closePath();if(color){g.fillStyle=color;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=line;g.stroke()}}
function ellipse(x,y,rx,ry,col){g.beginPath();g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,TAU);g.fillStyle=col;g.fill()}
function grad(x,y,r,col){const a=g.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,col);a.addColorStop(1,'transparent');return a}
function drawBackground(){
 if(window.ChainfallArt&&window.ChainfallArt.drawBackground(g,state,W,H))return;
 const sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#080d19');sky.addColorStop(.4,'#22212a');sky.addColorStop(.7,'#49302d');sky.addColorStop(1,'#150e14');g.fillStyle=sky;g.fillRect(0,0,W,H);
 g.fillStyle=grad(650,170,260,'#a7593945');g.fillRect(330,-85,650,510);
 // Eclipsed star, luminous crescent and halo
 ellipse(671,110,80,80,'#d5ae7a17');ellipse(671,110,57,57,'#b97e5142');ellipse(668,107,43,43,'#d4b389');ellipse(659,98,40,40,'#1c1c27');
 const stars=[[88,31],[178,104],[296,44],[345,139],[467,63],[797,45],[908,99],[758,187],[73,173],[581,42]];
 for(const [x,y] of stars)ellipse(x,y,1.1,1.1,'#e6cbb55c');
 // Remote mountains
 poly([[0,298],[75,224],[126,275],[223,202],[320,266],[394,180],[497,273],[612,219],[737,272],[843,192],[960,270],[960,540],[0,540]],'#171c29');
 poly([[0,338],[103,285],[164,319],[280,254],[385,330],[484,250],[567,317],[678,247],[768,319],[855,259],[960,302],[960,540],[0,540]],'#20212a');
 g.fillStyle='#332b3073';g.fillRect(0,310,W,160);
 // The ruined gate
 g.save();g.translate(486,307);
 poly([[-120,106],[-103,-85],[-67,-94],[-62,106]],'#171820','#4d3c39',2);
 poly([[66,106],[70,-94],[105,-85],[122,106]],'#171820','#4d3c39',2);
 poly([[-110,-97],[110,-97],[102,-67],[-103,-67]],'#25222a','#645047',2);
 for(let i=0;i<8;i++){strokes(-115+i*31,-92,-121+i*31,-72,1,'#b88b6652')}
 g.strokeStyle='#251f25';g.lineWidth=24;g.beginPath();g.arc(0,102,80,PI,TAU);g.stroke();g.strokeStyle='#70513d6d';g.lineWidth=2;g.stroke();g.restore();
 // Silhouette towers
 for(const [x,y,s] of [[75,323,1.1],[153,342,.75],[845,332,1.27],[935,355,.64]]){
  g.save();g.translate(x,y);g.scale(s,s);
  poly([[-21,100],[-18,-45],[-27,-50],[0,-98],[26,-50],[18,-45],[20,100]],'#15191f','#40353a',1.5);
  strokes(-19,-42,19,-42,3,'#332b32');ellipse(0,-12,5,12,'#9f493a8c');g.restore()
 }
 // Distant smoke ribbons
 for(let i=0;i<7;i++){const x=i*177-30;g.beginPath();g.moveTo(x,360);g.bezierCurveTo(x+25,240,x-12+Math.sin(state.t*.005+i)*14,185,x+30,70);g.strokeStyle='#cbb08a09';g.lineWidth=35;g.stroke()}
 const ground=g.createLinearGradient(0,393,0,H);ground.addColorStop(0,'#46403c');ground.addColorStop(.08,'#292525');ground.addColorStop(.65,'#12131c');ground.addColorStop(1,'#090c12');g.fillStyle=ground;g.fillRect(0,397,W,H-397);
 strokes(0,409,W,409,3,'#8b614d75');strokes(0,423,W,423,1,'#ac795d41');
 for(let i=0;i<55;i++){const x=(i*137+19)%W,y=425+(i*47)%108;strokes(x,y,x+(i%3)*12+5,y+(i%4)*2,1,'#9d827226')}
 // Molten fractures in stone
 for(const n of [60,218,368,646,815]){g.beginPath();g.moveTo(n,506);g.lineTo(n+16,485);g.lineTo(n+6,459);g.lineTo(n+44,442);g.strokeStyle='#d26d3c41';g.lineWidth=2;g.stroke()}
 // Side braziers
 for(const x of [117,863]){strokes(x,410,x,344,7,'#6d5952');ellipse(x,344,18,6,'#61514c');g.fillStyle=grad(x,323,50,'#e47b3875');g.fillRect(x-50,273,100,100);poly([[x-10,339],[x-7,319],[x+2,305+Math.sin(state.t*.09)*5],[x+12,322],[x+9,340]],'#f4a253');ellipse(x,335,9,7,'#e6c278')}
 for(const e of ambient){g.globalAlpha=clamp(e.life/55,0,1)*.7;ellipse(e.x,e.y,e.size,e.size,'#ffbb77')}g.globalAlpha=1;
}
function groundShadow(x,y,s=1){g.fillStyle=grad(x,y,48*s,'#0000008f');g.fillRect(x-55*s,y-20*s,110*s,38*s);ellipse(x,y,31*s,6*s,'#0009')}
function drawHero(){
 if(window.ChainfallHeroV5 && window.ChainfallHeroV5.drawHero(g,hero,state)){return;}
 if(window.ChainfallArt&&window.ChainfallArt.drawHero(g,hero,state)){
  g.save();g.translate(hero.x,hero.y);g.scale(hero.face,1);
  g.translate(26,-64);
  const a=hero.action,progress=a?clamp((a.elapsed-a.move.wind)/Math.max(1,a.move.active),0,1):0;
  let swing=a?(-1.9+progress*3.4):-0.65;
  if(a&&a.elapsed<a.move.wind)swing=-.65-(a.elapsed/a.move.wind)*1.5;
  if(a&&a.move.shape==='thrust')swing=-.2+progress*.35;
  if(a&&a.move.shape==='fist')swing=-.5+progress*.75;
  if(a&&a.move.shape==='spin')swing+=a.elapsed*.13;
  g.rotate(swing);drawWeapon(hero.weapon,a?.move.shape||'idle',a?.elapsed||0);
  g.restore();if(hero.action)drawAttackFX(hero);return;
 }
 const p=hero;groundShadow(p.x,FLOOR+8,1.1);
 g.save();g.translate(p.x,p.y);g.scale(p.face,1);
 const t=state.t,walk=Math.sin(p.step)*Math.min(1,Math.abs(p.vx)*.45),bob=p.ground?Math.sin(p.step*2)*Math.min(2,Math.abs(p.vx)*.5):-1;
 if(p.dodge>0){g.globalAlpha=.52;g.shadowColor='#a2e9e9';g.shadowBlur=25}
 if(p.inv>0&&Math.floor(p.inv/3)%2===0)g.globalAlpha*=.63;
 g.translate(0,bob);
 // Worn crimson cape
 poly([[-19,-82],[-31,-68],[-36+Math.sin(t*.045)*8,-26],[-44+Math.sin(t*.061)*8,-10],[-12,-29],[5,-73]],'#482a35','#ad71517a',1.4);
 // Legs, articulated walk
 strokes(-10,-39,-12+walk*7,-17,13,'#232e38');strokes(10,-39,13-walk*7,-16,13,'#29333d');
 strokes(-12+walk*7,-17,-15+walk*11,-3,10,'#42404a');strokes(13-walk*7,-16,16-walk*11,-3,10,'#41404a');
 ellipse(-15+walk*11,-2,11,4,'#0d1017');ellipse(16-walk*11,-2,11,4,'#10131b');
 // Torso core and metallic trims
 poly([[-22,-89],[20,-89],[25,-56],[15,-39],[-16,-39],[-26,-58]],'#323841','#b59a70',2);
 poly([[-13,-81],[0,-87],[13,-81],[8,-58],[0,-51],[-9,-58]],'#6a6365','#d1ac72',1.5);
 poly([[0,-78],[5,-69],[0,-62],[-5,-69]],p.fury>=50?'#f4bb66':'#71b6b5');
 strokes(-22,-45,23,-45,8,'#252a32');strokes(-18,-45,18,-45,2,'#bd9563');
 // Back shoulder
 ellipse(-21,-82,15,12,'#777176');ellipse(-23,-82,8,8,'#3d434d');
 // Head + sharp hood and crown
 poly([[-16,-119],[-13,-100],[-11,-89],[10,-89],[15,-101],[12,-119],[0,-132]],'#262a34','#b99b75',1.5);
 poly([[-14,-112],[-8,-122],[-4,-115],[0,-128],[7,-116],[13,-123],[15,-112],[13,-94],[-13,-94]],'#48434a','#bfb298',1.5);
 poly([[-10,-109],[10,-109],[9,-96],[-9,-96]],'#121b25');
 ellipse(5,-102,3.2,1.8,'#ffac5b');ellipse(-6,-102,3.2,1.8,'#ffac5b');
 if(p.fury>=50){g.fillStyle=grad(0,-80,65,'#f59d3127');g.fillRect(-65,-140,130,135)}
 // Arms and gauntlet
 const a=p.action,prog=a?clamp((a.elapsed-a.move.wind)/(a.move.active||1),0,1):0;
 const wind=a&&a.elapsed<a.move.wind?a.elapsed/a.move.wind:0;
 let swing=a?(-1.9+prog*3.4):-0.65;
 if(a&&a.elapsed<a.move.wind)swing=-.6-wind*1.5;
 if(a&&a.elapsed>a.move.wind+a.move.active)swing=1.5-(a.elapsed-a.move.wind-a.move.active)*.045;
 if(a&&a.move.shape==='thrust')swing=-.2+prog*.35;
 if(a&&a.move.shape==='fist')swing=-.5+prog*.75;
 if(a&&a.move.shape==='spin')swing+=a.elapsed*.13;
 const armX=20,armY=-80;
 strokes(-21,-79,-21+Math.sin(t*.05)*2,-61,12,'#636269');ellipse(-21,-61,7,8,'#bd956e');
 strokes(20,-79,26,-62,12,'#62626a');ellipse(26,-62,8,8,'#b48c61');
 g.save();g.translate(26,-64);g.rotate(swing);
 strokes(0,0,0,-16,11,'#57545a');ellipse(0,-16,8,8,'#c9a273');
 drawWeapon(p.weapon,a?.move.shape||'idle',a?.elapsed||0);
 g.restore();
 if(a&&a.move.shape==='dagger'){g.save();g.translate(-22,-61);g.rotate(-swing*.8);strokes(0,0,-4,-37,4,'#b8c6d0');ellipse(-4,-37,4,7,'#e7c5a0');g.restore()}
 if(a&&a.move.shape==='fist'&&prog>.1){g.fillStyle=grad(43,-64,31,'#e3af7d80');g.fillRect(12,-95,65,64)}
 g.restore();
 if(p.action)drawAttackFX(p);
}
function bladeColor(){return COLORS[hero.weapon]}
function drawWeapon(w,shape,elapsed){
 const bright=COLORS[w];
 g.shadowColor=bright;g.shadowBlur=hero.action?11:4;
 if(w===0){ // Separate hooked blades on physically articulated chains
  for(const side of [-1,1]){let px=side*4,py=-14;const swing=Math.sin(state.t*.07+side)*8;g.strokeStyle='#b49b77';g.lineWidth=2.5;g.beginPath();g.moveTo(px,py);
   for(let i=0;i<5;i++){px+=side*(2+i*.7);py-=10;g.lineTo(px+swing*i/9,py);ellipse(px+swing*i/9,py,2.4,2.4,'#a68d6d')}
   g.stroke();poly([[px-8,py-3],[px-16,py-27],[px+1,py-46],[px+10,py-24],[px+2,py-14]],'#a6adb5',bright,2)}
 }else if(w===1){strokes(0,0,0,-35,8,'#725a4c');poly([[-12,-32],[-14,-76],[0,-102],[14,-76],[12,-32]],'#aeb9c5','#ecc994',3);strokes(0,-40,0,-89,2,'#e9d4b7');strokes(-20,-28,20,-28,7,'#d6ac6f')}
 else if(w===2){strokes(0,4,0,-120,5,'#a57d51');poly([[0,-130],[-11,-103],[0,-84],[11,-103]],'#d5e3e3',bright,2.5);strokes(-9,-90,9,-90,3,'#e3bd89')}
 else if(w===3){strokes(0,0,0,-20,6,'#9a785d');poly([[0,-55],[-9,-26],[0,-17],[9,-26]],'#c5d0da',bright,2)}
 else if(w===4){strokes(0,3,0,-66,10,'#946b44');poly([[-31,-82],[31,-82],[35,-57],[30,-50],[-30,-50],[-35,-57]],'#777e89','#dfb280',3);strokes(-27,-65,27,-65,3,'#d2c2a8')}
 else if(w===5){strokes(0,0,0,-53,7,'#a0764f');poly([[-4,-56],[-33,-82],[-37,-43],[-4,-48]],'#cbd4db',bright,2);poly([[4,-56],[33,-82],[37,-43],[4,-48]],'#cbd4db',bright,2)}
 else if(w===6){strokes(0,4,0,-121,5,'#916d52');g.beginPath();g.moveTo(0,-124);g.quadraticCurveTo(-51,-140,-73,-96);g.quadraticCurveTo(-48,-119,0,-107);g.closePath();g.fillStyle='#b9d5d3';g.fill();g.strokeStyle=bright;g.lineWidth=2;g.stroke()}
 else if(w===7){poly([[-13,-20],[-17,-41],[-4,-52],[13,-42],[17,-24],[9,-14]],'#888a93','#ebc18a',2);for(let i=-1;i<=1;i++)ellipse(i*10,-39,4,8,'#bfa274')}
 g.shadowBlur=0;
}
function drawAttackFX(p){
 const a=p.action,m=a.move,t=a.elapsed,from=m.wind,to=m.wind+m.active;if(t<from-4||t>to+7)return;
 const alpha=clamp((t-from+4)/6,0,1)*clamp((to+7-t)/13,0,1),progress=clamp((t-from)/m.active,0,1),col=COLORS[p.weapon];
 g.save();g.translate(p.x,p.y-71);g.scale(p.face,1);g.globalAlpha=alpha;g.globalCompositeOperation='lighter';
 const arc=(rad,start,end,width,color)=>{g.beginPath();g.arc(0,0,rad,start,end,false);g.lineWidth=width;g.strokeStyle=color;g.lineCap='round';g.stroke()};
 if(m.shape==='thrust'){const length=m.reach*(.25+.8*progress);g.strokeStyle=col;g.lineWidth=10;g.shadowColor=col;g.shadowBlur=15;g.beginPath();g.moveTo(16,-10);g.lineTo(length,0);g.stroke();poly([[length+28,0],[length-12,-13],[length-3,0],[length-12,13]],'#f8e4c9')}
 else if(m.shape==='crush'){arc(m.reach*.53,-1.3,.6,18,col);arc(m.reach*.68,-.55,1.1,5,'#ffdfa9');ellipse(m.reach*.6,55,21,9,col)}
 else if(m.shape==='dagger'||m.shape==='fist'){for(let i=0;i<3;i++){const q=progress*3+i*.4;g.beginPath();g.moveTo(20+i*10,-33+i*18);g.quadraticCurveTo(35+q*30,-44+i*35,65+q*20,20+i*10);g.lineWidth=4+i;g.strokeStyle=i===0?'#fff0ce':col;g.stroke()}}
 else if(m.shape==='chain'){arc(m.reach*.48,-2.15+progress*1.9,.3+progress*1.85,9,col);arc(m.reach*.78,-1.4+progress*1.2,.85+progress*1.5,5,'#fbe7b9');for(let i=0;i<5;i++){const ang=progress*5+i*.2-1.7;ellipse(Math.cos(ang)*m.reach*.64,Math.sin(ang)*m.reach*.46,5,5,'#ffcd79')}}
 else if(m.shape==='spin'){arc(m.reach*.55,progress*TAU-.9,progress*TAU+2,14,col);arc(m.reach*.78,-2+progress*TAU,progress*TAU+1,7,'#eed3a6');arc(m.reach*.92,progress*TAU,progress*TAU+2,3,col)}
 else if(m.shape==='scythe'){arc(m.reach*.62,-2.4+progress*1.2,.8+progress*2,13,col);arc(m.reach*.77,-1.7+progress*1.2,.7+progress*2,4,'#eaffea')}
 else if(m.shape==='axes'){arc(m.reach*.58,-1.8+progress*1.8,.5+progress*1.6,11,col);arc(m.reach*.45,-.9+progress*1.9,1.3+progress*1.4,7,'#ffe3bc')}
 else {arc(m.reach*.7,-2.3+progress*.75,.4+progress*1.5,14,col);arc(m.reach*.81,-1.5+progress*.75,.8+progress*1.5,4,'#f7e3c4')}
 g.restore();
}
function drawEnemy(e){
 if(window.ChainfallArt&&window.ChainfallArt.drawEnemy(g,e,ENEMY[e.type],state))return;
 const d=ENEMY[e.type],s=d.scale;groundShadow(e.x,FLOOR+8,s*.75);
 g.save();g.translate(e.x,e.y);g.scale(e.face*s,s);
 const wobble=Math.sin(e.walk)*Math.min(3,Math.abs(e.vx)*3);g.translate(0,wobble);
 if(e.flash>0){g.shadowBlur=22;g.shadowColor='#ffeac6'}
 poly([[-21,-74],[-29,-15],[-7,-27],[14,-17],[27,-77]],e.type==='shade'?'#303347':'#28282b','#63514c',1);
 strokes(-10,-34,-12+Math.sin(e.walk)*4,-3,12,'#343139');strokes(12,-34,14-Math.sin(e.walk)*4,-3,12,'#3f3637');
 poly([[-20,-83],[17,-83],[23,-48],[13,-32],[-16,-32],[-23,-49]],d.color,'#483a3c',2);
 poly([[-10,-77],[8,-77],[10,-57],[-10,-57]],'#2c2e39');
 strokes(-22,-76,-30,-52,12,'#5e5556');strokes(18,-77,30,-53,12,'#534d52');
 if(e.telegraph>0){ellipse(30,-52,13,13,'#db5b41');strokes(28,-52,51,-91,6,'#8d6151')}
 else strokes(29,-51,42,-91,6,'#858086');
 poly([[-15,-103],[13,-103],[20,-93],[13,-80],[-14,-80],[-20,-92]],'#4d4b51','#99745f',2);
 poly([[-19,-101],[-28,-113],[-4,-107],[0,-111],[13,-104],[24,-115],[18,-94]],'#6e6562');
 ellipse(-6,-91,4,2,'#f16e50');ellipse(8,-91,4,2,'#f16e50');
 if(e.type==='warden'){poly([[-20,-111],[-41,-139],[-9,-119],[0,-134],[11,-118],[39,-142],[19,-103]],'#a88c78','#dcb17a',2);strokes(-25,-78,-47,-39,15,'#7e5e56');strokes(24,-78,43,-36,15,'#7e5e56')}
 if(e.telegraph>0){g.globalAlpha=.55+Math.sin(state.t*.4)*.3;g.beginPath();g.arc(0,-62,d.range/s*.73,-1.2,.7);g.strokeStyle='#ff644b';g.lineWidth=4;g.stroke();g.globalAlpha=1}
 g.restore();
 if(e.hp<e.maxHp||e.type==='warden'){const hw=e.type==='warden'?100:30,sy=e.y-120*s;g.fillStyle='#0b0d15ca';g.fillRect(e.x-hw/2,sy,hw,5);g.fillStyle=e.type==='warden'?'#e3a55f':'#bc655c';g.fillRect(e.x-hw/2,sy,hw*clamp(e.hp/e.maxHp,0,1),5);if(e.type==='warden'){g.textAlign='center';g.font='bold 10px Cinzel,serif';g.fillStyle='#efd0a9';g.fillText('THE ASHEN WARDEN',e.x,sy-8)}}
}
function render(){
 g.save();
 g.translate(state.shake?rnd(-state.shake,state.shake):0,state.shake?rnd(-state.shake*.45,state.shake*.45):0);
 drawBackground();
 const sorted=[...enemies.filter(e=>!e.dead||e.deathTimer>0).map(e=>({y:e.y,enemy:e})),{y:hero.y,hero:true}].sort((a,b)=>a.y-b.y);
 sorted.forEach(o=>o.hero?drawHero():drawEnemy(o.enemy));
 for(const p of projectiles){g.fillStyle=grad(p.x,p.y,33,p.color+'bb');g.fillRect(p.x-32,p.y-32,64,64);ellipse(p.x,p.y,p.r,'#fce6b9')}
 for(const s of shocks){g.save();g.globalAlpha=s.life/s.max;g.beginPath();g.ellipse(s.x,s.y,s.r*(1-s.life/s.max),Math.max(10,s.r*.19)*(1-s.life/s.max),0,0,TAU);g.strokeStyle=s.color;g.lineWidth=6*(s.life/s.max)+1;g.stroke();g.restore()}
 for(const p of particles){g.globalAlpha=clamp(p.life/p.max,0,1);ellipse(p.x,p.y,p.size,p.size,p.color)}g.globalAlpha=1;
 for(const t of texts){g.globalAlpha=clamp(t.life/17,0,1);g.fillStyle=t.color;g.textAlign='center';g.font='900 '+t.size+'px Inter,sans-serif';g.shadowColor='#000';g.shadowBlur=8;g.fillText(t.value,t.x,t.y);g.shadowBlur=0}g.globalAlpha=1;
 if(state.flash>0){g.fillStyle='rgba(255,206,149,'+(state.flash*.014)+')';g.fillRect(0,0,W,H)}
 if(hero.hit>0){g.fillStyle='rgba(205,48,48,'+(hero.hit*.006)+')';g.fillRect(0,0,W,H)}
 g.restore();
}
function frame(ts){const dt=lastTime?clamp((ts-lastTime)/16.6667,.05,2.2):1;lastTime=ts;if(state.phase==='playing'){const speed=state.slow>0?.44:1;update(dt*speed);state.slow=Math.max(0,state.slow-dt)}else{state.t+=dt;updateFX(dt)}render();requestAnimationFrame(frame)}
requestAnimationFrame(frame);
// Inputs: pointer capture is bound only to the joystick; buttons are impulse actions.
const stick=$('stick'),nub=$('stickNub');let pointerId=null;
function stickMove(e){if(e.pointerId!==pointerId)return;const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=r.width*.32,mag=Math.hypot(dx,dy);if(mag>max){dx=dx/mag*max;dy=dy/mag*max}stickAxis=Math.abs(dx)<max*.16?0:clamp(dx/max,-1,1);nub.style.left=(50+dx/r.width*100)+'%';nub.style.top=(50+dy/r.height*100)+'%'}
stick.addEventListener('pointerdown',e=>{if(pointerId!==null)return;pointerId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);e.preventDefault()});
stick.addEventListener('pointermove',stickMove);
function stickEnd(e){if(e.pointerId!==pointerId)return;pointerId=null;stickAxis=0;nub.style.left='50%';nub.style.top='50%'}
stick.addEventListener('pointerup',stickEnd);stick.addEventListener('pointercancel',stickEnd);
const actions={light,heavy,special,jump,dodge};
document.querySelectorAll('[data-act]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();setupAudio();actions[b.dataset.act]();b.classList.add('pressed')});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,()=>b.classList.remove('pressed'))});
document.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup',' ','shift'].includes(k))e.preventDefault();
 if(!keys.has(k)){
  if(k==='w'||k==='arrowup'||k===' ')jump();
  else if(k==='j')light();else if(k==='k')heavy();else if(k==='l')special();else if(k==='shift')dodge();
  else if(k==='escape'){if(state.phase==='playing')pause();else if(state.phase==='paused')resume()}
  else if(/^[1-8]$/.test(k))selectWeapon(+k-1);
 }
 keys.add(k);
});document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();stickAxis=0;if(state.phase==='playing')pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='playing')pause()});
$('armoryBtn').addEventListener('click',()=>showArmory('mainMenu'));
$('armoryPause').addEventListener('click',()=>showArmory('pauseOverlay'));
$('armoryDeath').addEventListener('click',()=>showArmory('deathOverlay'));
$('armoryClose').addEventListener('click',closeArmory);
$('armoryAction').addEventListener('click',armoryAction);
$('startGame').addEventListener('click',start);$('retry').addEventListener('click',start);$('pause').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('quit').addEventListener('click',toTitle);$('deathQuit').addEventListener('click',toTitle);
$('howBtn').addEventListener('click',()=>show('howOverlay'));$('closeHow').addEventListener('click',()=>show('mainMenu'));
function updateSound(){$('soundBtn').textContent='SOUND: '+(soundOn?'ON':'OFF')}
$('soundBtn').addEventListener('click',()=>{soundOn=!soundOn;try{localStorage.setItem('chainfall_sound',soundOn?'on':'off')}catch(e){}updateSound();setupAudio()});
$('resetBtn').addEventListener('click',()=>{if(!resetConfirm){resetConfirm=true;$('resetBtn').textContent='TAP AGAIN TO CONFIRM';toast('THIS ERASES WEAPON UNLOCKS',85);return}records={best:0,souls:0};progression={wallet:0,equipped:0,unlocked:[true,false,false,false,false,false,false,false]};resetConfirm=false;$('resetBtn').textContent='RESET RECORD';save();saveProgress();recordsUI();toast('PROGRESS RESET',65)});
updateSound();recordsUI();
if('serviceWorker' in navigator&&location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();