import {batchScenery} from './scene-batch.js?v=realm-net-sync-1';
// Chapter zero is world progress; absent data means an existing journey, never a reset.
export function installPrologue(api){
 const {THREE,mesh,ground,hero,living,$}=api,root=new THREE.Group();api.scene.add(root);
 const START={x:50,z:151},grave={x:47.8,z:150},gate={x:50,z:118},charter={x:0,z:83};let waking=0,starting=false;
 const data=()=>living.serialize().prologue??={version:1,stage:3,read:false,killed:[]};
 const prop=(s,c,x,y,z,a,b,d,parent=root)=>mesh(s,c,x,y,z,a,b,d,parent);
 for(const side of [-1,1])prop('box',0x555d59,50+side*17,2.1,138,1,4.2,41);
 prop('box',0x555d59,50,2.1,159,35,4.2,1);for(const side of [-1,1])prop('box',0x555d59,50+side*10,2.1,118,14,4.2,1);
 for(let i=0;i<6;i++)for(const side of [-1,1]){const x=50+side*12,z=124+i*5;prop('box',0x6e7671,x,.8,z,1,1.6,.35);prop('box',0x838d7b,x,1.35,z,1.5,.25,.38);prop('box',0x464c43,x,.04,z+1,1.7,.08,2.2);}
 prop('box',0x42382d,50,.17,151,1.4,.34,2.6);for(const side of [-1,1])prop('box',0x6e543c,50+side*.8,.4,151,.15,.8,2.8);
 prop('box',0x7e8272,grave.x,.55,grave.z,1.4,1.1,.6);prop('box',0xc4b798,grave.x,.58,grave.z+.4,.55,.05,.4);
 // Weathered masonry and closer graves frame the playable escape route.
 for(const side of [-1,1])for(let z=120;z<159;z+=4){prop('box',0x747c70,50+side*17,4.25,z,1.3,.22,3.9);prop('box',0x606b60,50+side*16.4,1.4,z,.18,2.8,.55)}
 for(const side of [-1,1])for(const z of [132,140,147]){const x=50+side*6;prop('box',0x737f73,x,.7,z,.95,1.4,.28);prop('box',0x9a9e83,x,1.15,z,1.4,.22,.32);prop('orb',0x716b52,x,.17,z+1,1,.2,1.5)}
 for(const x of [36,40,60,64]){prop('box',0x657366,x,3.9,118,2,.8,1.15);prop('box',0x88927b,x,4.35,118,2.2,.18,1.3)}
 const hinge=new THREE.Group();hinge.position.set(47,0,118);root.add(hinge);for(let i=0;i<9;i++)prop('box',0x434b46,i*.75,1.7,0,.12,3.4,.12,hinge);prop('box',0x71674c,3,1,0,6,.15,.18,hinge);prop('box',0x71674c,3,2.5,0,6,.15,.18,hinge);
 for(const x of [45,55]){prop('cyl',0x655441,x,1.3,119,.12,2.6,.12);prop('cone',api.mat(0xf9b75b,{emissive:0xeb7a2b,emissiveIntensity:.7}),x,2.7,119,.2,.55,.2)}
 prop('box',0x614c37,charter.x,ground(charter.x,charter.z)+1,charter.z,.12,2,.12);prop('box',0xc4ad77,charter.x,ground(charter.x,charter.z)+1.6,charter.z,1.8,.8,.12);
 root.remove(hinge);batchScenery(THREE,root);root.add(hinge);
 // Keep the first three roster slots stable for existing account reward records.
 const graves=[[44,148],[56,141],[38,125],[56,148],[44,141],[62,130],[38,135],[62,140]];
 // Reserve stable enemy IDs; unused reinforcements stay buried and inactive.
 for(let row=0;row<6;row++)for(const x of [36,41,59,64])graves.push([x,123+row*5]);
 const count=()=>8*Math.max(1,Math.min(4,Number(data().partySize)||1));
 const activeFoes=()=>foes.slice(0,count());
 const ribGeometry=new THREE.TorusGeometry(1,.105,4,10);
 function skeleton(e){
  // Reuse the combat rig, not the goblin mesh. Bones, ribs and skull are real geometry.
  e.skeleton=true;e.root.name='Buried vanguard skeleton';
  for(const o of [...e.rig.children])if(![e.head,...e.arms,...e.legs].includes(o))e.rig.remove(o);
  e.head.clear();e.arms.forEach(a=>a.clear());e.legs.forEach(l=>l.clear());
  const bone=0xcac6a6,shade=0xa29e82,dark=0x252b28;
  const m=(s,c,x,y,z,a,b,d,parent=e.rig)=>mesh(s,c,x,y,z,a,b,d,parent);
  e.body=m('cyl',shade,0,1.2,-.04,.065,.65,.065);
  m('orb',bone,0,.87,0,.3,.16,.18);m('box',shade,0,1.5,0,.62,.07,.09);
  for(let row=0;row<4;row++){
   const rib=m('orb',bone,0,1.4-row*.105,.015,.24-row*.018,.16,.16);rib.geometry=ribGeometry;
   // The shared torus lies in XY; turn its plane into a horizontal rib cage.
   rib.rotation.x=Math.PI/2;
  }
  m('orb',bone,0,.01,0,.285,.32,.235,e.head);
  m('box',bone,0,-.2,.08,.35,.11,.24,e.head);
  for(const side of [-1,1]){m('orb',dark,side*.115,.01,.208,.088,.093,.025,e.head);m('orb',0x98b7a0,side*.115,.008,.233,.022,.03,.012,e.head)}
  m('cone',dark,0,-.11,.235,.042,.1,.025,e.head);
  for(let i=-2;i<=2;i++)m('box',shade,i*.047,-.19,.209,.014,.05,.018,e.head);
  for(let i=0;i<2;i++){
   const a=e.arms[i],l=e.legs[i];
   m('orb',bone,0,0,0,.115,.12,.11,a);m('cyl',bone,0,-.21,0,.054,.35,.055,a);
   m('orb',shade,0,-.4,0,.075,.065,.07,a);
   for(const dx of [-.035,.035])m('cyl',bone,dx,-.51,0,.027,.23,.03,a);
   m('box',bone,0,-.65,.015,.12,.11,.075,a);
   for(let f=0;f<3;f++)m('cyl',bone,(f-1)*.036,-.71,.025,.014,.11,.015,a);
   m('cyl',bone,0,-.19,0,.072,.34,.07,l);m('orb',shade,0,-.37,.015,.08,.08,.075,l);
   for(const dx of [-.035,.035])m('cyl',bone,dx,-.55,0,.033,.3,.035,l);
   m('box',bone,0,-.74,.07,.17,.08,.32,l);
  }
  // Batch each rigid limb separately so its joint still animates independently.
  for(const part of [e.head,...e.arms,...e.legs])batchScenery(THREE,part);
  e.arms[1].add(e.weapon);e.weapon.scale.setScalar(.8);
  e.cape=new THREE.Object3D();e.rig.add(e.cape);e.shoulder=[];
 }
 const foes=graves.map(([x,z],i)=>{const e=api.spawnEnemy(x,z,i===2?1:0);e.prologue=i;e.name=i===2?'Veyr · Restless Vanguard':'Risen Vanguard';e.label.firstChild.textContent=e.name;e.respawn=Infinity;skeleton(e);e.buried=true;e.root.visible=false;return e});
 async function beginAmbush(authoritative=false){
  const net=api.getNet?.();
  if(net?.active&&!net.host&&!authoritative){net.graveyardWarning();return;}
  if(data().read||data().stage>=2||starting)return;
  const encounter=data();starting=true;let size=net?.active?net.partySize:1;
  try{if(net?.active&&api.getAccounts?.()?.active)size=await api.getAccounts().graveyardParty()}catch(e){api.toast('The graves remain still: '+e.message);return}finally{starting=false}
  if(data()!==encounter||data().read||data().stage>=2)return;
  data().partySize=size;data().read=true;data().stage=1;
  for(const e of foes){e.dmg=Math.round((e.prologueDamage??e.dmg)*(1+.1*(data().partySize-1)));if(e.prologue<count()&&!data().killed.includes(e.prologue)){e.hp=e.maxHp;e.dead=0;}}
  for(const e of activeFoes())if(e.hp>0){e.rise=-(e.prologue%8)*.28-Math.floor(e.prologue/8)*.65;e.buried=true;e.state='emerging'}
  api.toast('The warning stirs the dead. '+count()+' skeletons rise.');api.save();
 }
 function risePose(e,t){const u=Math.max(0,Math.min(1,t/1.8)),ease=u*u*(3-2*u);e.root.visible=t>=0;e.rig.position.y=-2.35*(1-ease);e.rig.rotation.x=.8*(1-ease);e.arms.forEach((a,i)=>{a.rotation.x=-1.3*(1-ease);a.rotation.z=(i?-.2:.2)*(1-ease)});e.head.rotation.x=-.35*(1-ease)}
 function updateEnemy(e,dt){
  if(e.prologue===undefined)return false;
  if(!e.buried)return false;
  e.label.style.display='none';
  if(e.state!=='emerging'){e.root.visible=false;return true}
  const before=e.rise;e.rise+=dt;risePose(e,e.rise);
  if(before<0&&e.rise>=0||before===0)api.burst?.(e.root.position,0x82745a,8);
  if(e.rise>=1.8){e.buried=false;e.state='chase';e.cooldown=.75;e.rig.position.y=0;e.rig.rotation.x=0}
  return true;
 }

 api.poi.push({name:'The Unmarked Graves',x:50,z:138});api.frontier.structures.push({x:50,z:138,w:35,d:42,color:'#77796c',kind:'graveyard'});
 function restore(saved){
  const old=saved?.living?.prologue;
  living.serialize().prologue=old?{version:2,stage:Math.max(0,Math.min(3,Number(old.stage)||0)),read:!!old.read||Number(old.stage)>=1,killed:Array.isArray(old.killed)?[...new Set(old.killed.filter(i=>Number.isInteger(i)&&i>=0&&i<32))]:[],partySize:Math.max(1,Math.min(4,Math.floor(Number(old.partySize)||1)))}:saved?{version:2,stage:3,read:true,killed:[]}:{version:2,stage:0,read:false,killed:[]};
  for(const e of foes){
   e.prologueDamage=e.dmg;e.rig.position.set(0,0,0);e.dmg=Math.round(e.dmg*(1+.1*((data().partySize||1)-1)));e.rig.rotation.set(0,0,0);e.rise=2;e.buried=false;
   if(e.prologue>=count()){e.hp=0;e.dead=4;e.buried=true;e.state='buried';e.root.visible=false}
   else if(data().stage>=2||data().killed.includes(e.prologue)){e.hp=0;e.dead=4;e.root.visible=false;e.respawn=Infinity}
   else if(!data().read){e.buried=true;e.state='buried';e.root.visible=false}
   else {e.state='chase';e.root.visible=true}
  }
  waking=!saved?2.4:0;hinge.rotation.y=data().stage>=2?-Math.PI/2:0;
 }

 function afterStart(){if(data().stage===0)api.toast('CHAPTER ZERO · THE UNBURIED — Read the warning beside your grave. Your rusty blade is all that remains.');}
 function dialogue(title,text,button,fn){api.modal(title,'<div class="eyebrow">The lone warrior · Chapter zero</div><p>'+text+'</p><button id="story-next" class="primary">'+button+'</button>','story');$('story-next').onclick=()=>{api.closeModal();fn?.();api.save()};}
 function unlockGate(){if(data().read&&activeFoes().every(e=>e.hp<=0))data().stage=Math.max(2,data().stage)}
 function interact(){const p=hero.root.position,near=q=>Math.hypot(p.x-q.x,p.z-q.z)<3;
  if(near(grave)){dialogue('A name scratched away','Cold earth fills your gloves. Your armour bears the mark of the royal vanguard, but every name on the burial ledger has been struck through. Beneath a fallen soldier’s hand you find a warning: “The king ordered us buried before the battle was over. If one of us wakes, follow the lanterns. Bram in Wanderer’s Village will remember.”<br><br>You are alone. Someone made certain of that.','Keep the warning',beginAmbush);return true}
  if(near(gate)&&data().stage<2){if(!data().read){api.toast('Read the fallen soldier’s warning beside your grave.');return true}if(activeFoes().some(e=>e.hp>0)){api.toast('Defeat all '+count()+' risen skeletons to break the gate’s chain.');return true}if(api.getNet?.()?.active&&!api.getNet().host)api.getNet().graveyardGate();else unlockGate();dialogue('The gate gives way','The graveyard’s chain snaps beneath your rusty blade. Beyond the graves, a narrow path runs toward warm lanterns. You remember a crown, a command, and the sound of your own company falling silent. You do not yet remember who betrayed you.<br><br>Find shelter first. Answers can wait until dawn.','Follow the lantern road');return true}
  if(near(charter)){if(data().stage<2){api.toast('Escape the Unmarked Graves first.');return true}data().stage=3;dialogue('A place among the living','Bram recognises the broken crest on your shoulder. “We were told the vanguard deserted. I should have known better.”<br><br>He gives you the old settlement charter. Two abandoned plots south-west of the village are yours to rebuild: a quiet home for one warrior, and a common hearth for companions.<br><br>“Raise a roof. Learn who still stands with you. Then follow the king’s soldiers into the forest.” Your search begins where the village’s troubles end.','Begin Chapter I');return true}return false;
 }
 function hint(){const p=hero.root.position;if(Math.hypot(p.x-grave.x,p.z-grave.z)<3)return 'Read the fallen soldier’s warning';if(data().stage<2&&Math.hypot(p.x-gate.x,p.z-gate.z)<3)return 'Break the graveyard chain';if(data().stage<3&&Math.hypot(p.x-charter.x,p.z-charter.z)<3)return 'Read Bram’s settlement charter';return null}
 function blocked(x,z,r){if(x<31||x>69||z<116||z>161)return false;return Math.abs(x-33)<.5+r&&z>117&&z<160||Math.abs(x-67)<.5+r&&z>117&&z<160||Math.abs(z-159)<.5+r&&x>32&&x<68||Math.abs(z-118)<.5+r&&x>32&&x<68&&(Math.abs(x-50)>3-r||data().stage<2)}
 function update(dt){hinge.rotation.y+=((data().stage>=2?-Math.PI/2:0)-hinge.rotation.y)*Math.min(1,dt*5);root.visible=hero.root.position.distanceTo(root.position.clone().set(50,0,138))<110;if(waking>0&&!api.panel){waking=Math.max(0,waking-dt);hero.rig.rotation.x=-Math.sin(Math.min(1,waking/2.4)*Math.PI/2)*1.05;}}
 function hud(){if(data().stage>=3)return;const defeated=activeFoes().filter(e=>e.hp<=0).length;$('quest-title').textContent='The Unburied';$('objective').textContent=data().stage===0?'Read the warning beside your grave.':data().stage===1?'Defeat the risen skeletons ('+defeated+'/'+count()+'), then break the northern gate.':'Follow the lantern road to Bram’s charter outside the village.';if(hero.root.position.z>117&&hero.root.position.x>32&&hero.root.position.x<68)$('location').textContent='The Unmarked Graves';}
 function onDeath(e){if(e.prologue===undefined)return false;if(!data().killed.includes(e.prologue))data().killed.push(e.prologue);e.respawn=Infinity;api.drop('coin',e.root.position.x,e.root.position.z,e.prologue===2?18:4);api.drop('potion',e.root.position.x+.6,e.root.position.z);return true}
 function journal(){dialogue('The Unburied',data().stage>=3?'You escaped the graves and found Bram. The vanguard did not desert: somebody ordered its burial. Rebuild a foothold near the village, help its people and follow the king’s trail into the forest.':'You woke beneath the vanguard’s broken crest. Read the warning, defeat the '+count()+' risen skeletons, open the northern gate and follow the road to Bram’s charter.', 'Return to the world')}
 function respawn(){if(data().stage>=2)return false;hero.root.position.set(START.x,ground(START.x,START.z),START.z);api.player.hp=api.player.maxHp;return true}
 return {updateEnemy,risePose,restore,afterStart,interact,hint,blocked,update,hud,onDeath,journal,respawn,beginAmbush,unlockGate,get foes(){return activeFoes()},data,start:START};
}
