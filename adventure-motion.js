// Shared local/remote animation and device-local camera preference validation.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
export function normaliseCamera(s){return {fov:Number.isFinite(s.fov)?clamp(s.fov,45,100):70,cameraMode:['classic','shoulder','first'].includes(s.cameraMode)?s.cameraMode:'classic',shoulder:s.shoulder==='left'?'left':'right',sensitivity:Number.isFinite(s.sensitivity)?clamp(s.sensitivity,.25,2.5):1,invertY:s.invertY===true}}
export function prepareRollRig(ch,THREE){
 ch.knees=ch.legs.map(leg=>{const knee=new THREE.Group();knee.position.y=-.36;const lower=leg.children.slice(1);leg.add(knee);for(const mesh of lower){leg.remove(mesh);mesh.position.y+=.36;knee.add(mesh)}return knee});
 ch.rollBounds=new THREE.Box3();ch.rollPoint=new THREE.Vector3();ch.rollMeshes=[];
 for(const part of [ch.body,ch.head,...ch.legs])part.traverse(o=>{if(o.isMesh)ch.rollMeshes.push(o)});
}
export function resetRoll(ch){if(!ch.rolling)return;ch.rolling=false;ch.rig.rotation.set(0,0,0);ch.rig.position.set(0,0,0);ch.knees?.forEach(k=>k.rotation.x=0);ch.head.position.y=1.88;ch.head.position.z=0;ch.head.rotation.x=0;}
export function groundedRoll(ch,remaining){
 if(!ch.knees)return;const t=clamp(1-remaining,0,1);if(t>=1){resetRoll(ch);return}ch.rolling=true;
 // Anticipation, shoulder turnover, then uncurl. Always rotate forward in travel space.
 const tuck=smooth(t/.18)*(1-smooth((t-.78)/.22)),turn=smooth((t-.16)/.66),angle=turn*Math.PI*2;
 ch.rig.rotation.set(angle,0,Math.sin(turn*Math.PI)*.24);
 ch.rig.position.set(0,0,0);
 ch.legs.forEach((l,i)=>{l.rotation.set(-2.4*tuck,0,(i?-.08:.08)*tuck)});
 ch.knees.forEach(k=>k.rotation.x=2.6*tuck);
 ch.arms.forEach((a,i)=>a.rotation.set(-1.5*tuck,(i?-.3:.3)*tuck,(i?-.2:.2)*tuck));
 ch.head.position.y=1.88-.32*tuck;ch.head.position.z=.12*tuck;ch.head.rotation.x=.5*tuck;ch.cape.rotation.x=.12;
 // Exact core-mesh vertices, excluding the sword/cape, keep boots/shoulder on terrain.
 // Reuse buffers; this runs only during a roll, also for the three possible peers.
 ch.root.updateMatrixWorld(true);let bottom=Infinity;
 for(const mesh of ch.rollMeshes){const positions=mesh.geometry.attributes.position;for(let i=0;i<positions.count;i++){ch.rollPoint.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld);bottom=Math.min(bottom,ch.rollPoint.y)}}
 ch.rig.position.y=(ch.root.position.y+.02-bottom)/ch.root.scale.y;
}
