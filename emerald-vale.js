import {graphics,retireInstances} from './graphics.js?v=realm-cinematic-1';
// A bounded presentation layer. Original tree roots, terrain, roads and collision remain authoritative.
export const VALE={left:-535,right:-335,top:-120,bottom:80};
export const inVale=(x,z)=>x>=VALE.left&&x<=VALE.right&&z>=VALE.top&&z<=VALE.bottom;
export function installEmeraldVale(api){
 const {THREE,scene,hero,frontier,ground,pathDist,riverZ}=api;
 const root=new THREE.Group();root.name='The Emerald Vale · authored forest';scene.add(root);
 let ambience=null;const time={value:0},windStrength={value:1},models=new Map(),cells=[],dummy=new THREE.Object3D();let ready=false,failed=false,loaded=false,tick=0;
 const hash=(x,z)=>{const v=Math.sin(x*127.1+z*311.7+87)*43758.5453;return v-Math.floor(v)};
 const trees=[...frontier.vegetation.filter(v=>!v.rock),...(api.startingTrees||[]).map(v=>({x:v[0],z:v[2]}))];
 const placements=new Map(),detailTiles=new Map();let instanceCount=0;
 function place(name,x,z,size=1,angle=0,detail=false){const cx=Math.floor(x/40),cz=Math.floor(z/40),key=[cx,cz,name].join(':');if(!placements.has(key))placements.set(key,{name,cx,cz,detail,entries:[]});placements.get(key).entries.push([x,ground(x,z)-.03,z,size,angle]);instanceCount++}
 trees.forEach((v,i)=>{const n=hash(v.x,v.z),bank=Math.abs(v.z-riverZ(v.x)),grove=Math.sin(v.x*.055)+Math.cos(v.z*.08);
  const variation=Math.floor(hash(Math.floor(v.x/80),Math.floor(v.z/80))*3),name=i%97===0?'dead-tree':v.z<-650?'fir-a':v.z<-460?['pine-a','pine-b','pine-c'][variation]:bank<12?'willow-a':grove>.6?(i%29===0?'ancient-oak':['oak-a','oak-b','oak-c'][variation]):grove<-.45?(i%3?['pine-a','pine-b','pine-c'][variation]:'fir-a'):variation?'birch-a':'birch-b';place(name,v.x,v.z,1.15+n*.42,n*6.28);
 });
 for(const v of frontier.vegetation.filter(v=>v.rock&&inVale(v.x,v.z)))place('moss-rock',v.x,v.z,1.1,hash(v.x,v.z)*6.28);
 // Moisture and clearings choose the understory. Routes, buildings and roots keep clear space.
 for(let x=VALE.left+1;x<VALE.right;x+=2)for(let z=VALE.top+1;z<VALE.bottom;z+=2){const n=hash(x,z),xx=x+n*1.4,zz=z+hash(z,x)*1.4,bank=Math.abs(zz-riverZ(xx));
  if(pathDist(xx,zz)<3.5||bank<4.5||api.nearbyObstacles(xx,zz).some(o=>Math.hypot(xx-o.x,zz-o.z)<o.r+.6))continue;
  const slope=Math.hypot(ground(xx+1,zz)-ground(xx-1,zz),ground(xx,zz+1)-ground(xx,zz-1));if(slope>2)continue;
  if(bank<7.5){if(n<.35)place('reeds',xx,zz,.65+n*.35,n*6.28,true);else if(n>.8)place('river-rock',xx,zz,.6+n*.4,n*6.28,true);continue}
  const grove=Math.sin(xx*.055)+Math.cos(zz*.08);
  if(n<.055)place('moss-rock',xx,zz,.4+n*4,n*90,true);
  else if(n<.105&&grove>.4)place('fern',xx,zz,.7+n*1.5,n*12,true);
  else if(n>.92&&grove<.6)place('flowers',xx,zz,.9,n*6.28,true);
  else if(n>.22)place('grass',xx,zz,.7+n*.7,n*6.28,true);
 }
 // Fallen branches are deliberately small enough to step across and stay off trails.
 for(const [i,v]of trees.entries())if(i%35===0&&pathDist(v.x+2,v.z+1)>6)place('fallen-log',v.x+2,v.z+1,.65,i);
 function detailCell(cx,cz,clock){
  const key=cx+','+cz,entries=new Map();
  for(let x=cx*40+1;x<cx*40+40;x+=3)for(let z=cz*40+1;z<cz*40+40;z+=3){const n=hash(x,z),xx=x+n*2,zz=z+hash(z,x)*2;
   if(inVale(xx,zz)||xx<api.BOUNDS.left||xx>api.BOUNDS.right||zz<api.BOUNDS.top||zz>api.BOUNDS.bottom||zz<-700||pathDist(xx,zz)<3||api.nearbyObstacles(xx,zz).some(o=>Math.hypot(xx-o.x,zz-o.z)<o.r+.4))continue;
   const bank=Math.abs(zz-riverZ(xx));if(bank<4.5||Math.hypot(ground(xx+1,zz)-ground(xx-1,zz),ground(xx,zz+1)-ground(xx,zz-1))>1.8)continue;
   const shade=Math.sin(xx*.055)+Math.cos(zz*.08),special=['fern','bush','flowers','mushrooms','moss','ivy','tall-grass','sapling-near'][Math.floor(hash(cx,cz)*8)];
   const name=bank<8?'reeds':n<.025?(cx%3===0?'stump':cx%3===1?'branch':'stepping-stone'):n<.15?special:'grass';
   if(!entries.has(name))entries.set(name,[]);entries.get(name).push([xx,ground(xx,zz)-.025,zz,.65+n*.6,n*6.28]);
  }
  const set=[];for(const [name,list]of entries){const c={p:{name,entries:list},m:null,near:models.get(name),far:models.get(name),x:cx*40+20,z:cz*40+20,detail:true,lod:'near',last:clock,tile:key};cells.push(c);set.push(c)}detailTiles.set(key,{cells:set,last:clock});
 }
 // One coarse canopy draw maintains forest silhouettes beyond the authored-tree range.
 // This is visual LOD only: authoritative roots and collision remain unchanged.
 const crownGeometry=new THREE.BufferGeometry(),crownVertices=[0,2.3,0,0,-1.8,0],crownIndices=[];
 for(let i=0;i<5;i++)crownVertices.push(Math.cos(i*Math.PI*2/5)*3.5,0,Math.sin(i*Math.PI*2/5)*3.5);
 for(let i=0;i<5;i++){const a=2+i,b=2+(i+1)%5;crownIndices.push(0,b,a,1,a,b)}
 const crownColors=Array(crownVertices.length).fill(1),trunkStart=crownVertices.length/3;
 for(const y of [-7.8,-.7])for(let i=0;i<3;i++){const a=i*Math.PI*2/3;crownVertices.push(Math.cos(a)*.15,y,Math.sin(a)*.15);crownColors.push(.5,.32,.16)}
 for(let i=0;i<3;i++){const a=trunkStart+i,b=trunkStart+(i+1)%3;crownIndices.push(a,a+3,b,b,a+3,b+3)}
 crownGeometry.setAttribute('color',new THREE.Float32BufferAttribute(crownColors,3));
 crownGeometry.setAttribute('position',new THREE.Float32BufferAttribute(crownVertices,3));crownGeometry.setIndex(crownIndices);crownGeometry.computeVertexNormals();
 const farForest=new THREE.InstancedMesh(crownGeometry,new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,flatShading:true}),trees.length);farForest.name='Distant forest canopy';farForest.frustumCulled=false;farForest.count=0;root.add(farForest);let farTimer=1;
 const farColor=new THREE.Color(),view=new THREE.Vector3();
 function distantForest(dt,profile){farTimer+=dt;if(farTimer<.3)return;farTimer=0;let count=0;const p=hero.root.position,stride=api.settings.quality==='low'?6:api.settings.quality==='ultra'?2:3;api.camera.getWorldDirection(view);
  for(let i=0;i<trees.length;i+=stride){const t=trees[i],dx=t.x-p.x,dz=t.z-p.z,d=Math.hypot(dx,dz);if(d<profile.distance+30||d>1150||dx*view.x+dz*view.z<-d*.15)continue;
   dummy.position.set(t.x,ground(t.x,t.z)+8,t.z);dummy.scale.set(Math.sqrt(stride)*(t.z<-450?.8:1.2),t.z<-450?2.8:1.7,Math.sqrt(stride)*(t.z<-450?.7:1));dummy.rotation.set(0,i*2.4,0);dummy.updateMatrix();farForest.setMatrixAt(count,dummy.matrix);farColor.setHex(t.z<-650?0x779489:t.z<-450?0x37634d:0x447c42).multiplyScalar(.9+hash(t.x,t.z)*.2);farForest.setColorAt(count++,farColor);
  }
  farForest.count=count;farForest.instanceMatrix.needsUpdate=true;if(farForest.instanceColor)farForest.instanceColor.needsUpdate=true;
 }
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide});
 material.onBeforeCompile=s=>{s.uniforms.valeTime=time;s.uniforms.windStrength=windStrength;s.vertexShader='uniform float valeTime;uniform float windStrength;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec3 origin=instanceMatrix[3].xyz;
 float foliage=step(color.r*1.18,color.g)*step(.06,color.g);
 float strength=min(position.y*.022,.15)*foliage*windStrength;
 float distanceFade=1.-smoothstep(50.,140.,distance(origin,cameraPosition));
 transformed.x+=sin(valeTime*1.15+origin.x*.31+origin.z*.21+position.y*.4)*strength*distanceFade;
 transformed.z+=cos(valeTime*.83+origin.z*.27)*strength*.45*distanceFade;
 #endif`)};
 const readyPromise=import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js').then(({GLTFLoader})=>new GLTFLoader().loadAsync(new URL('./assets/environment/emerald-library.glb?v=realm-cinematic-1',import.meta.url).href)).then(gltf=>{
  gltf.scene.updateMatrixWorld(true);const oldMaterials=new Set();gltf.scene.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.computeBoundingSphere();models.set(o.name,geometry);oldMaterials.add(o.material);o.geometry.dispose()});for(const m of oldMaterials)m.dispose();
  for(const name of placements.values())if(!models.has(name.name)&&!models.has(name.name+'-near'))throw Error('Incomplete Emerald Vale library: '+name.name);
  for(const p of placements.values())cells.push({p,m:null,near:models.get(p.name+'-near')||models.get(p.name),far:models.get(p.name+'-far')||models.get(p.name+'-near')||models.get(p.name),x:p.cx*40+20,z:p.cz*40+20,detail:p.detail,lod:'far',last:0});loaded=true;
 }).catch(error=>{failed=true;root.visible=false;placements.clear();for(const geometry of models.values())geometry.dispose();models.clear();material.dispose();console.warn('Emerald Vale assets unavailable; original scenery retained.',error.message)});
 function update(dt,clock){time.value=clock;windStrength.value=graphics(api.settings).effects;
  // Reuse the gesture-unlocked game context. Two bounded filtered noise voices, no downloads.
  const audio=api.audioContext;
  if(!ambience&&audio?.state==='running'&&api.settings.sound){const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(hash(i,43)-.5)*2;
   ambience=[450,1700].map(frequency=>{const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;source.loop=true;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.55;gain.gain.value=0;source.connect(filter).connect(gain).connect(audio.destination);source.start();return gain});
  }
  if(ambience){const p=hero.root.position,on=ready&&api.active&&api.settings.sound&&!document.hidden&&p.x<200;ambience[0].gain.setTargetAtTime(on ? .008*(api.settings.environmentVolume??.7) : 0,audio.currentTime,.5);ambience[1].gain.setTargetAtTime(on ? .023*(api.settings.environmentVolume??.7)*Math.max(0,1-Math.abs(p.z-riverZ(p.x))/22) : 0,audio.currentTime,.4)}
  root.visible=ready&&hero.root.position.x<200;tick+=dt;if(tick<.15)return;tick=0;
  const profile=graphics(api.settings);distantForest(.15,profile);const nearLimit=api.settings.quality==='low'?24:profile.distance*.3,reach=profile.distance,p=hero.root.position;
  const wanted=[];
  if(loaded&&hero.root.position.x<200){const cx=Math.floor(p.x/40),cz=Math.floor(p.z/40),radius=Math.ceil(reach*.36/40),missing=[];
   for(let x=cx-radius;x<=cx+radius;x++)for(let z=cz-radius;z<=cz+radius;z++){const key=x+','+z,d=Math.hypot(x*40+20-p.x,z*40+20-p.z);if(d>reach*.36+28)continue;if(detailTiles.has(key))detailTiles.get(key).last=clock;else missing.push({x,z,d})}
   missing.sort((a,b)=>a.d-b.d);if(missing.length)detailCell(missing[0].x,missing[0].z,clock);
  }
  for(const [key,t]of detailTiles)if(clock-t.last>8){for(const c of t.cells){if(c.m){root.remove(c.m);c.m.dispose()}cells.splice(cells.indexOf(c),1)}detailTiles.delete(key)}
  for(const c of cells){const d=Math.hypot(c.x-p.x,c.z-p.z),visible=loaded&&hero.root.position.x<200&&d<(c.detail?reach*.36:reach+45);
   if(visible){c.last=clock;if(!c.m)wanted.push({c,d});}
   if(c.m){retireInstances(c.m,visible,clock);c.m.castShadow=profile.shadow>0&&!c.detail&&d<55;const count=Math.max(1,Math.floor(c.p.entries.length*(c.detail?profile.density:1)));if(c.m.count!==count){c.m.count=count;c.m.computeBoundingSphere()}const next=d>nearLimit+12?'far':d<nearLimit-12?'near':c.lod;if(next!==c.lod){c.lod=next;c.m.geometry=next==='near'?c.near:c.far;c.m.computeBoundingSphere()}
    if(!visible&&(clock-c.last>8||d>reach+160)){root.remove(c.m);c.m.dispose();c.m=null;}
   }
  }
  wanted.sort((a,b)=>a.d-b.d);const begin=performance.now();let built=0;
  for(const {c,d}of wanted){if(built>=4||performance.now()-begin>3)break;const m=new THREE.InstancedMesh(d<nearLimit?c.near:c.far,material,c.p.entries.length);m.name='Forest '+c.p.name;
   c.p.entries.forEach(([x,y,z,s,a],i)=>{dummy.position.set(x,y,z);dummy.scale.setScalar(s);dummy.rotation.set(0,a,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});m.computeBoundingSphere();m.receiveShadow=true;m.castShadow=profile.shadow>0&&!c.detail&&d<55;root.add(m);c.m=m;c.lod=d<nearLimit?'near':'far';built++;
  }
  if(loaded&&!ready&&wanted.slice(built).every(job=>job.d>65)){ready=true;frontier.setValeAssetsReady(true)}
 }

 return{farForest,root,update,readyPromise,trees,cells,models,bounds:VALE,get ready(){return ready},get failed(){return failed},get instanceCount(){return instanceCount},get activeInstances(){return cells.reduce((n,c)=>n+(c.m?.visible?c.m.count:0),0)},get detailTiles(){return detailTiles.size},get resident(){return cells.filter(c=>c.m).length},get pending(){return cells.filter(c=>!c.m&&Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z)<graphics(api.settings).distance).length}};
}

// The atlas and rendered terrain consume this same feathered colour field.
export function valeGroundColor(x,z,base,path,bank){
 if(!inVale(x,z))return base;
 const blend=(a,b,t)=>{let out=0;for(const shift of [16,8,0])out|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return out};
 const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)};
 const grove=(Math.sin(x*.055)+Math.cos(z*.08)+2)/4;
 let c=blend(0x639447,0x386d43,grove);c=blend(c,0x9ca878,1-smooth(4,9,bank));c=blend(c,0xb5a16b,1-smooth(1.7,3.7,path));
 return blend(base,c,smooth(0,15,Math.min(x-VALE.left,VALE.right-x,z-VALE.top,VALE.bottom-z)));
}

export function valeRiverProfile(x,z,d,original){
 if(!inVale(x,z))return original;
 const edge=Math.max(0,Math.min(1,Math.min(x-VALE.left,VALE.right-x,z-VALE.top,VALE.bottom-z)/18));
 const t=Math.max(0,Math.min(1,(d-3.2)/16));return original+(t*t*(3-2*t)-original)*edge*edge*(3-2*edge);
}
