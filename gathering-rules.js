import {WORLD_RESOURCES} from './world-resources.js?v=realm-party-lobby-1';
export {WORLD_RESOURCES};
import {PLOTS,wallLike} from './building-rules.js?v=realm-party-lobby-1';
export const RESOURCE_REGROW_MS=3*24*60*1000;
export const MATERIALS={logs:'Logs',rubble:'Rough stone',ore:'Iron ore',wood:'Timber planks',stone:'Stone blocks',nails:'Iron nails'};
export const RECIPES={
 axe:{name:'Stone axe',cost:{wood:4,stone:2},tool:'axe',rank:1},
 pickaxe:{name:'Stone pickaxe',cost:{wood:4,stone:3},tool:'pickaxe',rank:1},
 timber:{name:'Saw 8 timber planks',cost:{logs:2},output:{wood:8}},
 blocks:{name:'Dress 6 stone blocks',cost:{rubble:2},output:{stone:6}},
 nails:{name:'Forge 6 iron nails',cost:{ore:2},output:{nails:6}},
 ironaxe:{name:'Iron axe · two-hit felling',cost:{wood:8,nails:6},tool:'axe',rank:2},
 ironpick:{name:'Iron pickaxe · two-hit mining',cost:{wood:8,nails:8},tool:'pickaxe',rank:2}
};
export const workshopActions=new Set(['gather','craft','transfer','shelter_accept','shelter_claim']);
export const emptyPack=()=>({tools:{axe:0,pickaxe:0},bag:Object.fromEntries(Object.keys(MATERIALS).map(k=>[k,0])),lastHit:0});
export function workshopData(s){return s.workshop||{version:1,packs:{},nodes:{},stock:{logs:0,rubble:0,ore:0,nails:0},quest:{status:'available',logs:0,rubble:0,wood:0,stone:0}}}
export function packFor(s,actor){return workshopData(s).packs[actor]||emptyPack()}
export function nodeSpec(kind,i){if(PLOTS[kind]&&Number.isInteger(i)&&i>=8){const v=WORLD_RESOURCES[i-8];return v?{id:i,x:v[0],z:v[1],type:v[2]?'rock':'tree',tool:v[2]?'pickaxe':'axe',resource:v[2]?'rubble':'logs',wild:true}:null}if(!PLOTS[kind]||!Number.isInteger(i)||i<0||i>7)return null;return {id:i,x:PLOTS[kind].x+[-12,-4,4,12][i%4],z:PLOTS[kind].z+(i<4?22:-20),type:i<4?'tree':i<6?'rock':'ore',tool:i<4?'axe':'pickaxe',resource:i<4?'logs':i<6?'rubble':'ore'}}
export function station(kind,type='bench'){return{x:PLOTS[kind].x+15,z:PLOTS[kind].z+(type==='chest'?11:15)}}
export function workshopPosition(kind,op){return op.action==='gather'?nodeSpec(kind,op.node):station(kind,op.action==='transfer'?'chest':'bench')}
export function stockOf(s,key){return key==='wood'||key==='stone'?s[key]:(workshopData(s).stock[key]||0)}
export function shelterReady(s){const q=workshopData(s).quest;if(q.logs<6||q.rubble<6||q.wood<8||q.stone<6)return false;return s.pieces.some(p=>p.type==='foundation'&&[0,1,2,3].every(r=>s.pieces.some(w=>wallLike(w.type)&&w.x===p.x&&w.z===p.z&&w.level===0&&w.rotation===r))&&['door','window','roof'].every(t=>s.pieces.some(w=>w.type===t&&w.x===p.x&&w.z===p.z&&w.level===0)))}
export function applyWorkshop(state,op,actor,now=Date.now()){
 const s=structuredClone(state);s.workshop=structuredClone(workshopData(s));const w=s.workshop;
 if(!Object.hasOwn(w.packs,actor)){if(Object.keys(w.packs).length>=64)throw Error('This base has reached its builder-pack limit.');w.packs[actor]=emptyPack()}
 const p=w.packs[actor],q=w.quest;
 const stock=(k,n)=>{const value=stockOf(s,k)+n;if(value<0||value>500)throw Error('Insufficient supplies or storage full (500 per material).');if(k==='wood'||k==='stone')s[k]=value;else w.stock[k]=value};
 if(op.action==='gather'){
  for(const [id,v]of Object.entries(w.nodes))if(Number(id)>=8&&Math.max(v.readyAt||0,(v.lastHit||0)+RESOURCE_REGROW_MS)<=now)delete w.nodes[id];
  const n=nodeSpec('home',op.node);if(!n)throw Error('Unknown resource node.');const v=w.nodes[op.node]||{hits:0,readyAt:0,lastHit:0,looseAt:0};
  if(now-p.lastHit<800)throw Error('Finish your previous gathering stroke.');if(v.readyAt>now)throw Error('This resource is regrowing.');if(v.readyAt){v.readyAt=0;v.hits=0}
  const rank=p.tools[n.tool]||0;if(!rank&&n.wild)throw Error('The matching gathering tool is required.');if(!rank&&n.type==='ore')throw Error('Craft a pickaxe to mine ore.');
  let amount=0;if(!rank){if(now-v.looseAt<10000)throw Error('No loose materials here yet.');v.looseAt=now;amount=1}else{v.hits+=rank;v.lastHit=now;if(v.hits>=3){v.hits=0;v.readyAt=now+RESOURCE_REGROW_MS;amount=n.type==='ore'?4:6}}
  if((p.bag[n.resource]||0)+amount>500)throw Error('Your builder’s pack is full. Deposit materials.');
  p.bag[n.resource]+=amount;p.lastHit=now;w.nodes[op.node]=v;
  if(q.status==='active'&&['logs','rubble'].includes(n.resource))q[n.resource]=Math.min(6,q[n.resource]+amount);
 }else if(op.action==='craft'){
  const r=Object.hasOwn(RECIPES,op.recipe)?RECIPES[op.recipe]:null;if(!r)throw Error('Unknown recipe.');
  if(r.tool&&(p.tools[r.tool]!==r.rank-1))throw Error(r.rank===1?'You already own this tool.':'Craft the stone tool first.');
  for(const[k,n]of Object.entries(r.cost))stock(k,-n);for(const[k,n]of Object.entries(r.output||{})){stock(k,n);if(q.status==='active'&&['wood','stone'].includes(k))q[k]=Math.min(k==='wood'?8:6,q[k]+n)}
  if(r.tool)p.tools[r.tool]=r.rank;
 }else if(op.action==='transfer'){
  if(!['deposit','withdraw'].includes(op.direction))throw Error('Invalid transfer.');
  const keys=op.resource==='all'&&op.direction==='deposit'?Object.keys(MATERIALS):Object.hasOwn(MATERIALS,op.resource)?[op.resource]:[];
  if(!keys.length)throw Error('Unknown material.');if(op.resource!=='all'&&(!Number.isInteger(op.qty)||op.qty<1||op.qty>500))throw Error('Choose a whole quantity.');
  for(const k of keys){const n=op.resource==='all'?p.bag[k]:op.qty;if(op.direction==='deposit'){if(p.bag[k]<n)throw Error('Not enough in your pack.');stock(k,n);p.bag[k]-=n}else{if(p.bag[k]+n>500)throw Error('Your pack is full.');stock(k,-n);p.bag[k]+=n}}
 }else if(op.action==='shelter_accept'){
  if(q.status!=='available')throw Error('This shelter contract is already accepted.');q.status='active';
 }else if(op.action==='shelter_claim'){
  if(q.status!=='active'||!shelterReady(s))throw Error('Finish the shelter contract first, or reward already claimed.');
  stock('wood',80);stock('stone',40);q.status='claimed';
 }else throw Error('Unknown workshop command.');
 s.version++;return s;
}
export function cleanWorkshop(raw){
 const w=workshopData({});if(!raw||typeof raw!=='object')return w;
 const integer=(v,max=500)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
 for(const k of ['logs','rubble','ore','nails'])w.stock[k]=integer(raw.stock?.[k]);
 const q=raw.quest||{};w.quest.status=['available','active','claimed'].includes(q.status)?q.status:'available';
 for(const k of ['logs','rubble','wood','stone'])w.quest[k]=integer(q[k],k==='wood'?8:6);
 for(const [id,p]of Object.entries(raw.packs||{}).slice(0,64)){if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id)||!p||['__proto__','constructor','prototype'].includes(id))continue;const v=emptyPack();for(const k of Object.keys(MATERIALS))v.bag[k]=integer(p.bag?.[k]);v.tools.axe=integer(p.tools?.axe,2);v.tools.pickaxe=integer(p.tools?.pickaxe,2);v.lastHit=integer(p.lastHit,1e14);w.packs[id]=v}
 for(const [key,v]of Object.entries(raw.nodes||{})){const i=Number(key);if(!Number.isInteger(i)||String(i)!==key||!nodeSpec('home',i))continue;if(v)w.nodes[i]={hits:integer(v.hits,2),readyAt:integer(v.readyAt,1e14),lastHit:integer(v.lastHit,1e14),looseAt:integer(v.looseAt,1e14)}}
 return w;
}
