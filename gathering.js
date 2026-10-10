import {MATERIALS,RECIPES,workshopData,packFor,nodeSpec,station,stockOf,shelterReady} from './gathering-rules.js?v=realm-living-landscape-1';
import {batchScenery} from './scene-batch.js?v=realm-living-landscape-1';
export function installGathering(api){
 const {THREE,hero,mesh,homestead:h,$}=api,nodes=[],stations=[],tools=new Map();let job=null,tab='craft',menuVersion='',menuTimer=0;
 const near=(p,r=3.6)=>Math.hypot(hero.root.position.x-p.x,hero.root.position.z-p.z)<r;
 for(const k of ['home','coop']){
  const bench=station(k),chest=station(k,'chest'),root=new THREE.Group();api.scene.add(root);
  const box=(c,x,y,z,w,a,d)=>mesh('box',c,x,y,z,w,a,d,root);
  const by=api.ground(bench.x,bench.z),cy=api.ground(chest.x,chest.z);
  box(0x9c7b51,bench.x,by+1,bench.z,2.8,.2,1.5);
  for(const dx of [-1.1,1.1])for(const dz of [-.5,.5])box(0x574634,bench.x+dx,by+.5,bench.z+dz,.16,1,.16);
  box(0x566768,bench.x+.7,by+1.2,bench.z,.65,.25,.45);box(0xbeab7e,bench.x-.5,by+1.13,bench.z,.7,.07,.8);
  box(0x805435,chest.x,cy+.45,chest.z,1.8,.9,1.1);box(0x9a7950,chest.x,cy+.94,chest.z,1.9,.16,1.16);
  for(const dx of [-.65,.65])box(0xb29a61,chest.x+dx,cy+.5,chest.z,.1,1.04,1.19);
  box(0xd3b773,chest.x,cy+.6,chest.z+.6,.2,.3,.08);batchScenery(THREE,root);stations.push({k,bench,chest,root});
  for(let i=0;i<8;i++){
   const spec=nodeSpec(k,i),g=new THREE.Group(),body=new THREE.Group(),stump=new THREE.Group(),cracks=new THREE.Group();g.position.set(spec.x,api.ground(spec.x,spec.z),spec.z);api.scene.add(g);g.add(body,stump,cracks);
   const m=(shape,c,x,y,z,w,a,d,parent=body)=>mesh(shape,c,x,y,z,w,a,d,parent);
   if(spec.type==='tree'){m('cyl',0x775237,0,1.8,0,.3,3.6,.3);for(let j=0;j<3;j++)m('cone',[0x285a42,0x39724b,0x4b8653][j],0,2.8+j*.9,0,1.5-j*.28,2.4,1.5-j*.28);m('box',0xd7b66d,0,1.2,.31,.16,.24,.035);m('cyl',0x694e37,0,.22,0,.35,.44,.35,stump);m('cyl',0xb29568,0,.45,0,.29,.02,.29,stump)}
   else{m('orb',spec.type==='ore'?0x607075:0x899389,0,.75,0,1.15,1,.95);m('orb',0x69746b,.6,.35,.45,.55,.5,.55);for(let j=0;j<4;j++)m('box',spec.type==='ore'?0xa0bcb8:0xc0b89b,-.65+j*.4,.8+Math.sin(j)*.35,.65,.1,.15,.12);for(let j=0;j<4;j++)m('orb',0x7c827b,Math.sin(j*2)*.7,.16,Math.cos(j*2)*.7,.3,.2,.3,stump)}
   for(let j=0;j<2;j++){const cut=m('box',0x2b332b,(j-.5)*.2,1,.32,.05,.5,.05,cracks);cut.rotation.z=j?.5:-.4}
   batchScenery(THREE,body);batchScenery(THREE,stump);nodes.push({...spec,k,g,body,stump,cracks});
  }
 }
 function toolFor(ch,kind){
  let entry=tools.get(ch);if(!entry){entry={};tools.set(ch,entry)}
  if(!entry[kind]){const g=new THREE.Group();g.position.copy(ch.weapon.position);g.rotation.copy(ch.weapon.rotation);ch.arms[1].add(g);
   const shaft=mesh('cyl',0x8b6945,0,0,.4,.045,.95,.045,g);shaft.rotation.x=Math.PI/2;
   if(kind==='axe'){mesh('box',0x9faeaa,.06,0,.82,.4,.1,.3,g);mesh('cone',0xd2d9c8,.3,0,.82,.17,.3,.07,g).rotation.z=-Math.PI/2}
   else{mesh('box',0xa2b7b3,0,0,.82,.65,.12,.12,g);for(const side of [-1,1]){const tip=mesh('cone',0xc3d3c5,side*.4,0,.82,.09,.3,.07,g);tip.rotation.z=-side*Math.PI/2}}
   entry[kind]=g;
  }return entry[kind];
 }
 function clearTools(ch){for(const g of Object.values(tools.get(ch)||{}))g.visible=false}
 function cancel(){if(job){hero.weapon.visible=job.weaponVisible;job=null}clearTools(hero)}
 function pose(ch,kind,t){clearTools(ch);if(kind!=='hands'){toolFor(ch,kind).visible=true;ch.weapon.visible=false}const swing=Math.sin(Math.min(1,t)*Math.PI);ch.arms[1].rotation.x=-.3-swing*1.75;ch.arms[1].rotation.z=-.2;ch.arms[0].rotation.x=-.25-swing*.55;ch.rig.rotation.x=swing*.22;ch.rig.rotation.y=-.13+Math.sin(t*Math.PI*2)*.13;}
 function target(){
  const choices=[];
  for(const s of stations){if(near(s.bench,3))choices.push({k:s.k,type:'bench',...s.bench});if(near(s.chest,3))choices.push({k:s.k,type:'chest',...s.chest})}
  for(const n of nodes)if(near(n,3.3))choices.push({...n,type:'node'});
  return choices.sort((a,b)=>Math.hypot(hero.root.position.x-a.x,hero.root.position.z-a.z)-Math.hypot(hero.root.position.x-b.x,hero.root.position.z-b.z))[0];
 }
 function hint(){const t=target();if(!t)return null;if(t.type==='bench')return 'Use workbench · '+h.plots[t.k].name;if(t.type==='chest')return 'Open storage · '+h.plots[t.k].name;
  const s=h.states[t.k],v=workshopData(s).nodes[t.id],p=packFor(s,h.actorKey());if(v?.readyAt>Date.now())return 'Regrowing · '+Math.ceil((v.readyAt-Date.now())/1000)+'s';
  return (p.tools[t.tool]?(t.tool==='axe'?'Chop marked tree':'Mine '+(t.resource==='ore'?'iron ore':'stone')):t.resource==='ore'?'A pickaxe is required':'Gather loose '+(t.resource==='logs'?'branches':'stone'))+' · '+h.plots[t.k].name;
 }
 function interact(){const t=target();if(!t)return false;h.setKind(t.k);if(t.type!=='node'){void menu(t.type==='chest'?'storage':'craft');return true}
  if(job||api.attack||api.dodge||api.mounted)return true;
  const p=packFor(h.states[t.k],h.actorKey()),v=workshopData(h.states[t.k]).nodes[t.id];
  if(v?.readyAt>Date.now()){api.toast(hint());return true}if(t.resource==='ore'&&!p.tools.pickaxe){api.toast('Craft a pickaxe at the workbench first.');return true}
  job={node:t,k:t.k,t:0,hit:false,tool:p.tools[t.tool]?t.tool:'hands',weaponVisible:hero.weapon.visible};api.sound('swing');return true;
 }
 function update(dt){
  for(const n of nodes){const v=workshopData(h.states[n.k]).nodes[n.id],depleted=(v?.readyAt||0)>Date.now();n.g.visible=near(n,80);n.body.visible=!depleted;n.stump.visible=depleted;n.cracks.visible=!depleted&&(v?.hits||0)>0;n.body.rotation.z=!depleted&&v?.lastHit?Math.sin((Date.now()-v.lastHit)*.025)*Math.max(0,1-(Date.now()-v.lastHit)/400)*.04:0}
  for(const s of stations)s.root.visible=near(s.bench,80);
  if(job){if(api.state!=='playing'||api.panel||api.attack||api.dodge||api.mounted||!near(job.node,3.6)){cancel();return}
   job.t+=dt;hero.root.rotation.y=Math.atan2(job.node.x-hero.root.position.x,job.node.z-hero.root.position.z);pose(hero,job.tool,job.t);
   if(job.t>=.58&&!job.hit){job.hit=true;const current=job;void h.change({action:'gather',node:current.node.id},current.k).then(ok=>{if(ok){api.burst(new THREE.Vector3(current.node.x,api.ground(current.node.x,current.node.z),current.node.z),current.tool==='axe'?0xbfa172:0xb8c9bf,7);api.sound(current.tool==='pickaxe'?'block':'heavyHit')}})}
   if(job?.t>=1)cancel();
  }
  if(api.panel==='workshop'){menuTimer+=dt;if(menuTimer>.6){menuTimer=0;const version=h.kind+':'+h.states[h.kind].version;if(version!==menuVersion)render()}}
 }
 function blocked(x,z,r,feet){return nodes.some(n=>{if((workshopData(h.states[n.k]).nodes[n.id]?.readyAt||0)>Date.now())return false;return Math.hypot(x-n.x,z-n.z)<(n.type==='tree'?.3:1)+r&&feet<n.g.position.y+(n.type==='tree'?4:1.6)})}
 async function menu(nextTab='craft'){cancel();h.cancel();tab=nextTab;h.update(0);api.modal('The builder’s hearth','<p>Opening workshop…</p>','workshop');if(api.accounts()?.active)await h.refresh();if(api.panel==='workshop')render()}
 function render(){
  menuVersion=h.kind+':'+h.states[h.kind].version;const s=h.states[h.kind],w=workshopData(s),p=packFor(s,h.actorKey()),can=s.canEdit!==false;
  const nearBench=near(station(h.kind),4),nearChest=near(station(h.kind,'chest'),4),nearSmith=near({x:-7,z:58},4);
  api.modal('The builder’s hearth','<div class="workshop-options"><button id="work-home">Home Base</button><button id="work-coop">Co-op Base</button></div><div class="workshop-options"><button id="work-craft">Workbench</button><button id="work-storage">Storage</button><button id="work-quest">Shelter quest</button></div><p id="work-intro"></p><div id="work-content"></div><button id="work-mark">Mark workstation on map</button>','workshop');
  for(const k of ['home','coop']){$('work-'+k).classList.toggle('primary',h.kind===k);$('work-'+k).onclick=()=>{h.setKind(k);render()}}
  for(const t of ['craft','storage','quest']){$('work-'+t).classList.toggle('primary',tab===t);$('work-'+t).onclick=()=>{tab=t;render()}}
  $('work-mark').onclick=()=>{const n=station(h.kind,tab==='storage'?'chest':'bench');api.frontier.setWaypoint(n.x,n.z);api.closeModal();api.toast('Workstation marked on the map.')};
  const area=$('work-content');
  const button=(parent,label,op,enabled=true)=>{const b=document.createElement('button');b.textContent=label;b.dataset.workAction=op.action;b.dataset.recipe=op.recipe||'';b.disabled=!can||!enabled;b.onclick=async()=>{b.disabled=true;await h.change(op);if(api.panel==='workshop')render()};parent.append(b);return b};
  const row=(title,detail)=>{const r=document.createElement('section');r.className='quest-entry';const heading=document.createElement('h3'),text=document.createElement('p');heading.textContent=title;text.textContent=detail;r.append(heading,text);area.append(r);return r};
  if(tab==='craft'){
   $('work-intro').textContent=(can?'':'Visiting: only the home owner may use its supplies. ')+(nearBench?'Craft using this base’s stored supplies.':'Visit the marked workbench to craft.')+' Your tools: '+(p.tools.axe===2?'Iron axe':p.tools.axe?'Stone axe':'No axe')+' / '+(p.tools.pickaxe===2?'Iron pickaxe':p.tools.pickaxe?'Stone pickaxe':'No pickaxe')+'.';
   for(const[id,r]of Object.entries(RECIPES)){const line=Object.entries(r.cost).map(([k,n])=>n+' '+MATERIALS[k]+' ('+stockOf(s,k)+' stored)').join(' · ');const el=row(r.name,line);button(el,r.tool&&p.tools[r.tool]>=r.rank?'Owned':'Craft',{action:'craft',recipe:id},nearBench&&(!r.tool||p.tools[r.tool]===r.rank-1)&&Object.entries(r.cost).every(([k,n])=>stockOf(s,k)>=n))}
  }else if(tab==='storage'){
   $('work-intro').textContent=(nearChest?'Transfer materials at this chest.':'Visit the marked storage chest to transfer.')+' Packs and tools belong to each builder at this base; co-op storage is shared. Building and recipes spend stored supplies. Capacity: 500 of each material.';
   button(area,'Store all carried materials',{action:'transfer',direction:'deposit',resource:'all'},nearChest&&Object.values(p.bag).some(n=>n>0));
   for(const k of Object.keys(MATERIALS)){const el=row(MATERIALS[k],p.bag[k]+' carried · '+stockOf(s,k)+' stored');const controls=document.createElement('div');controls.className='workshop-options';el.append(controls);for(const d of ['deposit','withdraw']){const n=Math.min(5,d==='deposit'?p.bag[k]:stockOf(s,k));button(controls,(d==='deposit'?'Store ':'Take ')+n,{action:'transfer',direction:d,resource:k,qty:n},nearChest&&n>0)}}
  }else{
   const q=w.quest;$('work-intro').textContent='Bram: “A sword keeps you alive for a night. A roof gives you a reason to return. Gather your own supplies, prepare them here, then raise a proper shelter.”';
   row('A roof of your own · '+q.status,'A separate, shared contract for each base. Existing materials and buildings are kept. Gathering and crafting count after acceptance.');
   row('1 · Make your tools','Craft a stone axe (4 timber, 2 stone) and pickaxe (4 timber, 3 stone). Existing base supplies cover this. Without tools, collect loose branches or stones at marked deposits.');
   row('2 · Gather and prepare','Logs '+q.logs+'/6 · rough stone '+q.rubble+'/6 · crafted timber '+q.wood+'/8 · crafted blocks '+q.stone+'/6. Deposit raw materials, then process them at the workbench.');
   row('3 · Raise a shelter','One foundation with four ground-floor wall edges, including a doorway and window, plus a roof. Reward: 80 timber and 40 stone, deposited once into this base’s storage.');
   button(area,q.status==='available'?'Accept Bram’s contract':q.status==='claimed'?'Reward claimed':'Claim shelter reward',{action:q.status==='available'?'shelter_accept':'shelter_claim'},(nearBench||nearSmith)&&(q.status==='available'||q.status==='active'&&shelterReady(s)));
   if(q.status==='active'){for(const[node,label]of [[0,'Mark timber grove'],[4,'Mark stone deposit']]){const b=document.createElement('button');b.textContent=label;b.onclick=()=>{const n=nodeSpec(h.kind,node);api.frontier.setWaypoint(n.x,n.z);api.closeModal()};area.append(b)}}
  }
 }
 return{menu,interact,hint,update,blocked,cancel,nodes,stations,pose,get animation(){return job?{tool:job.tool,t:job.t}:null},remote(ch,a){clearTools(ch);if(a&&['axe','pickaxe','hands'].includes(a.tool)&&Number.isFinite(a.t))pose(ch,a.tool,Math.max(0,Math.min(1,a.t)))},removeRemote(ch){clearTools(ch);for(const g of Object.values(tools.get(ch)||{}))g.removeFromParent();tools.delete(ch)}};
}
