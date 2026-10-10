// Visual-only Scout adapter. AI, hitboxes, rewards and network state stay in gameplay.
const CDN='https://cdn.jsdelivr.net/npm/three@0.160.1/';
const REQUIRED=['Idle','Walk','Run','Attack','Hit','Death'];
function deadline(task,ms){let timer;return Promise.race([task,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Scout asset timed out')),ms)})]).finally(()=>clearTimeout(timer))}
export async function loadScoutAsset(){
 try{
  const {GLTFLoader}=await deadline(import(CDN+'examples/jsm/loaders/GLTFLoader.js'),8000);
  const loader=new GLTFLoader();
  try{
   const [asset,{clone}]=await deadline(Promise.all([
    loader.loadAsync(new URL('./assets/models/goblin_scout.glb?v=realm-red-cowl-1',import.meta.url).href),
    import(CDN+'examples/jsm/utils/SkeletonUtils.js')
   ]),10000);
   if(!REQUIRED.every(name=>asset.animations.some(c=>c.name===name)))throw new Error('Scout clips are incomplete');
   const names=['Root','Head','UpperArmL','UpperArmR','ThighL','ThighR','HandR'];
   if(!names.every(name=>asset.scene.getObjectByName(name)))throw new Error('Scout skeleton is incomplete');
   return {...asset,cloneSkinned:clone,skinned:true};
  }catch(error){console.warn('Red Cowl unavailable; loading the original Scout.',error)}
  // Existing glTF remains a genuine playable fallback, including its original clips.
  return await deadline(loader.loadAsync(new URL('./assets/goblin-scout.gltf?v=realm-red-cowl-1',import.meta.url).href),5000);
 }catch(error){console.warn('Scout assets unavailable; retaining the procedural model.',error);return null}
}
export function replaceScouts(THREE,asset,enemies,scene){
 if(!asset)return;
 for(const e of enemies){
  if(e.type!==0||e.prologue!==undefined||e.family||e.expansion)continue;
  const old=e.root,root=new THREE.Group(),model=asset.skinned?asset.cloneSkinned(asset.scene):asset.scene.clone(true);
  root.name='Scout';root.add(model);
  if(asset.skinned){const palettes=new Map();model.traverse(o=>{if(!o.isSkinnedMesh)return;const key=o.skeleton.bones.map(b=>b.uuid).join(',');if(palettes.has(key))o.skeleton=palettes.get(key);else palettes.set(key,o.skeleton)})}
  // Match the existing humanoid's 2.1-unit silhouette BEFORE its enemy scale.
  if(asset.skinned)model.scale.setScalar(2.1/3.064);
  const find=name=>model.getObjectByName(name);
  root.position.copy(old.position);root.quaternion.copy(old.quaternion);root.scale.copy(old.scale);root.visible=old.visible;
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;
   // Static rest-pose bounds can cull a skinned falling body or extended dagger.
   // Gameplay already distance-culls enemy roots; only 7 Scouts use this path.
   o.frustumCulled=!o.isSkinnedMesh;
  }});
  const mixer=new THREE.AnimationMixer(model),actions={};
  for(const clip of asset.animations){const action=mixer.clipAction(clip);action.play();action.enabled=true;action.setEffectiveWeight(0);actions[clip.name]=action}
  let weapon=find('Dagger');
  if(asset.skinned){weapon=new THREE.Group();weapon.name='Dagger';find('HandR').add(weapon)}
  Object.assign(e,{root,rig:asset.skinned?model:find('Rig'),head:find('Head'),arms:asset.skinned?[find('UpperArmL'),find('UpperArmR')]:[find('ArmL'),find('ArmR')],legs:asset.skinned?[find('ThighL'),find('ThighR')]:[find('LegL'),find('LegR')],weapon,scoutModel:{mixer,actions,skinned:!!asset.skinned,state:null,elapsed:0,rootBone:find('Root')}});
  // Retire only the old procedural character's instance-owned materials.
  e.bodyMat.dispose();e.bladeMat.dispose();scene.remove(old);scene.add(root);
 }
}
export function animateScout(e,speed,dt,attack,dying){
 if(!e.scoutModel)return false;
 const s=e.scoutModel;
 const name=dying?'Death':e.stagger>0?'Stagger':e.recoil>0?'Damage':attack?'Attack':speed>2.8?'Run':speed>.1?'Walk':'Idle';
 const clip=s.skinned&&['Damage','Stagger'].includes(name)?'Hit':name;
 if(s.state!==name||(['Damage','Stagger'].includes(name)&&(e.recoil||0)>(s.previousRecoil||0)+.02)){s.state=name;s.elapsed=0}
 s.previousRecoil=e.recoil||0;
 s.elapsed+=dt;
 // Legacy AI adds a rigid stagger tilt; the skinned clip already supplies recoil.
 if(s.skinned)e.rig.rotation.set(0,0,0);
 for(const [key,action] of Object.entries(s.actions)){
  const desired=key===clip?1:0;
  action.setEffectiveWeight(lerp(action.getEffectiveWeight(),desired,1-Math.exp(-dt*24)));
  const duration=action.getClip().duration;
  if(key===clip){
   // The original attack hits at 58%: the authored slash contacts at 48%.
   // Remap visual time only. No animation callback can cause extra damage.
   let progress=attack?Math.min(.999,attack.t/attack.duration):0;
   if(s.skinned)progress=progress<=.58?progress*(.48/.58):.48+(progress-.58)*(.52/.42);
   action.time=attack&&clip==='Attack'?progress*duration:clip==='Death'?Math.min(dying,duration-1e-6):['Damage','Stagger','Hit'].includes(clip)?Math.min(s.elapsed,duration-1e-6):s.elapsed%duration;
  }
 }
 s.mixer.update(0);return true;
}
function lerp(a,b,t){return a+(b-a)*t}
