import {batchScenery} from './scene-batch.js?v=realm-balance-1';

// Bounded A*: queries the very same collision predicate used by heroes and mounts.
export function findStreetPath(start, goal, blocked, limit=1800) {
 const step=1, key=(x,z)=>x+','+z, distance=(x,z)=>Math.hypot(start[0]+x-goal[0],start[1]+z-goal[1]);
 const open=[{x:0,z:0,g:0,f:distance(0,0),prev:null}],best=new Map([['0,0',0]]);let count=0;
 while(open.length&&count++<limit){let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;const n=open.splice(bi,1)[0];
  if(distance(n.x,n.z)<1.1){const route=[];for(let p=n;p.prev;p=p.prev)route.push([start[0]+p.x,start[1]+p.z]);return route.reverse()}
  for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){const x=n.x+dx,z=n.z+dz,g=n.g+1,k=key(x,z),wx=start[0]+x,wz=start[1]+z;
   if(Math.abs(x)>70||Math.abs(z)>70||g>=(best.get(k)??Infinity)||blocked(wx,wz,.42)||blocked(wx-dx*.5,wz-dz*.5,.42))continue;
   best.set(k,g);open.push({x,z,g,f:g+distance(x,z),prev:n});
  }
 }
 return null;
}

export function installSettlementLife(api){
 const {THREE,scene,mesh,mat,ground,living,frontier,hero}=api,people=[],districts=[];let tick=0,planner=0;
 const free=(x,z)=>{for(let r=0;r<=6;r++)for(let k=0;k<(r?16:1);k++){const a=k*Math.PI/8,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;if(!api.blocked(px,pz,.65))return[px,pz]}return null};
 function person(id,name,role,x,z,color,route,trade){const spot=free(x,z);if(!spot)return null;const n=living.registerNPC(id,name,role,...spot,color);n.civic=true;n.trade=trade;n.walkSpeed=0;n.route=(route||[spot]).map(p=>free(...p)).filter(Boolean);n.index=0;n.path=[];n.retry=0;n.wait=0;n.weapon.visible=/Guard|Warrior/.test(role);n.cape.material=mat(trade==='merchant'?0x846443:0x3e5267);n.intro=trade?`The trade roads are open. My prices are the same as the village guild's; your equipment can be bought, sold and equipped here.`:`I walk these roads so others can travel safely. Ask me for directions, or speak to our traders for supplies.`;
  n.destination=frontier.settlements.reduce((best,s)=>Math.hypot(s.x-x,s.z-z)<Math.hypot(best.x-x,best.z-z)?s:best,frontier.settlements[0]);people.push(n);return n;
 }
 function stall(root,x,z,forge=false){const y=ground(x,z);api.obstacle(x,z,1.7);frontier.structures.push({x,z,w:3.4,d:2.4,kind:'stall',color:'#b79e6b'});const p=(shape,c,dx,dy,dz,sx,sy,sz)=>mesh(shape,c,x+dx,y+dy,z+dz,sx,sy,sz,root);
  p('box',0x705238,0,.8,0,2.8,.3,1.1);for(const side of [-1,1])p('box',0x5d4731,side*1.5,1.55,0,.15,3.1,.15);
  for(let i=0;i<6;i++)p('box',i%2?0xcfb88a:forge?0x675b53:0x547b71,-1.5+i*.6,3,0,.6,.15,2.4);
  for(let i=0;i<4;i++){p(forge?'box':'orb',forge?0xa3aea8:0xa87742,-.9+i*.6,1.13,0,.22,.25,.22)}
  if(forge){p('box',0x4d514d,0,1.4,-1.8,1.2,2,1);p('cone',mat(0xe9a44b,{emissive:0xc9511d,emissiveIntensity:1.3}),0,1.1,-1.22,.4,.5,.3)}
 }
 const towns=[{id:'home',name:'Wanderer’s Village',x:0,z:64,kind:'village'},...frontier.settlements];
 for(const s of towns){
  if(s.added)api.poi.push({name:s.name,x:s.x,z:s.z});
  const group=new THREE.Group();scene.add(group);districts.push({s,group});
  if(s.id!=='home'){
   for(const [dx,trade,name]of [[7,'merchant','Mara'],[-7,'smith','Torren']]){stall(group,s.x+dx,s.z-6,trade==='smith');person(s.id+'-'+trade,name+' of '+s.name.split(' ')[0],trade==='smith'?'Guild Smith':'Market Trader',s.x+dx,s.z-3,trade==='smith'?0x866149:0x637b80,null,trade)}
   // Stone lanes connect the plaza to homes, rather than leaving grass through the streets.
   for(let z=-17;z<=(s.kind==='city'?49:17);z+=1.3)for(const x of [-1.1,0,1.1])mesh('orb',0xaaa48c,s.x+x,ground(s.x+x,s.z+z)+.04,s.z+z,.61,.06,.65,group);
   for(let x=-14;x<=14;x+=1.3)for(const z of [-.7,.7])mesh('orb',0xaaa48c,s.x+x,ground(s.x+x,s.z+z)+.04,s.z+z,.61,.06,.65,group);
  }
  person(s.id+'-guard','Watchman '+['Aren','Bryn','Cael','Dara'][towns.indexOf(s)%4],'Town Guard',s.x+4,s.z+8,0x617480,[[s.x+4,s.z+8],[s.x+4,s.z-12],[s.x-4,s.z-12],[s.x-4,s.z+12]]);
  person(s.id+'-resident','Edda of '+s.name.split(' ')[0],'Resident',s.x-4,s.z+8,0x80665a,[[s.x-4,s.z+8],[s.x-4,s.z+1],[s.x+4,s.z+1],[s.x+4,s.z+10]]);
  if(s.kind==='city'){
   for(const side of [-1,1])person('capital-watch'+side,side<0?'Captain Vale':'Captain Soren','Castle Guard',s.x+side*25,s.z+27,0x586b86,[[s.x+side*25,s.z+27],[s.x+side*25,s.z-20],[s.x+side*37,s.z-20],[s.x+side*37,s.z+28]]);
   person('capital-artisan','Lysa','Royal Armourer',s.x+14,s.z+27,0x7a6655,null,'merchant');stall(group,s.x+14,s.z+24);
   person('capital-knight','Sir Aldren','Road Warrior',s.x,s.z+27,0x7f8289,[[s.x,s.z+27],[s.x+8,s.z+24],[s.x+8,s.z+9],[s.x,s.z+9]]);
  }
  batchScenery(THREE,group);
 }
 for(const [id,name,points]of [
  ['west','Perrin',[[-430,65],[-430,43],[-430,20],[-430,43]]],
  ['south','Sella',[[-155,130],[-144,116],[-132,99],[-120,84],[-132,64],[-146,38],[-163,38],[-176,38],[-163,38],[-146,38],[-132,64],[-120,84],[-132,99],[-144,116]]]
 ])person('caravan-'+id,name,'Travelling Merchant',...points[0],0x90784d,points,'merchant');
 for(const [id,name,points]of [
  ['west','Kael',[[-440,-120],[-444,-141],[-448,-162],[-444,-141]]],
  ['high','Iria',[[-350,-440],[-331,-446],[-312,-452],[-331,-446]]],
  ['south','Ronan',[[-60,75],[-78,77],[-96,79],[-78,77]]]
 ])person('warrior-'+id,name,'Wandering Warrior',...points[0],0x64746b,points);
 function update(dt){if(api.state!=='playing')return;tick+=dt;let budget=1;const net=api.net(),guest=net?.active&&!net.host;
  for(const d of districts)d.group.visible=hero.root.position.x<200&&Math.hypot(hero.root.position.x-d.s.x,hero.root.position.z-d.s.z)<130;
  // Fair round-robin planning: only one bounded search per frame, never one per villager.
  const offset=planner;for(let i=0;i<people.length;i++){const n=people[(i+offset)%people.length],p=n.root.position; n.walkSpeed=0;
   if(guest){if(n.remote){const d=Math.hypot(n.remote.x-p.x,n.remote.z-p.z);p.x+=(n.remote.x-p.x)*Math.min(1,dt*12);p.z+=(n.remote.z-p.z)*Math.min(1,dt*12);p.y=api.surface(p.x,p.z);n.root.rotation.y=n.remote.yaw;n.walkSpeed=d>.04?n.remote.speed:0}continue}
   n.remote=null;const close=p.distanceTo(hero.root.position)<4||[...(net?.peers?.values()||[])].some(peer=>peer.ch.root.position.distanceTo(p)<4);if(close||n.route.length<2)continue;
   if(n.wait>0){n.wait-=dt;continue}n.retry-=dt;
   if(!n.path.length&&n.retry<=0&&budget){budget--;n.index=(n.index+1)%n.route.length;n.path=findStreetPath([p.x,p.z],n.route[n.index],api.blocked)||[];n.retry=n.path.length?0:3;planner=(people.indexOf(n)+1)%people.length;}
   if(!n.path.length)continue;const target=n.path[0],dx=target[0]-p.x,dz=target[1]-p.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*(n.trade?1.2:1.5));if(d<.08){n.path.shift();if(!n.path.length)n.wait=2;continue}
   const x=p.x+dx/d*step,z=p.z+dz/d*step;if(api.blocked(x,z,.42)){n.path=[];n.retry=.5;continue}p.set(x,api.surface(x,z),z);api.face(n,Math.atan2(dx,dz),dt);n.walkSpeed=step/Math.max(dt,.001);
  }
 }
 function serialize(){return people.map(n=>({id:n.id,x:n.root.position.x,z:n.root.position.z,yaw:n.root.rotation.y,speed:n.walkSpeed}))}
 function receive(rows){if(!Array.isArray(rows)||rows.length>100)return;for(const row of rows){const n=people.find(n=>n.id===row.id);if(n&&['x','z','yaw','speed'].every(k=>Number.isFinite(row[k]))&&row.x>-585&&row.x<180&&row.z>-860&&row.z<180)n.remote=row}}
 return{people,districts,update,serialize,receive};
}
