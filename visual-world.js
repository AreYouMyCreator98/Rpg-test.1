// Presentation only. No save, item, enemy, network or collision ownership.
// Repeated decoration is instanced by material in spatial cells; no external assets.
export function installVisualWorld(api) {
  const {THREE,scene,renderer,hero,geo,mat,ground,surface,pathDist,riverZ,living,frontier}=api;
  const root=new THREE.Group();root.name='Cinematic overworld';scene.add(root);
  const sky=new THREE.Mesh(new THREE.SphereGeometry(230,20,12),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{horizon:{value:new THREE.Color(0x9dbab0)},zenith:{value:new THREE.Color(0x6290aa)}},
    vertexShader:`varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform vec3 horizon;uniform vec3 zenith;varying vec3 direction;void main(){float h=pow(max(normalize(direction).y,0.0),.6);gl_FragColor=vec4(mix(horizon,zenith,h),1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`
  }));sky.frustumCulled=false;sky.renderOrder=-2;root.add(sky);
  const batches=new Map(),chunks=[],dummy=new THREE.Object3D(),color=new THREE.Color();
  let seed=51984;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296),range=(a,b)=>a+(b-a)*random();
  const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.12,.5,.12],3));bladeGeometry.computeVertexNormals();
  const decorativeGeo={...geo,blade:bladeGeometry};
  // Split the existing terrain along its original triangles. Heights, colours and navigation
  // are identical, but WebGL can now frustum-cull terrain behind the camera.
  const terrainTiles=new Map(),source=api.terrain.geometry,index=source.index;
  const terrainAO=new Float32Array(source.attributes.position.count),tp=source.attributes.position;
  for(let i=0;i<tp.count;i++){
    const x=tp.getX(i),z=tp.getZ(i);let shade=0;
    for(const o of api.nearbyObstacles(x,z))if(o.r===.5||o.r===.55||o.r>=3){const d=Math.hypot(x-o.x,z-o.z);shade+=Math.exp(-d*d/(o.r>=3?22:14))*.24}
    terrainAO[i]=Math.max(.65,1-shade);
  }
  for(let i=0;i<index.count;i+=3){
    const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),p=source.attributes.position;
    const tx=Math.floor((p.getX(a)+p.getX(b)+p.getX(c))/3/64),tz=Math.floor((p.getZ(a)+p.getZ(b)+p.getZ(c))/3/64),key=tx+','+tz;
    if(!terrainTiles.has(key))terrainTiles.set(key,{p:[],n:[],c:[]});const out=terrainTiles.get(key);
    for(const k of [a,b,c])for(const [name,values]of [['position',out.p],['normal',out.n],['color',out.c]]){const attr=source.attributes[name];const ao=name==='color'?terrainAO[k]:1;values.push(attr.getX(k)*ao,attr.getY(k)*ao,attr.getZ(k)*ao)}
  }
  for(const t of terrainTiles.values()){const g=new THREE.BufferGeometry();for(const [name,values]of [['position',t.p],['normal',t.n],['color',t.c]])g.setAttribute(name,new THREE.Float32BufferAttribute(values,3));g.computeBoundingSphere();const m=new THREE.Mesh(g,api.terrain.material);m.receiveShadow=true;root.add(m)}
  scene.remove(api.terrain);source.dispose();terrainTiles.clear();
  const settlements=[{x:0,z:64,kind:'village'},...frontier.settlements];
  const clear=(x,z,r=1)=>api.nearbyObstacles(x,z).every(o=>Math.hypot(o.x-x,o.z-z)>o.r+r);
  function add(shape,tint,x,y,z,sx,sy,sz,ry=0,rz=0,detail=false,rx=0) {
    const cx=Math.floor(x/64),cz=Math.floor(z/64),key=[cx,cz,shape,detail].join(':');
    if(!batches.has(key))batches.set(key,{cx,cz,shape,tint,detail,entries:[]});
    batches.get(key).entries.push([x,y,z,sx,sy,sz,ry,rz,rx,tint]);
  }
  // Clumps frame the existing route, never close a traversable passage.
  // Trees grow only around existing trunks: collision footprints and the map remain valid.
  const treeRoots=[];
  for(const o of api.obstacles)if(o.r===.55||o.r===.5)treeRoots.push(o);
  for(let i=0;i<treeRoots.length;i++){
    const o=treeRoots[i],x=o.x,z=o.z,y=ground(x,z),h=range(5.5,9.8);
    if(z<-250)continue;
    // Understorey around existing roots, fern fronds and emerald lower branches.
    if(i%3===0)for(let j=0;j<3;j++)add('cone',0x20583e,x,y+h*(.32+j*.22),z,h*(.25-j*.052),h*.48,h*(.25-j*.052),i*.7);
    for(let j=0;j<3;j++){
      const a=range(0,6.28),r=range(.65,2),xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
      if(pathDist(xx,zz)<2.8)continue;
      add('orb',j%2?0x3c743f:0x295d3e,xx,ground(xx,zz)+.28,zz,.7,.48,.6,a,0,true);
    }
  }
  // Dense but low-triangle grass, woodland ferns, wildflower beds and bank stones.
  for(let i=0;i<15500;i++){
    const x=range(-327,177),z=range(-337,177),p=pathDist(x,z),bank=Math.abs(z-riverZ(x));
    if(z<-260||bank<5||p<2.5||!clear(x,z,.2))continue;
    const town=settlements.find(s=>Math.hypot(x-s.x,z-s.z)<(s.kind==='city'?34:20));
    if(town&&random()<.7)continue;
    const y=ground(x,z),a=range(0,6.28),h=range(.18,.55),leaf=i%3?0x5d904c:0x3f7945;
    for(let j=0;j<3;j++)add('blade',leaf,x+(j-1)*.12,y+h/2,z+(j%2)*.12,.055,h,.1,a+j,0,true);
    if(i%17===0)for(let j=0;j<3;j++)add('orb',i%2?0xead7a0:0x9eafd8,x+j*.14,y+h+.03,z,.075,.045,.075,0,0,true);
    if(bank<8&&i%4===0)add('orb',0x77887a,x,y+.15,z,range(.25,.7),.28,range(.3,.65),a);
    if(i%23===0)for(let j=0;j<5;j++)add('cone',0x3f8053,x,y+.23,z,.1,.7,.055,a+j*1.256,.9,true);
  }
  // Hand-placed vegetation islands around the village's edges leave the smith approach clear.
  for(const [x,z] of [[-20,62],[20,63],[-18,48],[18,46],[-10,46],[10,46],[-20,76],[21,78]]){
    const y=ground(x,z);
    for(let j=0;j<4;j++)add('orb',j%2?0x436e43:0x2f6540,x+Math.sin(j*2)*1.5,y+.4,z+Math.cos(j*2)*1.2,.9,.7,.9,j);
    for(let j=0;j<10;j++){
      const xx=x+range(-2.4,2.4),zz=z+range(-2,2);add('blade',0x72984c,xx,ground(xx,zz)+.25,zz,.13,.5,.12,j,0,true);
      add('orb',j%3?0xdccfa2:0xabbde5,xx,ground(xx,zz)+.5,zz,.09,.07,.09,0,0,true);
    }
  }
  // Close-range gardens and grass islands break up the village's broad clear ground.
  for(let i=0;i<2400;i++){
    const x=range(-24,24),z=range(42,82),d=pathDist(x,z);
    if(d<2.65||Math.hypot(x,z-64)<2.2||!clear(x,z,.5)||living.npcs.some(n=>Math.hypot(x-n.x,z-n.z)<1.8))continue;
    // Low-frequency clusters, rather than a uniform carpet; merchant and forge lanes stay open.
    if(Math.sin(x*.7)*Math.cos(z*.6)<-.1||Math.abs(z-58)<1.1)continue;
    const y=ground(x,z),h=range(.15,.42),a=range(0,6.28);
    for(let j=0;j<3;j++)add('blade',i%3?0x638b44:0x477944,x+j*.08,y+h/2,z,.13,h,.075,a+j,0,true);
    if(i%11===0)add('orb',i%2?0xddd6ab:0xa5bada,x,y+h,z,.065,.05,.065,0,0,true);
    if(i%47===0)add('orb',0x3f713f,x,y+.15,z,.36,.27,.32,a,0,true);
  }
  // Individual cobbles and worn margins follow the real navigation paths.
  for(let i=0;i<6500;i++){
    const x=range(-320,175),z=range(-330,175),d=pathDist(x,z);
    if(d<1.7||d>3.4||Math.abs(z-riverZ(x))<8||!clear(x,z,.35))continue;
    add('orb',i%2?0x9a9873:0x777f61,x,ground(x,z)-.015,z,.18,.055,.3,range(0,6.28),0,true);
  }
  // Village lane stonework. Tiny stones are traversable; buildings retain existing collision.
  for(const s of settlements)for(let i=0;i<80;i++){
    const x=s.x+range(-7,7),z=s.z+range(-12,12);
    if(!clear(x,z,.65)||Math.hypot(x-s.x,z-s.z)<2)continue;
    add('orb',i%2?0x96977b:0xa8a080,x,ground(x,z)+.01,z,range(.18,.38),.045,range(.2,.5),range(0,6.28),0,true);
  }
  const buildings=[...living.buildings.map(b=>({...b,w:5.4,d:4.4,h:3.3})),...frontier.structures.filter(s=>s.kind==='house').map(b=>({...b,h:b.w>5?5:3}))];
  for(const b of buildings){
    const {x,z,w,d,h}=b,y=ground(x,z);
    // Roof courses, ridge caps, diagonal timber braces, masonry and shuttered windows.
    for(const side of [-1,1]){
      for(let row=0;row<4;row++)add('box',row%2?0x475b50:0x52675b,x+side*w*(.08+row*.125),y+h+1.45-row*.32,z,.11,.12,d+.65,0,-side*.48);
      for(let k=0;k<3;k++)add('box',0x705139,x+(k-1)*w*.3,y+h*.47,z+side*(d/2+.09),.1,h*.83,.12,0,(k%2?1:-1)*.65);
      for(const xx of [-w*.3,w*.3])for(const lr of [-1,1])add('box',0x6b5940,x+xx+lr*.47,y+h*.6,z+side*(d/2+.12),.2,.96,.1);
      for(let j=0;j<Math.floor(w);j++)add('box',j%2?0x889080:0x758173,x-w/2+j+.5,y+.17,z+side*(d/2+.16),.83,.3,.26);
    }
    add('box',0x647467,x,y+h+1.63,z,.3,.18,d+.85);
    // Stacked chimney stone and an iron cap give the skyline readable silhouettes.
    add('box',0x818a79,x+w*.3,y+h+1.25,z-.7,.62,2.3,.65);
    add('box',0x535d51,x+w*.3,y+h+2.4,z-.7,.8,.14,.83);
  }
  // Bake the existing static building surfaces together by spatial cell. Preserve signs,
  // glowing windows and all interactive/animated objects; no runtime geometry churn.
  const masonry=new Map(),v=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3();
  scene.updateMatrixWorld(true);
  for(const b of buildings)if(b.g)b.g.traverse(m=>{
    if(!m.isMesh||m.material.map||m.material.emissive?.getHex()||!m.geometry.attributes.normal)return;
    const key=Math.floor(b.x/64)+','+Math.floor(b.z/64);
    if(!masonry.has(key))masonry.set(key,{x:Math.floor(b.x/64)*64+32,z:Math.floor(b.z/64)*64+32,p:[],n:[],c:[]});
    const out=masonry.get(key),g=m.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
    nm.getNormalMatrix(m.matrixWorld);
    for(let j=0;j<(index?index.count:p.count);j++){
      const k=index?index.getX(j):j;v.fromBufferAttribute(p,k).applyMatrix4(m.matrixWorld);normal.fromBufferAttribute(n,k).applyNormalMatrix(nm);
      out.p.push(v.x,v.y,v.z);out.n.push(normal.x,normal.y,normal.z);out.c.push(m.material.color.r,m.material.color.g,m.material.color.b);
    }
    m.visible=false;
  });
  const masonryMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9,side:THREE.DoubleSide});
  for(const b of masonry.values()){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.computeBoundingSphere();
    const m=new THREE.Mesh(g,masonryMat);m.castShadow=m.receiveShadow=true;root.add(m);chunks.push({m,x:b.x,z:b.z,detail:false,sky:false});
  }
  // Lanterns use emissive glass and a procedural halo, not a light for every post.
  const haloCanvas=document.createElement('canvas');haloCanvas.width=haloCanvas.height=64;
  const ctx=haloCanvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,32);
  gradient.addColorStop(0,'rgba(255,222,146,.7)');gradient.addColorStop(.22,'rgba(255,191,87,.23)');gradient.addColorStop(1,'rgba(255,180,70,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
  const haloTexture=new THREE.CanvasTexture(haloCanvas);haloTexture.colorSpace=THREE.SRGBColorSpace;
  const haloMaterial=new THREE.SpriteMaterial({map:haloTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
  const lanternMaterial=mat(0xffdb93,{emissive:0xffb747,emissiveIntensity:1.5,roughness:.45});
  const lanterns=[];
  function lantern(x,z){const y=ground(x,z);
    add('box',0x705335,x,y+1.9,z,.18,3.8,.18);add('box',0x8b693d,x+.3,y+3.65,z,.85,.17,.18);
    add('box',0x414c3b,x+.6,y+3.32,z,.055,.5,.055);
    add('box',0x425141,x+.6,y+2.71,z,.56,.12,.56);add('cone',0x475a43,x+.6,y+3.25,z,.43,.25,.43,Math.PI/4);
    for(const a of [-1,1])for(const b of [-1,1])add('box',0x514b32,x+.6+a*.23,y+2.98,z+b*.23,.05,.55,.05);
    const glow=new THREE.Mesh(geo.box,lanternMaterial);glow.position.set(x+.6,y+2.97,z);glow.scale.set(.35,.44,.35);root.add(glow);
    const halo=new THREE.Sprite(haloMaterial);halo.position.copy(glow.position);halo.scale.setScalar(1.6);root.add(halo);lanterns.push({glow,halo,x,z});
  }
  [[-6,56],[5,57],[-8,69],[8,68]].forEach(p=>lantern(...p));
  for(const s of frontier.settlements)for(const dx of [-5,5])lantern(s.x+dx,s.z-7);
  // Fences on existing building edges, plus forge tools, log stacks and market baskets.
  for(const b of buildings){const y=ground(b.x,b.z);for(let k=0;k<3;k++){
    add('cyl',0x7e603d,b.x-b.w/2+.3+k*.35,y+.28,b.z-b.d/2-.3,.14,.8,.14,0,Math.PI/2);
    add('orb',0xb89a63,b.x-b.w/2+.72+k*.35,y+.28,b.z-b.d/2-.3,.025,.12,.12);
  }}
  for(const side of [-1,1])for(let k=0;k<4;k++){
    const x=side*(9+k*2),z=48,y=ground(x,z);add('box',0x7d603d,x,y+.65,z,.14,1.3,.16);
    if(k<3)for(const h of [.4,.95])add('box',0x93744a,x+side,y+h,z,2,.12,.12);
  }
  // A raised canopy extends from the existing smithy over the forge.
  for(const x of [-9.1,-5.7])add('box',0x6f5133,x,ground(x,63)+1.55,64.8,.16,3.1,.16);
  add('box',0x5d6750,-7.4,ground(-7,63)+3.1,63.5,4.1,.16,3.5,0,0,false,.12);
  for(let k=0;k<5;k++)add('box',0x8a6c46,-9+k*.8,ground(-7,63)+3.22,63.5,.06,.08,3.6,0,0,false,.12);
  // Joinery and support piles follow the three existing, fully traversable bridges.
  for(const x of [-14,35,-180])for(const side of [-1,1]){
    const z=riverZ(x);add('box',0x5b4c35,x+side*1.8,.08,z,.25,.38,16.8);
    for(const dz of [-6,0,6]){add('cyl',0x64513a,x+side*2,-.05,z+dz,.23,2.4,.23);add('box',0xb29c6a,x+side*2,1.65,z+dz,.36,.12,.36)}
  }
  // Extend existing ruin pillars upward, preserving their exact footprint and boss arena.
  for(const x of [-16,0]){const z=-73,y=ground(x,z),h=x===0?29:22;
    add('cyl',0x8e9e92,x,y+h/2,z,.9,h,.9);add('cyl',0x8e9e92,x,y+h-4,z,1.8,8,1.8);add('cone',0x45665e,x,y+h+2.3,z,2.4,5,2.4);
    for(let j=0;j<4;j++)add('box',0xabc0ac,x,y+4+j*4,z,2,.25,2);
    for(let j=0;j<3;j++)add('box',0x394c45,x,y+7+j*4,z+1,.28,1.1,.05);
  }
  add('box',0x8d9d90,-8,ground(-8,-73)+11,-73,16,2,1.3);
  for(let i=0;i<9;i++)add('box',0xa4b6a0,-16+i*2,ground(-8,-73)+12.5,-73,1,.9,1.5);
  // Layered silhouettes beyond the playable boundary; the playable heights stay unchanged.
  for(let i=0;i<52;i++){
    const angle=i/52*Math.PI*2,x=-75+Math.cos(angle)*310,z=-80+Math.sin(angle)*320,h=range(28,75),y=ground(x,z);
    add('cone',i%2?0x7b9791:0x677f7b,x,y+h*.38,z,range(18,32),h,range(16,30),range(0,6));
    if(h>55)add('cone',0xb6c6b9,x,y+h*.8,z,7,h*.16,7,0);
  }
  // Northern citadel, outside the traversable edge, visible from Frostmere's mountain road.
  for(const [x,z,h] of [[-35,-355,29],[-50,-357,21],[-20,-358,24]]){
    const y=ground(x,z);add('cyl',0x8faaa2,x,y+h/2,z,3,h,3);add('cone',0x415e69,x,y+h+3,z,4,7,4);
    for(let j=0;j<4;j++)add('box',0x607e79,x+(j-1.5)*1.8,y+h,z+2.5,1.1,2,1.1);
  }
  add('box',0x8ca59b,-35,ground(-35,-355)+9,-357,31,13,4);
  const wind={value:0},grassMaterial=mat(0xffffff,{side:THREE.DoubleSide});
  grassMaterial.onBeforeCompile=shader=>{shader.uniforms.forestWind=wind;shader.vertexShader='uniform float forestWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    #ifdef USE_INSTANCING
    float phase=instanceMatrix[3].x*.4+instanceMatrix[3].z*.3;
    transformed.x+=sin(forestWind*1.4+phase)*.18*max(position.y+.5,0.);
    #endif`)};
  api.water.material.onBeforeCompile=shader=>{
    shader.uniforms.riverTime=wind;
    shader.vertexShader='varying vec2 riverPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      riverPosition=(modelMatrix*vec4(transformed,1.0)).xz;`);
    shader.fragmentShader='uniform float riverTime;varying vec2 riverPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float ripple=sin(riverPosition.x*.8+riverTime)*sin(riverPosition.y*1.8-riverTime*.7);
      float bank=abs(riverPosition.y-9.0-sin(riverPosition.x*.052)*7.0);
      diffuseColor.rgb*=.94+.06*ripple;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.56,.72,.57),smoothstep(3.3,3.9,bank)*(.35+.1*ripple));`);
  };
  // Flush once. All transforms remain static and GPU buffers are reused across frames.
  for(const b of batches.values()){
    const m=new THREE.InstancedMesh(decorativeGeo[b.shape],b.shape==='blade'?grassMaterial:mat(0xffffff),b.entries.length);
    b.entries.forEach((e,i)=>{dummy.position.set(...e.slice(0,3));dummy.scale.set(...e.slice(3,6));dummy.rotation.set(e[8],e[6],e[7]);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);color.setHex(e[9]).multiplyScalar(.88+random()*.12);m.setColorAt(i,color)});
    m.castShadow=!b.detail;m.receiveShadow=true;m.computeBoundingSphere();root.add(m);chunks.push({m,x:b.cx*64+32,z:b.cz*64+32,detail:b.detail,sky:b.cx*64<-330||b.cx*64>180||b.cz*64<-340||b.cz*64>180||b.entries.some(e=>e[2]===-73&&e[0]>=-16&&e[0]<=0)});
  }
  batches.clear();
  // Soft grounding remains visible on Low, where the real-time shadow map is disabled.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,3,32,32,32);sg.addColorStop(0,'rgba(14,32,23,.45)');sg.addColorStop(.45,'rgba(14,32,23,.25)');sg.addColorStop(1,'rgba(14,32,23,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
  const shadowGeometry=new THREE.PlaneGeometry(1,1);shadowGeometry.rotateX(-Math.PI/2);
  const actors=[hero,...living.npcs,...api.enemies],shadows=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,actors.length);shadows.frustumCulled=false;scene.add(shadows);
  const ambient=new THREE.DirectionalLight(0xa7c9be,.36);ambient.position.set(35,20,-40);scene.add(ambient);
  let elapsed=0,timer=1,sampleTime=0,samples=0,slow=0,fast=0,scale=1,quality='';
  const baseRatio=()=>Math.min(devicePixelRatio,{low:1,medium:1.5,high:2}[api.settings.quality]||1);
  function resetResolution(){scale=1;quality=api.settings.quality;sampleTime=samples=slow=fast=0;renderer.setPixelRatio(baseRatio());}
  // Hysteresis prevents oscillation. Resolution only; combat and input continue every RAF.
  function sampleFrame(seconds){
    if(!api.active||document.hidden||seconds<=0||seconds>.25)return;
    sampleTime+=seconds;samples++;if(sampleTime<3)return;
    const ms=sampleTime/samples*1000;sampleTime=samples=0;
    slow=ms>36?slow+1:0;fast=ms<23?fast+1:0;
    const next=slow>=2?Math.max(.65,scale-.1):fast>=4?Math.min(1,scale+.05):scale;
    if(next!==scale){scale=next;slow=fast=0;renderer.setPixelRatio(baseRatio()*scale)}
  }
  function update(dt,time,frameSeconds){
    elapsed+=dt;timer+=dt;wind.value=time;const inside=hero.root.position.x>200;root.visible=!inside;sky.position.copy(hero.root.position);ambient.intensity=inside?.08:.36;
    if(quality!==api.settings.quality)resetResolution();sampleFrame(frameSeconds);
    if(timer>.25){timer=0;const reach=api.settings.quality==='low'?82:api.settings.quality==='medium'?115:155;
      for(const c of chunks){const d=Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z);c.m.visible=c.sky||d<(c.detail?reach*.62:reach+40);c.m.castShadow=!c.detail&&d<45}
      for(const l of lanterns){const visible=Math.hypot(l.x-hero.root.position.x,l.z-hero.root.position.z)<70;l.glow.visible=l.halo.visible=visible}
    }
    lanternMaterial.emissiveIntensity=1.5+Math.sin(time*3)*.08;
    actors.forEach((a,i)=>{const p=a.root.position,on=a.root.visible&&(p.x>200)===inside&&p.distanceToSquared(hero.root.position)<2500;dummy.position.set(p.x,surface(p.x,p.z)+.035,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(on?1.5*(a.scale||1):0,1,on?1.2*(a.scale||1):0);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix)});shadows.instanceMatrix.needsUpdate=true;
  }
  return {root,chunks,lanterns,shadows,resetResolution,sampleFrame,update,get resolutionScale(){return scale}};
}
