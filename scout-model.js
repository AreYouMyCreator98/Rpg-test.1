// Rigid glTF joints share immutable geometry/materials across all scout instances.
// Gameplay owns attack timing, collisions, damage, death and respawn; this is visual only.
export async function loadScoutAsset(){
 let timer;
 try{
  return await Promise.race([(async()=>{
   const {GLTFLoader}=await import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js');
   return new GLTFLoader().loadAsync(new URL('./assets/goblin-scout.gltf?v=realm-living-landscape-1',import.meta.url).href);
  })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Scout asset timed out')),12000)})]);
 }catch(error){console.warn('Detailed scout unavailable; retaining the existing playable model.',error);return null}
 finally{clearTimeout(timer)}
}
export function replaceScouts(THREE,asset,enemies,scene){
 if(!asset)return;
 for(const e of enemies){
  if(e.type!==0||e.prologue!==undefined||e.family||e.expansion)continue;
  const old=e.root,root=asset.scene.clone(true),find=name=>root.getObjectByName(name);
  root.position.copy(old.position);root.quaternion.copy(old.quaternion);root.scale.copy(old.scale);root.visible=old.visible;
  root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=true}});
  const mixer=new THREE.AnimationMixer(root),actions={};
  for(const clip of asset.animations){const action=mixer.clipAction(clip);action.play();action.enabled=true;action.setEffectiveWeight(0);actions[clip.name]=action}
  Object.assign(e,{root,rig:find('Rig'),head:find('Head'),arms:[find('ArmL'),find('ArmR')],legs:[find('LegL'),find('LegR')],weapon:find('Dagger'),scoutModel:{mixer,actions,state:null,elapsed:0,previousRecoil:0}});
  // Only the old rig's two instance-owned materials may be disposed.
  e.bodyMat.dispose();e.bladeMat.dispose();scene.remove(old);scene.add(root);
 }
}
export function animateScout(e,speed,dt,attack,dying){
 if(!e.scoutModel)return false;
 const s=e.scoutModel;
 const name=dying?'Death':(e.stagger>0?'Stagger':e.recoil>0?'Damage':attack?'Attack':speed>2.8?'Run':speed>.1?'Walk':'Idle');
 if(s.state!==name){s.state=name;s.elapsed=0}
 s.elapsed+=dt;
 for(const [key,action] of Object.entries(s.actions)){
  const desired=key===name?1:0;
  action.setEffectiveWeight(lerp(action.getEffectiveWeight(),desired,1-Math.exp(-dt*24)));
  const duration=action.getClip().duration;
  // Sample attack/death from authoritative timers, never from animation events.
  if(key===name){action.time=attack&&name==='Attack'?Math.min(.999,attack.t/attack.duration)*duration:name==='Death'?Math.min(dying,duration-1e-6):['Damage','Stagger'].includes(name)?Math.min(s.elapsed,duration-1e-6):s.elapsed%duration}
 }
 s.mixer.update(0);return true;
}
function lerp(a,b,t){return a+(b-a)*t}
