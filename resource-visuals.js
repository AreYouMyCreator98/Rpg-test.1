import {WORLD_RESOURCES} from './world-resources.js?v=realm-net-sync-1';
// Render bindings never own rewards. Saved workshop state is the only source of depletion.
const key=(x,z)=>Math.round(x*100)+','+Math.round(z*100),ids=new Map(WORLD_RESOURCES.map((v,i)=>[key(v[0],v[1]),i+8])),refs=new Map();
let states=new Map(),previous=new Set();
export function resourceId(x,z){const found=ids.get(key(x,z));if(found!==undefined)return found;for(const dx of [-.01,0,.01])for(const dz of [-.01,0,.01]){const id=ids.get(key(x+dx,z+dz)),v=WORLD_RESOURCES[id-8];if(v&&Math.hypot(v[0]-x,v[1]-z)<.002)return id}}

export const resourceDepleted=(x,z)=>((states.get(resourceId(x,z))?.readyAt)||0)>Date.now();
export function bindResourceMesh(THREE,m,entries,ground,branches=false){
 const bindings=[];
 entries.forEach((e,i)=>{let id=resourceId(e[10]??e[0],e[11]??e[2]);if(id===undefined&&branches)id=resourceId(e[0]-1.3,e[2]-.3);if(id===undefined)return;const v=WORLD_RESOURCES[id-8],original=new THREE.Matrix4();m.getMatrixAt(i,original);const ref={m,i,original,x:v[0],z:v[1],y:ground(v[0],v[1])};if(!refs.has(id))refs.set(id,new Set());refs.get(id).add(ref);bindings.push([id,ref])});
 m.addEventListener('dispose',()=>{for(const[id,ref]of bindings){refs.get(id)?.delete(ref);if(!refs.get(id)?.size)refs.delete(id)}});
 // A streamed cell must not briefly resurrect a depleted resource.
 const zero=new THREE.Matrix4(),zeroScale=new THREE.Vector3(0,0,0);for(const[id,ref]of bindings)if((states.get(id)?.readyAt||0)>Date.now())m.setMatrixAt(ref.i,zero.copy(ref.original).scale(zeroScale));m.instanceMatrix.needsUpdate=true;
}
export function updateResourceVisuals(THREE,next){
 states=next;const now=Date.now(),changed=new Set(),matrix=new THREE.Matrix4(),rotation=new THREE.Matrix4(),back=new THREE.Matrix4(),active=new Set([...previous,...next.keys()]);
 for(const id of active){const v=next.get(id),depleted=(v?.readyAt||0)>now,age=(now-(v?.lastHit||0))/1000,tree=WORLD_RESOURCES[id-8]?.[2]===0;
  for(const r of refs.get(id)||[]){const pose=depleted?(age>=1.3?'gone':age):age<.35?age:'standing';if(r.pose===pose)continue;r.pose=pose;if(depleted&&age>=1.3){matrix.copy(r.original).scale(new THREE.Vector3(0,0,0))}else{matrix.copy(r.original);if(depleted||age<.35){const angle=depleted?(tree?Math.min(1,age/1.3)**2*1.5:Math.min(1,age/1.3)*.5):Math.sin(age*35)*Math.max(0,1-age/.35)*.025;rotation.makeTranslation(r.x,r.y,r.z);back.makeRotationZ(angle);rotation.multiply(back);back.makeTranslation(-r.x,-r.y,-r.z);rotation.multiply(back);matrix.premultiply(rotation);if(depleted&&!tree)matrix.scale(new THREE.Vector3(Math.max(0,1-age/1.3),Math.max(0,1-age/1.3),Math.max(0,1-age/1.3)))}}r.m.setMatrixAt(r.i,matrix);changed.add(r.m)}
 }
 for(const m of changed){m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere()}
 previous=new Set(next.keys());
}
export const resourceBindingCount=id=>refs.get(id)?.size||0;
