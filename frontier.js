// Recover older cached HTML before it can pair its obsolete HUD with this module.
// This module must retain this guard while pre-design-system pages remain cached.
if(!document.getElementById('gold-counter')||!document.querySelector('link[href$="ui.css?v=realm-cinematic-20261010-1"]')){
 const fresh=new URL(location.href),release='realm-cinematic-20261010-1';
 if(fresh.searchParams.get('v')!==release){fresh.searchParams.set('v',release);location.replace(fresh.href)}
 else{document.body.textContent='The game update could not load. Reopen the game to retry. Your saved journey is safe.'}
 await new Promise(()=>{}); // Navigation replaces this document; never initialize mixed UI.
}
// The Shattered Marches: world data is also used by terrain, navigation and maps.
export const BOUNDS={left:-330,right:180,top:-340,bottom:180};
export const SETTLEMENTS=[
 {id:'capital',name:'Dawnwatch City',x:-180,z:38,kind:'city',color:0x677e94},
 {id:'mill',name:'Briarfield Village',x:-155,z:135,kind:'village',color:0x9e7450},
 {id:'snow',name:'Frostmere Village',x:-20,z:-235,kind:'village',color:0x687e85},
 {id:'marsh',name:'Reedhaven Village',x:115,z:-125,kind:'village',color:0x648770}
];
export const FAMILIES=[
 {id:'wolf',name:'Greyfang Wolf',boss:'Fenrir · The Moonfang',quest:'Fangs in the wheat',bossQuest:'Silence the Moonfang',giver:'ranger',npc:'Warden Rowan',village:'mill',x:-245,z:118,bx:-286,bz:135,hp:45,bossHp:220,speed:3.8,damage:10,color:0x8b9894,reward:'Moonfang Sabre',power:20},
 {id:'skeleton',name:'Restless Skeleton',boss:'Morvain · The Bone Regent',quest:'Unquiet graves',bossQuest:'The last regent',giver:'priest',npc:'Sister Aveline',village:'capital',x:-255,z:-80,bx:-288,bz:-106,hp:75,bossHp:320,speed:2.4,damage:14,color:0xd6cdb2,reward:'Dawnbreaker',power:27},
 {id:'bandit',name:'Ashroad Brigand',boss:'Captain Rook · The Oathbreaker',quest:'The broken trade road',bossQuest:'An oath in ashes',giver:'marshal',npc:'Marshal Cera',village:'capital',x:-125,z:-140,bx:-159,bz:-158,hp:95,bossHp:380,speed:3,damage:16,color:0xa7624f,reward:'Oathkeeper',power:34},
 {id:'spider',name:'Mirefang Spider',boss:'Silkmaw · Brood Mother',quest:'Silk over the waterways',bossQuest:'The heart of the web',giver:'herbalist',npc:'Herbalist Nessa',village:'marsh',x:113,z:-210,bx:143,bz:-233,hp:110,bossHp:450,speed:3.2,damage:20,color:0x807299,reward:'Silksteel Fang',power:41},
 {id:'elemental',name:'Stormbound Elemental',boss:'Astrax · The Stormheart',quest:'Stones that walk',bossQuest:'Break the stormheart',giver:'sage',npc:'Sage Orin',village:'snow',x:-40,z:-291,bx:-69,bz:-312,hp:155,bossHp:600,speed:2,damage:25,color:0x78bfc8,reward:'Stormheart Edge',power:49}
];
export const ROADS=[
 [[0,64],[-60,75],[-110,80],[-132,64],[-146,38],[-180,38]], [[-110,80],[-155,135],[-245,118],[-286,135]],
 [[-180,38],[-180,9+Math.sin(-180*.052)*7],[-190,-35],[-255,-80],[-288,-106]],
 [[-190,-35],[-125,-140],[-159,-158]], [[-8,-66],[-40,-125],[-125,-140]],
 [[-40,-125],[-20,-235],[-40,-291],[-69,-312]],
 [[28,-23],[95,-65],[115,-125],[113,-210],[143,-233]],
 [[-20,-235],[40,-245],[113,-210]]
];
export function roadDistance(x,z){let best=Infinity;for(const r of ROADS)for(let i=1;i<r.length;i++){const [ax,az]=r[i-1],[bx,bz]=r[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));best=Math.min(best,Math.hypot(x-ax-t*dx,z-az-t*dz))}return best}
export function terrainColor(x,z){return z<-260?0x99adb0:x>75&&z<-150?0x647565:x<-215&&z<-25?0x7d8773:x<-100&&z>85?0x849657:0x3c7750}
export function extraHeight(x,z){const blend=Math.max(0,Math.min(1,(Math.max(Math.abs(x),Math.abs(z))-85)/45));return blend*(3*Math.sin(x*.018)*Math.cos(z*.027)+14*Math.exp(-((x+65)**2+(z+295)**2)/4200))}

