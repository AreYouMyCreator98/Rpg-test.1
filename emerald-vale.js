// A bounded presentation layer. Original tree roots, terrain, roads and collision remain authoritative.
export const VALE={left:-535,right:-335,top:-120,bottom:80};
export const inVale=(x,z)=>x>=VALE.left&&x<=VALE.right&&z>=VALE.top&&z<=VALE.bottom;
export function installEmeraldVale(api){
 const {THREE,scene,hero,frontier,ground,pathDist,riverZ}=api;
 const root=new THREE.Group();root.name='The Emerald Vale · authored forest';scene.add(root);
 let ambience=null;const time={value:0},models=new Map(),cells=[],jobs=[],dummy=new THREE.Object3D();let ready=false,failed=false,loaded=false,tick=0;
 const hash=(x,z)=>{const v=Math.sin(x*127.1+z*311.7+87)*43758.5453;return v-Math.floor(v)};
 const trees=frontier.vegetation.filter(v=>!v.rock&&inVale(v.x,v.z));
 const placements=new Map();let instanceCount=0;
 function place(name,x,z,size=1,angle=0,detail=false){const cx=Math.floor(x/40),cz=Math.floor(z/40),key=[cx,cz,name].join(':');if(!placements.has(key))placements.set(key,{name,cx,cz,detail,entries:[]});placements.get(key).entries.push([x,ground(x,z)-.03,z,size,angle]);instanceCount++}
 trees.forEach((v,i)=>{const n=hash(v.x,v.z),bank=Math.abs(v.z-riverZ(v.x)),grove=Math.sin(v.x*.055)+Math.cos(v.z*.08);
  const name=bank<12?'willow-a':grove>.6?(i%29===0?'ancient-oak':i%3?'oak-a':'oak-b'):grove<-.45?(i%3?'pine-a':'fir-a'):'birch-a';place(name,v.x,v.z,1.15+n*.42,n*6.28);
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
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,side:THREE.DoubleSide});
 material.onBeforeCompile=s=>{s.uniforms.valeTime=time;s.vertexShader='uniform float valeTime;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 vec3 origin=instanceMatrix[3].xyz;
 float foliage=step(color.r*1.18,color.g)*step(.06,color.g);
 float strength=min(position.y*.022,.15)*foliage;
 float distanceFade=1.-smoothstep(50.,140.,distance(origin,cameraPosition));
 transformed.x+=sin(valeTime*1.15+origin.x*.31+origin.z*.21+position.y*.4)*strength*distanceFade;
 transformed.z+=cos(valeTime*.83+origin.z*.27)*strength*.45*distanceFade;
 #endif`)};
 const readyPromise=import('https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js').then(({GLTFLoader})=>new GLTFLoader().loadAsync(new URL('./assets/environment/emerald-library.glb?v=realm-emerald-20261010-1',import.meta.url).href)).then(gltf=>{
  gltf.scene.updateMatrixWorld(true);const oldMaterials=new Set();gltf.scene.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld);geometry.computeBoundingSphere();models.set(o.name,geometry);oldMaterials.add(o.material);o.geometry.dispose()});for(const m of oldMaterials)m.dispose();
  for(const name of placements.values())if(!models.has(name.name)&&!models.has(name.name+'-near'))throw Error('Incomplete Emerald Vale library: '+name.name);
  for(const p of placements.values())jobs.push(()=>{const near=models.get(p.name+'-near')||models.get(p.name),far=models.get(p.name+'-far')||near,m=new THREE.InstancedMesh(near,material,p.entries.length);
   m.name='Vale '+p.name;p.entries.forEach(([x,y,z,s,a],i)=>{dummy.position.set(x,y,z);dummy.scale.setScalar(s);dummy.rotation.set(0,a,0);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix)});m.computeBoundingSphere();m.receiveShadow=true;m.visible=false;root.add(m);cells.push({m,near,far,x:p.cx*40+20,z:p.cz*40+20,detail:p.detail,lod:'near'});
  });loaded=true;
 }).catch(error=>{failed=true;root.visible=false;placements.clear();for(const geometry of models.values())geometry.dispose();models.clear();material.dispose();console.warn('Emerald Vale assets unavailable; original scenery retained.',error.message)});
 function update(dt,clock){time.value=clock;
  // Reuse the gesture-unlocked game context. Two bounded filtered noise voices, no downloads.
  const audio=api.audioContext;
  if(!ambience&&audio?.state==='running'&&api.settings.sound){const buffer=audio.createBuffer(1,audio.sampleRate*2,audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(hash(i,43)-.5)*2;
   ambience=[450,1700].map(frequency=>{const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;source.loop=true;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.55;gain.gain.value=0;source.connect(filter).connect(gain).connect(audio.destination);source.start();return gain});
  }
  if(ambience){const p=hero.root.position,on=ready&&api.active&&api.settings.sound&&!document.hidden&&inVale(p.x,p.z);ambience[0].gain.setTargetAtTime(on ? .008 : 0,audio.currentTime,.5);ambience[1].gain.setTargetAtTime(on ? .023*Math.max(0,1-Math.abs(p.z-riverZ(p.x))/22) : 0,audio.currentTime,.4)}
  const begin=performance.now();let built=0;while(jobs.length&&built<3&&performance.now()-begin<3){jobs.shift()();built++}
  if(loaded&&!ready&&!jobs.length){ready=true;placements.clear();frontier.setValeAssetsReady(true)}
  root.visible=ready&&hero.root.position.x<200;tick+=dt;if(tick<.2)return;tick=0;const low=api.settings.quality==='low',nearLimit=low?34:75,reach=low?185:245;
  for(const c of cells){const d=Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z);c.m.visible=root.visible&&d<(c.detail?(low?58:82):reach);c.m.castShadow=!low&&!c.detail&&d<55;const next=d>nearLimit+12?'far':d<nearLimit-12?'near':c.lod;if(next!==c.lod){c.lod=next;c.m.geometry=next==='near'?c.near:c.far;c.m.computeBoundingSphere()}}
 }
 return{root,update,readyPromise,trees,cells,models,bounds:VALE,get ready(){return ready},get failed(){return failed},get instanceCount(){return instanceCount},get pending(){return jobs.length}};
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