export function installFrontier(api){
 const {THREE,scene,mesh,mat,hero,living,items,enemies,$,ground}=api;
 const root=new THREE.Group();scene.add(root);const structures=[],vegetation=[],npcs=[],tells=new Map();let elapsed=0,mapTimer=0,waypoint=null,zoom=42,northUp=false;
 const V=THREE.Vector3;
 function random(n){const v=Math.sin(n*91.317+18.713)*43758.5453;return v-Math.floor(v)}
 function prop(shape,color,x,y,z,sx,sy,sz,parent=root){return mesh(shape,color,x,y,z,sx,sy,sz,parent)}
 function house(x,z,color,large=false){const y=ground(x,z),g=new THREE.Group();g.position.set(x,y,z);root.add(g);const w=large?8:5,d=large?7:4,h=large?5:3;
  prop('box',0xc0b58f,0,h/2,0,w,h,d,g);const gable=new THREE.BufferGeometry();const vertices=[];for(const zz of [-d/2,d/2])vertices.push(-w/2,h,zz,w/2,h,zz,0,h+1.6,zz);gable.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));gable.computeVertexNormals();g.add(new THREE.Mesh(gable,mat(0xc0b58f,{side:THREE.DoubleSide})));prop('box',0x738177,0,.25,0,w+.4,.5,d+.4,g);
  for(const s of [-1,1]){const roof=prop('box',color,s*w*.26,h+.8,0,w*.62,.25,d+1,g);roof.rotation.z=-s*.5;for(const xx of [-w*.45,0,w*.45])prop('box',0x604936,xx,h/2,s*d*.505,.14,h,.14,g);for(const xx of [-w*.3,w*.3])prop('box',mat(0xffd998,{emissive:0x7a481b,emissiveIntensity:.3}),xx,h*.6,s*(d/2+.04),.7,.9,.04,g)}
  prop('box',0x544936,0,1,d/2+.05,1.2,2,.1,g);api.obstacle(x,z,large?5.5:3);structures.push({x,z,w,d,color:'#aaa98e',kind:'house',g});return g;
 }
 function tower(x,z){let y=ground(x,z);prop('cyl',0x85938c,x,y+4,z,2.5,8,2.5);prop('cone',0x556e88,x,y+9.2,z,3,3,3);api.obstacle(x,z,2.7);structures.push({x,z,w:5,d:5,color:'#c0c8b0',kind:'tower'})}
 for(const s of SETTLEMENTS){
  api.poi.push({name:s.name,x:s.x,z:s.z});const city=s.kind==='city';
  const positions=city?[[-19,-15],[-8,-18],[8,-18],[19,-15],[-20,2],[20,2],[-18,18],[18,18]]:[[-9,-8],[9,-8],[-9,8],[9,8]];
  for(const [dx,dz] of positions)house(s.x+dx,s.z+dz,s.color,city&&dz===-18);
  const y=ground(s.x,s.z);prop('cyl',0x9ca98d,s.x,y+.25,s.z,3,.5,3);prop('cyl',0x4cb6b5,s.x,y+.53,s.z,2.3,.12,2.3);prop('cyl',0x94a48b,s.x,y+1.2,s.z,.4,1.7,.4);prop('orb',0xcdb779,s.x,y+2.2,s.z,.6,.6,.6);api.obstacle(s.x,s.z,1.2);
  for(const dx of [-6,6])for(const dz of [-13,13]){prop('cyl',0x6b5742,s.x+dx,ground(s.x+dx,s.z+dz)+1.5,s.z+dz,.1,3,.1);prop('orb',mat(0xffd98c,{emissive:0xffb44c,emissiveIntensity:1}),s.x+dx,ground(s.x+dx,s.z+dz)+3,s.z+dz,.2,.3,.2)}
  if(city){for(const dx of [-30,30])for(const dz of [-29,29])tower(s.x+dx,s.z+dz);for(let i=-24;i<=24;i+=4)for(const side of [-1,1]){if(Math.abs(i)<8)continue;const x=s.x+i,z=s.z+side*29;prop('box',0x89978c,x,ground(x,z)+2,z,4,4,1.6);api.obstacle(x,z,2);structures.push({x,z,w:4,d:1.6,color:'#c3cbb6',kind:'wall'});const xx=s.x+side*30,zz=s.z+i;prop('box',0x89978c,xx,ground(xx,zz)+2,zz,1.6,4,4);api.obstacle(xx,zz,2);structures.push({x:xx,z:zz,w:1.6,d:4,color:'#c3cbb6',kind:'wall'})}house(s.x+13,s.z-38,0x526d8a,true)}
  if(s.id==='mill'){const x=s.x+19,z=s.z+14;prop('cyl',0xb7ad88,x,ground(x,z)+3,z,1.7,6,1.7);const hub=new THREE.Group();hub.position.set(x,ground(x,z)+5,z+1.8);root.add(hub);for(let i=0;i<4;i++){const sail=prop('box',0xe5d8b0,0,0,0,.55,7,.12,hub);sail.rotation.z=i*Math.PI/2}structures.push({x,z,w:4,d:4,color:'#d8cb9c',kind:'mill',hub})}
 }
 // Five distinct quest givers; city streets and village squares stay clear.
 FAMILIES.forEach((f,i)=>{const s=SETTLEMENTS.find(s=>s.id===f.village),x=s.x+(i===2?5:-5),z=s.z+4;const n=living.registerNPC(f.giver,f.npc,'Frontier Warden',x,z,f.color);n.intro=`The roads to ${f.boss.split(' · ')[0]}'s territory are no longer safe. Help us reclaim them.`;npcs.push(n);
  const id='frontier_'+f.id;items[id]={name:f.reward,type:'weapon',rarity:i<2?2:i<4?3:4,damage:f.power,color:f.color,icon:'⚔',desc:'A trophy blade won from '+f.boss+'.',base:id,upgrade:0};for(let rank=1;rank<=3;rank++)items[id+'~'+rank]={...items[id],name:f.reward+' +'+rank,damage:f.power+rank*4,upgrade:rank};items['trophy_'+f.id]={name:['Greyfang Pelt','Runed Bone','Ashroad Insignia','Mire Silk','Storm Shard'][i],type:'material',rarity:i<2?1:2,icon:'◆',desc:'A trophy from the '+f.name+'.'};
  living.questDefinitions.push({id:'hunt_'+f.id,name:f.quest,kind:'Side',giver:f.giver,enemyFamily:f.id,description:`Defeat four ${f.name}s in their territory, then return to ${f.npc}.`,goal:4,gold:90+i*45,xp:80+i*35,target:[f.x,f.z]},{id:'boss_'+f.id,name:f.bossQuest,kind:'Main',giver:f.giver,bossFamily:f.id,description:`Defeat ${f.boss} and report to ${f.npc}. A unique weapon awaits in the boss's loot.`,goal:1,gold:160+i*60,xp:140+i*60,target:[f.bx,f.bz]});
  api.poi.push({name:f.boss.split(' · ')[0]+'’s Domain',x:f.bx,z:f.bz});
  for(let k=0;k<5;k++){const a=k*2.399,x=f.x+Math.sin(a)*9,z=f.z+Math.cos(a)*9;spawn(f,x,z,false)}spawn(f,f.bx,f.bz,true);
  for(let k=0;k<8;k++){const a=k*Math.PI/4,x=f.x+Math.cos(a)*15,z=f.z+Math.sin(a)*15,y=ground(x,z);
   if(f.id==='skeleton'){prop('box',0x929b8c,x,y+.65,z,.8,1.3,.22);prop('box',0x626e64,x,y+.95,z+.13,.5,.09,.04);prop('box',0x626e64,x,y+.95,z+.13,.08,.5,.04)}
   if(f.id==='bandit'&&k%2===0){const tent=prop('cone',0x8d5840,x,y+1.2,z,2.4,2.7,2.4);api.obstacle(x,z,1.6);prop('box',0x6f5138,x+2,y+.4,z,1,.8,1);structures.push({x,z,w:4,d:4,color:'#ad7656',kind:'tent'})}
   if(f.id==='elemental'){prop('cone',mat(0x8ad8d9,{emissive:0x316475,emissiveIntensity:.7}),x,y+1.5,z,.8,3,.8).rotation.z=Math.sin(k)*.25;api.obstacle(x,z,.7)}
   if(f.id==='spider'&&k%2===0){for(let j=0;j<5;j++){const strand=prop('cyl',0xa8b7ab,x,y+2,z,.025,4,.025);strand.rotation.z=j*Math.PI/5}prop('orb',0xabb8a7,x,y+.4,z,.65,.7,.6)}
   if(f.id==='wolf'){prop('cyl',0x715c41,x,y+.4,z,.4,3,.4).rotation.z=Math.PI/2;prop('cone',0xd2c6a6,x+1,y+.2,z,.12,.6,.12)}
  }
  for(let k=0;k<7;k++){const a=k/7*Math.PI*2,x=f.bx+Math.cos(a)*10,z=f.bz+Math.sin(a)*10;prop(f.id==='elemental'?'cone':'orb',f.id==='elemental'?0x82bcc0:0x718279,x,ground(x,z)+1.5,z,1.2,3,1.2);api.obstacle(x,z,1)}
 });
 // Spatially grouped instancing permits view-distance culling of a much larger forest.
 const chunks=new Map();for(let i=0;i<3400;i++){const x=BOUNDS.left+random(i*3)*510,z=BOUNDS.top+random(i*3+1)*520;if(Math.abs(x)<97&&Math.abs(z)<102||api.pathDist(x,z)<5||Math.abs(z-api.riverZ(x))<9||SETTLEMENTS.some(s=>Math.hypot(x-s.x,z-s.z)<(s.kind==='city'?48:23))||FAMILIES.some(f=>Math.hypot(x-f.x,z-f.z)<18||Math.hypot(x-f.bx,z-f.bz)<15))continue;
  const key=Math.floor(x/48)+','+Math.floor(z/48);if(!chunks.has(key))chunks.set(key,{x:Math.floor(x/48)*48+24,z:Math.floor(z/48)*48+24,trunk:[],leaf:[],rock:[]});const chunk=chunks.get(key),y=ground(x,z),h=4+random(i*3+2)*4;
  if(z<-263||random(i+8000)>.8){chunk.rock.push([x,y+.7,z,1,.9,1.2]);vegetation.push({x,z,rock:true})}else{chunk.trunk.push([x,y+h*.35,z,.22,h*.7,.22]);for(let j=0;j<3;j++)chunk.leaf.push([x,y+h*(.45+j*.23),z,2.15-j*.43,h*.52,2.15-j*.43]);api.obstacle(x,z,.5);vegetation.push({x,z})}
 }
 const chunkMeshes=[];for(const c of chunks.values())for(const [shape,color,list] of [['cyl',0x65503b,c.trunk],['cone',c.z<-230?0x527d75:0x37724d,c.leaf],['orb',0x82978e,c.rock]]){if(!list.length)continue;const m=api.instance(shape,color,list);root.add(m);chunkMeshes.push({m,x:c.x,z:c.z})}
 // Populate enemy families with articulated bodies, not recoloured goblins.
 function creature(f,boss){
  if(f.id==='bandit'||f.id==='skeleton'){const ch=api.character(false);ch.bodyMat.color.setHex(f.color);ch.cape.material=mat(f.id==='bandit'?0x6a3433:0x433d56);ch.scale=boss?1.55:1;ch.root.scale.setScalar(ch.scale);
   if(f.id==='skeleton'){ch.head.children.forEach(m=>{m.material=mat(0xd9d1b9)});for(const side of [-1,1])prop('box',0x242c2a,side*.12,.02,.29,.13,.14,.06,ch.head);for(let j=0;j<5;j++)prop('box',0xd9d1b9,0,1.02+j*.1,.29,.55,.055,.07,ch.rig);ch.bodyMat.color.setHex(0x514f47)}else{prop('box',0x433b35,0,-.1,.26,.5,.2,.06,ch.head);prop('cone',0x773f39,0,.25,0,.4,.45,.35,ch.head)}
   if(boss)for(let k=0;k<5;k++)prop('cone',0xe3bf67,(k-2)*.11,.44,0,.06,.23,.06,ch.head);return ch;
  }
  const g=new THREE.Group(),rig=new THREE.Group();g.add(rig);scene.add(g);const bodyMat=mat(f.color).clone(),bladeMat=mat(0xebead4).clone(),legs=[],arms=[],head=new THREE.Group();rig.add(head);let body;
  if(f.id==='wolf'){body=prop('orb',bodyMat,0,.9,0,.48,.56,.86,rig);head.position.set(0,1.12,.72);prop('orb',bodyMat,0,0,0,.35,.35,.45,head);prop('orb',0x5c6969,0,-.12,.38,.22,.18,.34,head);for(const side of [-1,1]){prop('cone',f.color,side*.24,.35,-.02,.15,.45,.14,head);prop('orb',0xf4d26d,side*.26,.06,.23,.045,.06,.045,head);prop('cone',0xf2e5c6,side*.13,-.27,.45,.055,.22,.06,head).rotation.z=Math.PI}for(const x of [-.32,.32])for(const z of [-.56,.5]){const leg=new THREE.Group();leg.position.set(x,.8,z);rig.add(leg);prop('cyl',f.color,0,-.34,0,.12,.68,.12,leg);prop('orb',0x596561,0,-.65,.08,.17,.12,.23,leg);legs.push(leg)}prop('cone',f.color,0,1.05,-1,.15,.9,.15,rig).rotation.x=-1.1;
  }else if(f.id==='spider'){body=prop('orb',bodyMat,0,.9,-.2,.7,.55,.8,rig);prop('orb',0x463b57,0,.8,.6,.45,.4,.5,rig);for(let side of [-1,1]){for(let k=0;k<4;k++){const leg=new THREE.Group();leg.position.set(side*.4,.8,-.6+k*.36);leg.rotation.y=(k-1.5)*.25;rig.add(leg);const upper=prop('cyl',f.color,side*.5,.15,0,.065,1.1,.065,leg);upper.rotation.z=-side*1.25;const lower=prop('cyl',0x53445f,side*.95,-.23,0,.055,.9,.055,leg);lower.rotation.z=side*.4;legs.push(leg)}for(let k=0;k<2;k++)prop('orb',mat(0xff9263,{emissive:0xad3227,emissiveIntensity:1}),side*(.12+k*.15),.87,1,.065,.07,.065,rig);prop('cone',0xc6c4a8,side*.2,.5,1,.08,.45,.07,rig).rotation.x=-.6}
  }else{body=prop('orb',bodyMat,0,1.4,0,.7,.9,.5,rig);prop('cone',mat(0x9fe4df,{emissive:0x4a9cce,emissiveIntensity:1}),0,1.6,.43,.3,.9,.25,rig);prop('orb',0x729699,0,2.5,0,.42,.4,.36,rig);for(let side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.85,1.9,0);rig.add(arm);prop('orb',f.color,0,-.35,0,.32,.65,.3,arm);prop('orb',0x577a82,0,-.85,.1,.4,.4,.4,arm);arms.push(arm);prop('cone',f.color,side*.7,2.7,-.1,.23,.9,.24,rig).rotation.z=-side*.4}}
  const weapon=new THREE.Group();rig.add(weapon);const cape=new THREE.Group();rig.add(cape);const scale=boss?(f.id==='spider'?2:1.7):1;g.scale.setScalar(scale);return{root:g,rig,head,body,legs,arms,weapon,cape,bodyMat,bladeMat,shoulder:[],scale,phase:0};
 }
 function spawn(f,x,z,boss){const e=api.spawnEnemy(x,z,0),old=e.root;scene.remove(old);e.bodyMat.dispose();e.bladeMat.dispose();Object.assign(e,creature(f,boss),{family:f.id,spec:f,type:4+FAMILIES.indexOf(f),isBoss:boss,name:boss?f.boss:f.name,maxHp:boss?f.bossHp:f.hp,hp:boss?f.bossHp:f.hp,speed:f.speed,dmg:boss?f.damage*1.5:f.damage,xp:boss?160+FAMILIES.indexOf(f)*70:25+FAMILIES.indexOf(f)*12});e.root.position.set(x,ground(x,z),z);e.label.firstChild.textContent=e.name;
  const ring=new THREE.Mesh(new THREE.RingGeometry(.92,1,32),mat(f.color,{transparent:true,opacity:.55,side:THREE.DoubleSide,emissive:f.color,emissiveIntensity:.4}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);tells.set(e,ring);return e;
 }
 function animate(e,speed,dt,attack,dying){if(!e.family||['bandit','skeleton'].includes(e.family))return false;e.phase+=dt*(speed>0?11:2);e.rig.position.y=Math.sin(e.phase)*.035+(e.family==='elemental'?.15+Math.sin(elapsed*2)*.12:0);e.rig.rotation.set(dying?-Math.min(1.5,dying*2):-(e.recoil||0),0,0);e.legs.forEach((l,i)=>{if(e.family==='wolf')l.rotation.x=Math.sin(e.phase+(i%2)*Math.PI)*Math.min(.65,speed*.2);else l.rotation.z=Math.sin(e.phase+i*1.3)*Math.min(.18,speed*.06)});e.arms.forEach((a,i)=>a.rotation.x=attack?-Math.sin(attack.t/attack.duration*Math.PI)*1.9:Math.sin(e.phase+i)*.1);if(attack&&e.family!=='elemental')e.rig.rotation.x=-Math.sin(attack.t/attack.duration*Math.PI)*.25;if(dying)e.rig.position.y=-Math.min(.5,dying*.3);return true}
 function tell(e){const ring=tells.get(e);if(!ring)return;const a=e.attack,show=e.hp>0&&e.state==='attack'&&a&&a.t/a.duration<.68;ring.visible=!!show&&hero.root.position.x<200&&e.root.position.distanceTo(hero.root.position)<55;if(!show)return;const ranged=e.family==='elemental'&&a.combo===0,x=ranged?a.tx:e.root.position.x,z=ranged?a.tz:e.root.position.z;ring.position.set(x,ground(x,z)+.08,z);ring.scale.setScalar(a.range||3);ring.material.opacity=.2+.6*a.t/a.duration}
 function updateEnemy(e,dt,target){if(!e.family)return false;const p=e.root.position,d=p.distanceTo(target.root.position);if(e.stagger>0)return false; // common stagger/death handling runs first
  if(e.state==='attack'){const a=e.attack;a.t+=dt;const t=a.t/a.duration;if(t<.35)api.face(e,Math.atan2(target.root.position.x-p.x,target.root.position.z-p.z),dt);
   if(a.combo===1&&t>.35&&t<.65){const dx=target.root.position.x-p.x,dz=target.root.position.z-p.z,l=Math.hypot(dx,dz),step=Math.min(dt*(e.family==='wolf'?12:8),Math.max(0,l-1));if(l>.01)api.move(e,dx/l*step,dz/l*step)}
   if(t>.68&&!e.hit){e.hit=true;const tx=e.family==='elemental'&&a.combo===0?a.tx:p.x,tz=e.family==='elemental'&&a.combo===0?a.tz:p.z;const delta=target.root.position.clone().sub(new V(tx,ground(tx,tz),tz));if(delta.length()<a.range&&(a.combo===2||e.family==='elemental'||Math.cos(Math.atan2(delta.x,delta.z)-e.root.rotation.y)>-.1))api.hurtPlayer(e.dmg*(a.combo===2?1.25:1),new V(tx,ground(tx,tz),tz),target.netId);api.burst(new V(tx,ground(tx,tz),tz),e.spec.color,e.isBoss?20:8);api.sound(a.combo===2?'heavyHit':'hit')}
   tell(e);api.animate(e,0,dt,a);if(t>=1){e.state='chase';e.cooldown=e.isBoss?1.2:1.6;tells.get(e).visible=false}return true;
  }
  const away=Math.hypot(p.x-e.home.x,p.z-e.home.z);let speed=0;
  if(away>27||(e.state==='return'&&away>1)){e.state='return';const dx=e.home.x-p.x,dz=e.home.z-p.z;speed=e.speed;api.move(e,dx/away*speed*dt,dz/away*speed*dt);api.face(e,Math.atan2(dx,dz),dt)}
  else if(d<(e.isBoss?17:13)||e.state==='chase'&&d<22){e.state='chase';const range=e.family==='elemental'?8:1.5+e.scale*.55;api.face(e,Math.atan2(target.root.position.x-p.x,target.root.position.z-p.z),dt);if(d>range){speed=e.speed;api.move(e,(target.root.position.x-p.x)/d*speed*dt,(target.root.position.z-p.z)/d*speed*dt)}else if(e.cooldown<=0){e.pattern++;const combo=e.isBoss?e.pattern%3:e.family==='wolf'||e.family==='spider'?1:e.family==='elemental'?0:0;e.attack={t:0,duration:combo===2?1.35:combo===1?1.05:.9,combo,range:combo===2?4.5:2.1+e.scale*.65,tx:target.root.position.x,tz:target.root.position.z};e.state='attack';e.hit=false;api.sound('heavy')}}
  else{e.state='patrol';const dx=e.home.x+Math.sin(e.timer*.5)*3-p.x,dz=e.home.z+Math.cos(e.timer*.5)*3-p.z,l=Math.hypot(dx,dz);if(l>.2){speed=e.speed*.3;api.move(e,dx/l*speed*dt,dz/l*speed*dt);api.face(e,Math.atan2(dx,dz),dt)}}api.animate(e,speed,dt);return true;
 }
 function onDeath(e){if(!e.family)return false;const p=e.root.position;api.drop('coin',p.x,p.z,e.isBoss?100+e.type*12:8+e.type*2);api.drop('trophy_'+e.family,p.x+.5,p.z);api.drop(e.isBoss?'frontier_'+e.family:'potion',p.x-.5,p.z);tells.get(e).visible=false;if(e.isBoss){api.sound('victory');api.toast('Victory · '+e.name)}return true}
 function restoreBosses(){for(const e of enemies)if(e.isBoss&&living.serialize().frontierBosses?.includes(e.family)){e.hp=0;e.dead=4;e.state='death';e.root.visible=false}for(const r of tells.values())r.visible=false;waypoint=null}
 function nearestRest(){return SETTLEMENTS.find(s=>Math.hypot(hero.root.position.x-s.x,hero.root.position.z-s.z)<4)}
 function interact(){const s=nearestRest();if(!s)return false;api.player.hp=api.player.maxHp;api.player.stamina=100;api.toast('Rested at '+s.name);api.sound('level');api.save();return true}
 const box=document.createElement('div');box.id='frontier-mini';box.innerHTML='<canvas width="240" height="240" aria-label="Detailed local minimap"></canvas><small id="map-bearing">N · The Shattered Marches</small><div class="mini-controls"><button id="mini-out" aria-label="Zoom out">−</button><button id="mini-map">Map</button><button id="mini-in" aria-label="Zoom in">+</button><button id="mini-north" aria-label="Toggle north up">N</button></div>';$('hud').append(box);const mini=box.querySelector('canvas');$('mini-out').onclick=()=>zoom=Math.min(100,zoom+12);$('mini-in').onclick=()=>zoom=Math.max(18,zoom-12);$('mini-map').onclick=worldMap;$('mini-north').onclick=()=>{northUp=!northUp;$('mini-north').classList.toggle('north-up',northUp)};mini.onclick=worldMap;
 const atlas=document.createElement('canvas');atlas.width=atlas.height=900;const ac=atlas.getContext('2d'),sx=900/510,sz=900/520;const mx=x=>(x-BOUNDS.left)*sx,mz=z=>(z-BOUNDS.top)*sz;
 for(let y=0;y<900;y+=3)for(let x=0;x<900;x+=3){const wx=x/sx+BOUNDS.left,wz=y/sz+BOUNDS.top,c=new THREE.Color(terrainColor(wx,wz)),slope=ground(wx+2,wz)-ground(wx-2,wz);c.multiplyScalar(Math.max(.65,Math.min(1.2,1-slope*.1)));ac.fillStyle='#'+c.getHexString();ac.fillRect(x,y,3,3)}
 for(let y=0;y<900;y+=3)for(let x=0;x<900;x+=3){const wx=x/sx+BOUNDS.left,wz=y/sz+BOUNDS.top;if(wz<-100&&Math.floor(ground(wx,wz)/3)!==Math.floor(ground(wx+3/sx,wz+3/sz)/3)){ac.fillStyle='#314d492b';ac.fillRect(x,y,3,1)}}
 function line(points,color,width){ac.beginPath();points.forEach(([x,z],i)=>i?ac.lineTo(mx(x),mz(z)):ac.moveTo(mx(x),mz(z)));ac.strokeStyle=color;ac.lineWidth=width;ac.stroke()}
 line(Array.from({length:256},(_,i)=>{const x=BOUNDS.left+i*2;return[x,api.riverZ(x)]}),'#65bfc1',13);
 for(const r of [...ROADS,[[0,64],[-23,36],[-14,18],[-14,-4],[28,-23],[11,-43],[-8,-66]],[[-23,36],[-46,38]]])line(r,'#c2b17c',5);
 for(const x of [-180,-14,35])line([[x,api.riverZ(x)-6],[x,api.riverZ(x)+6]],'#73583a',7);
 for(const v of vegetation){ac.fillStyle=v.rock?'#a3ada0':'#284f3bc0';ac.beginPath();ac.arc(mx(v.x),mz(v.z),v.rock?1.7:2.2,0,Math.PI*2);ac.fill()}
 for(const o of api.obstacles){if(Math.abs(o.x)<97&&Math.abs(o.z)<102){ac.fillStyle='#31573dcc';ac.fillRect(mx(o.x)-1,mz(o.z)-1,2,3)}}
 for(const b of [...structures,...living.buildings.map(b=>({x:b.x,z:b.z,w:6,d:5,color:'#c8b895'}))]){if(!Number.isFinite(b.x))continue;ac.fillStyle=b.color;ac.fillRect(mx(b.x)-b.w*sx/2,mz(b.z)-b.d*sz/2,b.w*sx,b.d*sz);ac.strokeStyle='#4e5344';ac.strokeRect(mx(b.x)-b.w*sx/2,mz(b.z)-b.d*sz/2,b.w*sx,b.d*sz)}
 function questTarget(){const d=living.serialize(),q=living.questDefinitions.find(q=>q.id===d.tracked&&d.quests[q.id]?.status==='active');if(!q)return null;if(living.progress(q)>=q.goal){const n=living.npcs.find(n=>n.id===q.giver);return[n.root.position.x,n.root.position.z]}return q.target}
 function paint(canvas,full=false){const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,p=hero.root.position,cave=p.x>200;let project;
  c.clearRect(0,0,w,h);c.fillStyle='#172e2c';c.fillRect(0,0,w,h);c.save();
  if(cave){const scale=full?Math.min(w/36,h/80):w/(zoom*1.4),cx=full?302:p.x,cz=full?-27:p.z;project=(x,z)=>[w/2+(x-cx)*scale,h/2+(z-cz)*scale];for(const [l,r,t,b] of [[296,304,-34,8],[300,316,-24,-14],[288,312,-62,-32]]){const [x,y]=project(l,t);c.fillStyle='#777f76';c.fillRect(x,y,(r-l)*scale,(b-t)*scale);c.strokeStyle='#b1b5a2';c.strokeRect(x,y,(r-l)*scale,(b-t)*scale)}const [gx,gy]=project(296,-32);c.fillStyle=living.serialize().gateOpen?'#8ab788':'#cf965d';c.fillRect(gx,gy,8*scale,2);const [px,py]=project(306,-53);c.fillStyle='#398b9f';c.fillRect(px,py,6*scale,10*scale);for(const [x,z] of [[313,-21],[290,-59],[300,6]]){const [tx,ty]=project(x,z);c.fillStyle='#e3bd78';c.fillRect(tx-2,ty-2,4,4)}for(let i=0;i<28;i++){const [x,y]=project(i%2?289:311,-35-(i%14)*1.8);c.fillStyle=i%3?'#8be0cd':'#b098e1';c.fillRect(x-1,y-1,2,2)}}
  else if(full){c.drawImage(atlas,0,0,w,h);project=(x,z)=>[mx(x)/900*w,mz(z)/900*h]}
  else{const a=northUp?0:-(api.getYaw()||0),scale=w/(zoom*2),co=Math.cos(a),si=Math.sin(a);project=(x,z)=>{const dx=x-p.x,dz=z-p.z;return[w/2+(dx*co-dz*si)*scale,h/2+(dx*si+dz*co)*scale]};c.translate(w/2,h/2);c.rotate(a);c.scale(scale,scale);c.drawImage(atlas,BOUNDS.left-p.x,BOUNDS.top-p.z,510,520);c.setTransform(1,0,0,1,0,0)}
  function dot(x,z,color,r=3,label){if((x>200)!==cave)return;const [xx,yy]=project(x,z);c.fillStyle=color;c.beginPath();c.arc(xx,yy,r,0,Math.PI*2);c.fill();if(label){c.font='18px sans-serif';c.textAlign='center';c.lineWidth=3;c.strokeStyle='#18352c';c.strokeText(label,xx,yy-8);c.fillStyle='#f4e4bf';c.fillText(label,xx,yy-8)}}
  if(!cave){api.poi.forEach((v,i)=>dot(v.x,v.z,api.visited.includes(i)?'#efd195':'#a2b8a4',full?4:3,full?v.name:null));dot(-46,36,'#bd9ddb',4,full?'Hollowroot Cave':null)}
  for(const n of living.npcs)dot(n.root.position.x,n.root.position.z,'#8bded8',3);
  for(const e of enemies)if(e.hp>0&&(full||e.root.position.distanceTo(p)<zoom*1.5))dot(e.root.position.x,e.root.position.z,e.isBoss||e.type===3?'#ffad76':'#e06d64',e.isBoss?5:2.5);
  for(const l of api.loot)dot(l.g.position.x,l.g.position.z,'#ffdc67',2);
  for(const peer of api.getNet()?.peers?.values()||[]){const q=peer.ch.root.position;dot(q.x,q.z,'#88c9ff',4)}
  const q=questTarget();if(q)dot(q[0],q[1],'#ffed96',5);if(waypoint)dot(waypoint[0],waypoint[1],'#f699e7',5,full?'Waypoint':null);
  const [hx,hy]=project(p.x,p.z),angle=hero.root.rotation.y+(full||northUp||cave?0:-(api.getYaw()||0));c.translate(hx,hy);c.rotate(-angle);c.fillStyle='#fff9da';c.strokeStyle='#273a32';c.beginPath();c.moveTo(0,8);c.lineTo(-5,-5);c.lineTo(5,-5);c.closePath();c.fill();c.stroke();c.restore();
 }
 function worldMap(){api.modal(hero.root.position.x>200?'Hollowroot Cave':'The Shattered Marches','<p class="map-note">North ↑ · Click the map to place a waypoint. Gold: quests and landmarks · Red: enemies · Blue: party · Teal: villagers.</p><canvas id="frontier-atlas" class="atlas world-map" width="900" height="900" aria-label="Detailed world map"></canvas><button id="clear-waypoint">Clear waypoint</button> <button id="atlas-journal">Quest journal</button>','map');const c=$('frontier-atlas');paint(c,true);c.onclick=e=>{const r=c.getBoundingClientRect();if(hero.root.position.x>200)return;waypoint=[BOUNDS.left+(e.clientX-r.left)/r.width*510,BOUNDS.top+(e.clientY-r.top)/r.height*520];paint(c,true);api.toast('Waypoint placed')};$('clear-waypoint').onclick=()=>{waypoint=null;paint(c,true)};$('atlas-journal').onclick=living.journal}
 function update(dt){elapsed+=dt;root.visible=hero.root.position.x<200;for(const c of chunkMeshes)c.m.visible=Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z)<(api.settings.quality==='low'?85:130);for(const s of structures)if(s.hub)s.hub.rotation.z=elapsed*.4;for(const e of tells.keys())tell(e);mapTimer+=dt;if(mapTimer>.15){mapTimer=0;const northAngle=northUp?0:-(api.getYaw()||0);box.style.setProperty('--north-x',50+Math.sin(northAngle)*50);box.style.setProperty('--north-y',50-Math.cos(northAngle)*50);$('mini-north').setAttribute('aria-pressed',String(northUp));paint(mini);if($('frontier-atlas'))paint($('frontier-atlas'),true);$('map-bearing').textContent=hero.root.position.x>200?'Hollowroot Cave':waypoint?'◆ '+Math.round(Math.hypot(waypoint[0]-hero.root.position.x,waypoint[1]-hero.root.position.z))+'m · waypoint':northUp?'N ↑ · North up':'N · Camera follows'}}
 return{update,animate,updateEnemy,onDeath,restoreBosses,interact,tell,worldMap,structures,settlements:SETTLEMENTS,families:FAMILIES,mini,atlas,get waypoint(){return waypoint},hint(){return nearestRest()?'Rest at the village fountain':''}};
}
