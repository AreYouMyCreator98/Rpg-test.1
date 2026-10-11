import {bindResourceMesh} from './resource-visuals.js?v=realm-party-graves-1';
import {installWorldWeather} from './world-weather.js?v=realm-party-graves-1';
import {dressVillage} from './village-art.js?v=realm-party-graves-1';
import {installRiverDetails} from './river-details.js?v=realm-party-graves-1';
import {installEnvironmentLife} from './environment-life.js?v=realm-party-graves-1';
import {graphics,retireInstances} from './graphics.js?v=realm-party-graves-1';
import {createTerrainStream} from './terrain-stream.js?v=realm-party-graves-1';
import {createWesternRange} from './emerald-landscape.js?v=realm-party-graves-1';
import {installEmeraldVale,inVale} from './emerald-vale.js?v=realm-party-graves-1';
// Presentation only. No save, item, enemy, network or collision ownership.
// Repeated decoration is instanced by material in spatial cells; Vale assets are repository-hosted.
export function installVisualWorld(api) {
  const {THREE,scene,renderer,hero,geo,mat,ground,surface,pathDist,riverZ,living,frontier,forestArt,BOUNDS}=api;
  const vale=installEmeraldVale(api),life=installEnvironmentLife(api),riverDetails=installRiverDetails(api);
  const root=new THREE.Group();root.name='Cinematic overworld';scene.add(root);for(const side of ['west','north','east','south'])root.add(createWesternRange(THREE,ground,BOUNDS,side));
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1400,24,14),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{cloudCover:{value:0},cloudLight:{value:1},cloudTime:{value:0},horizon:{value:new THREE.Color(0xa9c9c7)},zenith:{value:new THREE.Color(0x598dbb)}},
    vertexShader:`varying vec3 direction;void main(){direction=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`uniform float cloudTime;uniform float cloudCover;uniform float cloudLight;uniform vec3 horizon;uniform vec3 zenith;varying vec3 direction;
    float hashCloud(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noiseCloud(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hashCloud(i),hashCloud(i+vec2(1,0)),f.x),mix(hashCloud(i+vec2(0,1)),hashCloud(i+vec2(1,1)),f.x),f.y);}
    void main(){vec3 d=normalize(direction);float h=pow(max(d.y,0.0),.6);vec3 skyColor=mix(horizon,zenith,h);
    vec2 uv=d.xz/max(d.y,.08)*2.8+vec2(cloudTime*.002,0.);float cloud=noiseCloud(uv)*.65+noiseCloud(uv*2.1)*.25+noiseCloud(uv*4.3)*.1;
    float cover=smoothstep(.57-cloudCover*.34,.74-cloudCover*.3,cloud)*smoothstep(.015,.15,d.y);skyColor=mix(skyColor,vec3(.88,.94,.94)*cloudLight,cover*.85);gl_FragColor=vec4(skyColor,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`
  }));sky.frustumCulled=false;sky.renderOrder=-2;root.add(sky);
  // Small, generated, mipmapped material textures. No image downloads or extra draws.
  const detailTextures=[];
  function grainTexture(kind){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),pixels=ctx.createImageData(128,128);let seed=kind==='wood'?904:kind==='stone'?138:273;
    for(let y=0;y<128;y++)for(let x=0;x<128;x++){seed=(1664525*seed+1013904223)>>>0;const noise=(seed/4294967296-.5),row=Math.floor(y/32),brick=(x+(row%2)*32)%64;
      let value=kind==='wood'?224+Math.sin(x*.65+Math.sin(y*.08)*1.3)*12+noise*10:kind==='stone'?(y%32<2||brick<2?185:236+noise*15):237+noise*17+Math.sin(x*.3)*Math.sin(y*.2)*7;
      const i=(y*128+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255}
    ctx.putImageData(pixels,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());detailTextures.push(t);return t;
  }
  const earthTexture=grainTexture('earth'),woodTexture=grainTexture('wood'),stoneTexture=grainTexture('stone');
  api.terrain.material.onBeforeCompile=shader=>{shader.uniforms.earthDetail={value:earthTexture};shader.vertexShader='varying vec2 vEarthDetail;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarthDetail=position.xz*.65;');shader.fragmentShader='uniform sampler2D earthDetail;varying vec2 vEarthDetail;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb*=mix(vec3(.48),vec3(1.08),texture2D(earthDetail,vEarthDetail).rgb);');};
  const batches=new Map(),chunks=[],dummy=new THREE.Object3D(),color=new THREE.Color();
  let seed=51984;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296),range=(a,b)=>a+(b-a)*random();
  const bladeGeometry=new THREE.BufferGeometry();bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.5,-.5,0,.5,-.5,0,.12,.5,.12],3));bladeGeometry.computeVertexNormals();
  const mountain=new THREE.ConeGeometry(1,1,20,7),mp=mountain.attributes.position,mc=[];
  for(let i=0;i<mp.count;i++){const y=mp.getY(i),a=Math.atan2(mp.getZ(i),mp.getX(i)),r=1+.22*Math.sin(a*5+y*7)+.12*Math.cos(a*9-y*4);mp.setXYZ(i,mp.getX(i)*r+.2*(y+.5)**2,y+.045*Math.sin(a*3)*(1-Math.abs(y)*2),mp.getZ(i)*r);const snow=y>.29+.045*Math.sin(a*7),c=new THREE.Color(snow?0xe0edf0:y>-.1?0x829db0:0x69887f);mc.push(c.r,c.g,c.b)}
  mountain.setAttribute('color',new THREE.Float32BufferAttribute(mc,3));mountain.computeVertexNormals();
  const decorativeGeo={...geo,cone:forestArt.pine,canopy:forestArt.canopy,mountain,blade:bladeGeometry};
  const terrainStream=createTerrainStream(api,root),terrainLOD=terrainStream.cells,farTerrain=[];
  scene.remove(api.terrain);api.terrain.geometry.dispose();
  const settlements=[{x:0,z:64,kind:'village'},...frontier.settlements];
  const clear=(x,z,r=1)=>api.nearbyObstacles(x,z).every(o=>Math.hypot(o.x-x,o.z-z)>o.r+r);
  function add(shape,tint,x,y,z,sx,sy,sz,ry=0,rz=0,detail=false,rx=0,resource=null) {
    const cx=shape==='mountain'?0:Math.floor(x/64),cz=shape==='mountain'?0:Math.floor(z/64),key=[cx,cz,shape,detail,inVale(x,z)].join(':');
    if(!batches.has(key))batches.set(key,{cx,cz,shape,tint,detail,vale:inVale(x,z),entries:[]});
    batches.get(key).entries.push([x,y,z,sx,sy,sz,ry,rz,rx,tint,resource?.x,resource?.z]);
  }
  // Clumps frame the existing route, never close a traversable passage.
  // Trees grow only around existing trunks: collision footprints and the map remain valid.
  const treeRoots=[];
  for(const o of api.obstacles)if(o.r===.55||o.r===.5)treeRoots.push(o);
  for(let i=0;i<treeRoots.length;i++){
    const o=treeRoots[i],x=o.x,z=o.z,y=ground(x,z),h=range(5.5,9.8);
    if((z<-250&&z>=-340&&x>=-330)||z<-720)continue;
    // Taller, rounded crown clusters create layered anime-inspired woodland.
    if(i%6===1){for(let j=0;j<3;j++)add('canopy',j===2?0x5e9c54:0x397f4d,x+Math.sin(j*2.4)*1.3,y+h*(.65+j*.09),z+Math.cos(j*2.4)*1.1,2.3,h*.23,2.15,i*.4,0,false,0,{x,z});}
    // Understorey around existing roots, fern fronds and emerald lower branches.
    if(i%3===0)for(let j=0;j<3;j++)add('cone',0x20583e,x,y+h*(.32+j*.22),z,h*(.25-j*.052),h*.48,h*(.25-j*.052),i*.7,0,false,0,{x,z});
    for(let j=0;j<3;j++){
      const a=range(0,6.28),r=range(.65,2),xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r;
      if(pathDist(xx,zz)<2.8)continue;
      add('orb',j%2?0x3c743f:0x295d3e,xx,ground(xx,zz)+.28,zz,.7,.48,.6,a,0,true);
    }
  }
  // Dense but low-triangle grass, woodland ferns, wildflower beds and bank stones.
  for(let i=0;i<38000;i++){
    const x=range(BOUNDS.left+3,BOUNDS.right-3),z=range(BOUNDS.top+3,BOUNDS.bottom-3),p=pathDist(x,z),bank=Math.abs(z-riverZ(x));
    if((z<-260&&z>=-340&&x>=-330)||z<-710||bank<5||p<2.5||!clear(x,z,.2))continue;
    const town=settlements.find(s=>Math.hypot(x-s.x,z-s.z)<(s.kind==='city'?72:20));
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
  for(let i=0;i<15000;i++){
    const x=range(BOUNDS.left+5,BOUNDS.right-5),z=range(BOUNDS.top+5,BOUNDS.bottom-5),d=pathDist(x,z);
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
      for(let row=0;row<(living.buildings.some(v=>v.g===b.g)?0:4);row++)add('box',row%2?0x475b50:0x52675b,x+side*w*(.08+row*.125),y+h+1.45-row*.32,z,.11,.12,d+.65,0,-side*.48);
      for(let k=0;k<3;k++)add('box',0x705139,x+(k-1)*w*.3,y+h*.47,z+side*(d/2+.09),.1,h*.83,.12,0,(k%2?1:-1)*.65);
      for(const xx of [-w*.3,w*.3])for(const lr of [-1,1])add('box',0x6b5940,x+xx+lr*.47,y+h*.6,z+side*(d/2+.12),.2,.96,.1);
      for(let j=0;j<Math.floor(w);j++)add('box',j%2?0x889080:0x758173,x-w/2+j+.5,y+.17,z+side*(d/2+.16),.83,.3,.26);
    }
    add('box',0x647467,x,y+h+1.63,z,.3,.18,d+.85);
    // Stacked chimney stone and an iron cap give the skyline readable silhouettes.
    add('box',0x818a79,x+w*.3,y+h+1.25,z-.7,.62,2.3,.65);
    add('box',0x535d51,x+w*.3,y+h+2.4,z-.7,.8,.14,.83);
  }
  dressVillage({THREE,buildings,ground,add,geometries:decorativeGeo});
  // Bake the existing static building surfaces together by spatial cell. Preserve signs,
  // glowing windows and all interactive/animated objects; no runtime geometry churn.
  const masonry=new Map(),v=new THREE.Vector3(),normal=new THREE.Vector3(),nm=new THREE.Matrix3();
  scene.updateMatrixWorld(true);
  for(const b of buildings)if(b.g)b.g.traverse(m=>{
    if(!m.isMesh||m.material.map||m.material.emissive?.getHex()||!m.geometry.attributes.normal)return;
    const key=Math.floor(b.x/64)+','+Math.floor(b.z/64);
    if(!masonry.has(key))masonry.set(key,{x:Math.floor(b.x/64)*64+32,z:Math.floor(b.z/64)*64+32,p:[],n:[],c:[],kind:[]});
    const out=masonry.get(key),g=m.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index;
    nm.getNormalMatrix(m.matrixWorld);
    for(let j=0;j<(index?index.count:p.count);j++){
      const k=index?index.getX(j):j;v.fromBufferAttribute(p,k).applyMatrix4(m.matrixWorld);normal.fromBufferAttribute(n,k).applyNormalMatrix(nm);
      out.p.push(v.x,v.y,v.z);out.n.push(normal.x,normal.y,normal.z);const base=m.material.color.clone();if(living.buildings.some(v=>v.g===b.g)&&Math.abs(base.r-base.g)<.18&&base.r>.4)base.lerp(new THREE.Color(0xc6b393),.28);out.c.push(base.r,base.g,base.b);const tint=m.material.color;out.kind.push(tint.r<.4&&tint.r>tint.g*1.3&&tint.g>tint.b*1.3?1:0);
    }
    m.visible=false;
  });
  const masonryMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.9,side:THREE.DoubleSide});
  masonryMat.onBeforeCompile=shader=>{shader.uniforms.woodDetail={value:woodTexture};shader.uniforms.stoneDetail={value:stoneTexture};shader.vertexShader='attribute float surfaceKind;varying float vSurfaceKind;varying vec2 vBuildingDetail;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    vSurfaceKind=surfaceKind;vec3 n=abs(normal);vBuildingDetail=n.y>.7?position.xz:(n.x>n.z?position.zy:position.xy);`);
    shader.fragmentShader='uniform sampler2D woodDetail;uniform sampler2D stoneDetail;varying float vSurfaceKind;varying vec2 vBuildingDetail;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    vec3 grain=vSurfaceKind>.5?texture2D(woodDetail,vBuildingDetail*vec2(1.5,.35)).rgb:texture2D(stoneDetail,vBuildingDetail*.4).rgb;
    diffuseColor.rgb*=mix(vec3(.65),vec3(1.04),grain);`);};
  for(const b of masonry.values()){
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));g.setAttribute('surfaceKind',new THREE.Float32BufferAttribute(b.kind,1));g.computeBoundingSphere();
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
  for(const x of [-14,35,-180,-430])for(const side of [-1,1]){
    const z=riverZ(x);add('box',0x5b4c35,x+side*1.8,.08,z,.25,.38,16.8);
    for(const dz of [-6,0,6]){add('cyl',0x64513a,x+side*2,-.05,z+dz,.23,2.4,.23);add('box',0xb29c6a,x+side*2,1.65,z+dz,.36,.12,.36)}
  }
  // Gruk’s skyline and battlements are owned by boss-arenas.js.
  // Scenic trail markers are appended to the POI list after every existing content module.
  for(const p of frontier.wildlands){const y=ground(p.x,p.z);
    for(const side of [-1,1]){add('cyl',0x9cae9f,p.x+side*4,y+2.5,p.z, .55,5,.55);add('orb',0xc8d6b4,p.x+side*4,y+5,p.z,.85,.45,.85)}
    add('box',0x9baa92,p.x,y+5.3,p.z,9,.5,1.1);
    for(let j=0;j<7;j++)add('orb',0x879383,p.x-3+j,y+.03,p.z,.35,.05,.55,j);
  }
  // Northern citadel, outside the traversable edge, visible from Frostmere's mountain road.
  for(const [x,z,h] of [[-70,-900,60],[-92,-903,44],[-48,-904,50]]){
    const y=ground(x,z);add('cyl',0x8faaa2,x,y+h/2,z,3,h,3);add('cone',0x415e69,x,y+h+3,z,4,7,4);
    for(let j=0;j<4;j++)add('box',0x607e79,x+(j-1.5)*1.8,y+h,z+2.5,1.1,2,1.1);
  }
  add('box',0x8ca59b,-70,ground(-70,-900)+16,-903,45,24,7);
  const wind={value:0},grassMaterial=mat(0xffffff,{side:THREE.DoubleSide});
  grassMaterial.onBeforeCompile=shader=>{shader.uniforms.forestWind=wind;shader.vertexShader='uniform float forestWind;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    #ifdef USE_INSTANCING
    float phase=instanceMatrix[3].x*.4+instanceMatrix[3].z*.3;
    transformed.x+=sin(forestWind*1.4+phase)*.18*max(position.y+.5,0.);
    #endif`)};
  // A small deterministic grass window follows the camera region. It adds rich
  // close ground cover without allocating dense foliage over the entire large map.
  const meadow=new THREE.InstancedMesh(bladeGeometry,grassMaterial,6000);meadow.name='Streamed meadow';meadow.receiveShadow=true;meadow.castShadow=false;meadow.frustumCulled=false;root.add(meadow);let meadowCell='';
  function refreshMeadow(){const cx=Math.floor(hero.root.position.x/12)*6,cz=Math.floor(hero.root.position.z/12)*6,key=cx+','+cz;if(key===meadowCell)return;meadowCell=key;let count=0;
    const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)};
    for(let ix=cx-17;ix<=cx+17;ix++)for(let iz=cz-17;iz<=cz+17;iz++){
      const n=hash(ix,iz),x=ix*2+(n-.5)*1.5,z=iz*2+(hash(iz,ix)-.5)*1.5;
      if(x<BOUNDS.left||x>BOUNDS.right||z<BOUNDS.top||z>BOUNDS.bottom||z<-710||(z<-260&&z>=-340&&x>=-330)||x>-90&&x<-20&&z>98&&z<138||pathDist(x,z)<3||Math.abs(z-riverZ(x))<5||!clear(x,z,.2))continue;
      const y=ground(x,z),h=.24+n*.4;for(let j=0;j<4;j++){dummy.position.set(x+Math.sin(j*2)*.15,y+h/2,z+Math.cos(j*2)*.15);dummy.rotation.set(0,n*6.28+j*1.7,.12*Math.sin(j));dummy.scale.set(.13+n*.1,h,.1);dummy.updateMatrix();meadow.setMatrixAt(count,dummy.matrix);color.setHex(j%2?0x65934d:0x477d48);meadow.setColorAt(count++,color)}
    }
    meadow.count=Math.floor(count*graphics(api.settings).density);meadow.instanceMatrix.needsUpdate=true;if(meadow.instanceColor)meadow.instanceColor.needsUpdate=true;
  }
  const waterDetail={value:1};api.water.material.onBeforeCompile=shader=>{shader.uniforms.waterDetail=waterDetail;
    shader.uniforms.riverTime=wind;
    shader.vertexShader='varying vec2 riverPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      riverPosition=(modelMatrix*vec4(transformed,1.0)).xz;`);
    shader.fragmentShader='uniform float waterDetail;uniform float riverTime;varying vec2 riverPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float ripple=sin(riverPosition.x*.8+riverTime)*sin(riverPosition.y*1.8-riverTime*.7);
      float flow=sin(riverPosition.x*3.-riverTime*1.6+sin(riverPosition.y*2.))*sin(riverPosition.y*5.+riverTime*.4);
      float bank=abs(riverPosition.y-9.0-sin(riverPosition.x*.052)*7.0);
      diffuseColor.rgb=mix(vec3(.025,.32,.31),vec3(.10,.64,.52),smoothstep(0.,3.9,bank));
      diffuseColor.rgb+=vec3(.09,.16,.13)*pow(max(flow,0.),12.)*waterDetail;
      diffuseColor.rgb*=.96+.04*ripple;
      diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.56,.72,.57),smoothstep(3.55,3.9,bank)*(.4+.2*ripple));`);
  };
  const mountainMaterial=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,flatShading:true,roughness:1,fog:false});
  mountainMaterial.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight=mix(outgoingLight,vec3(.39,.58,.57),clamp(length(vViewPosition)/1500.,.12,.7));
#include <opaque_fragment>`)};
  // Flush once. All transforms remain static and GPU buffers are reused across frames.
  for(const b of batches.values()){
    const m=new THREE.InstancedMesh(decorativeGeo[b.shape],b.shape==='blade'?grassMaterial:b.shape==='mountain'?mountainMaterial:b.shape==='canopy'?forestArt.leafMaterial:mat(0xffffff,{flatShading:false}),b.entries.length);
    b.entries.forEach((e,i)=>{dummy.position.set(...e.slice(0,3));dummy.scale.set(...e.slice(3,6));dummy.rotation.set(e[8],e[6],e[7]);dummy.updateMatrix();m.setMatrixAt(i,dummy.matrix);color.setHex(e[9]).multiplyScalar(.88+random()*.12);m.setColorAt(i,color)});
    if(['canopy','cone'].includes(b.shape)&&!b.detail)bindResourceMesh(THREE,m,b.entries,ground);m.castShadow=!b.detail;m.receiveShadow=true;m.computeBoundingSphere();root.add(m);chunks.push({m,vale:['canopy','cone'].includes(b.shape)||b.vale&&['orb','blade'].includes(b.shape),x:b.cx*64+32,z:b.cz*64+32,detail:b.detail,sky:b.shape==='mountain'||b.cx*64<BOUNDS.left||b.cx*64>BOUNDS.right||b.cz*64<BOUNDS.top||b.cz*64>BOUNDS.bottom||b.entries.some(e=>e[2]===-73&&e[0]>=-16&&e[0]<=0)});
  }
  batches.clear();
  // Soft grounding remains visible on Low, where the real-time shadow map is disabled.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
  const sc=shadowCanvas.getContext('2d'),sg=sc.createRadialGradient(32,32,3,32,32,32);sg.addColorStop(0,'rgba(14,32,23,.45)');sg.addColorStop(.45,'rgba(14,32,23,.25)');sg.addColorStop(1,'rgba(14,32,23,0)');sc.fillStyle=sg;sc.fillRect(0,0,64,64);
  const shadowMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false});
  const shadowGeometry=new THREE.PlaneGeometry(1,1);shadowGeometry.rotateX(-Math.PI/2);
  const actors=[hero,...living.npcs,...api.enemies],shadows=new THREE.InstancedMesh(shadowGeometry,shadowMaterial,actors.length);shadows.frustumCulled=false;scene.add(shadows);
  const ambient=new THREE.DirectionalLight(0xa7c9be,.36);ambient.position.set(35,20,-40);scene.add(ambient);
  const timings=[];let diagnosticTimer=0;const diagnostic=new URLSearchParams(location.search).has('diagnostics')?document.createElement('pre'):null;if(diagnostic){diagnostic.style.cssText='position:fixed;left:8px;bottom:8px;z-index:99;background:#081c18df;color:#d9e4cd;padding:8px;font:11px monospace;pointer-events:none';document.body.append(diagnostic)}
  let elapsed=0,timer=1,sampleTime=0,samples=0,slow=0,fast=0,scale=1,quality='';
  const baseRatio=()=>{const p=graphics(api.settings);return Math.min(devicePixelRatio,p.ratio)*p.renderScale};
  function resetResolution(){meadowCell='';scale=1;quality=api.settings.quality;sampleTime=samples=slow=fast=0;renderer.setPixelRatio(baseRatio());}
  // Hysteresis prevents oscillation. Resolution only; combat and input continue every RAF.
  function sampleFrame(seconds){
    if(!api.active||document.hidden||seconds<=0||seconds>2)return;
    sampleTime+=seconds;samples++;if(sampleTime<3)return;
    const ms=sampleTime/samples*1000;sampleTime=samples=0;
    const target=1000/(api.settings.frameTarget||30);slow=ms>target*1.15?slow+1:0;fast=ms<target*.75?fast+1:0;
    const next=slow>=2?Math.max(.65,scale-.1):fast>=4?Math.min(1,scale+.05):scale;
    if(next!==scale){scale=next;slow=fast=0;renderer.setPixelRatio(baseRatio()*scale)}
    if(api.settings.quality==='auto'&&((slow>=2&&scale<=.65)||(fast>=4&&scale>=1))){const old=api.settings.autoTier??1,tier=Math.max(0,Math.min(2,old+(slow>=2?-1:1)));slow=fast=0;if(tier!==old){api.settings.autoTier=tier;meadowCell='';const profile=graphics(api.settings);renderer.setPixelRatio(baseRatio()*scale);renderer.shadowMap.enabled=profile.shadow>0;if(api.sun.shadow.mapSize.x!==(profile.shadow||1024)){api.sun.shadow.mapSize.setScalar(profile.shadow||1024);api.sun.shadow.map?.dispose();api.sun.shadow.map=null}}}

  }
  const weather=installWorldWeather(Object.assign(Object.create(api),{sky,ambient}));
  function update(dt,time,frameSeconds){
    const profile=graphics(api.settings);waterDetail.value=profile.water;riverDetails.update(time,profile);life.update(dt,time);vale.update(dt,time);if(frameSeconds>0&&frameSeconds<2){timings.push(frameSeconds*1000);if(timings.length>120)timings.shift()}diagnosticTimer+=dt;if(diagnostic&&diagnosticTimer>1){diagnosticTimer=0;const sorted=[...timings].sort((a,b)=>a-b),avg=timings.reduce((a,b)=>a+b,0)/Math.max(1,timings.length);diagnostic.textContent=`${api.settings.quality}${api.settings.quality==='auto'?' / '+['low','medium','high'][api.settings.autoTier??1]:''} · scale ${scale.toFixed(2)} · ${(1000/avg).toFixed(0)} fps
mean ${avg.toFixed(1)} ms · p95 ${(sorted[Math.floor(sorted.length*.95)]||0).toFixed(1)} ms
${renderer.info.render.calls} draws · ${renderer.info.render.triangles} triangles
Forest ${vale.cells.filter(c=>c.m?.visible).length}/${vale.cells.length} batches · ${vale.activeInstances} active instances
Terrain ${terrainStream.resident} detailed cells · ${chunks.filter(c=>!c.m.userData.retired).length} resident decoration batches
GPU ${renderer.info.memory.geometries} geometries / ${renderer.info.memory.textures} textures
${api.enemies.filter(e=>e.hp>0).length} enemies · slow >33ms ${timings.filter(t=>t>33.3).length}/${timings.length}`;}elapsed+=dt;timer+=dt;wind.value=profile.effects?time:0;forestArt.wind.value=wind.value;const inside=hero.root.position.x>200;root.visible=!inside;if(!inside){scene.fog.density=api.settings.quality==='low'?.0019:.0013;scene.fog.color.setHex(0xa9c9c7)}sky.material.uniforms.cloudTime.value=time;sky.position.copy(hero.root.position);ambient.intensity=inside?.08:.36;
    if(quality!==api.settings.quality)resetResolution();sampleFrame(frameSeconds);
    if(timer>.25){timer=0;if(!inside)refreshMeadow();const reach=profile.distance*.5;
      terrainStream.update(profile);for(const c of api.startingScenery||[]){const d=Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z);retireInstances(c.m,!inside&&!(vale.ready&&c.tree)&&d<profile.distance,time)}
      for(const c of chunks){const d=Math.hypot(c.x-hero.root.position.x,c.z-hero.root.position.z);retireInstances(c.m,!inside&&!(vale.ready&&c.vale)&&(c.sky||d<(c.detail?reach*.62:reach+40)),time);c.m.castShadow=!c.sky&&!c.detail&&d<45}
      for(const l of lanterns){const visible=Math.hypot(l.x-hero.root.position.x,l.z-hero.root.position.z)<70;l.glow.visible=l.halo.visible=visible}
    }
    terrainStream.updateView();lanternMaterial.emissiveIntensity=1.5+Math.sin(time*3)*.08;
    actors.forEach((a,i)=>{const p=a.root.position,on=a.root.visible&&(p.x>200)===inside&&p.distanceToSquared(hero.root.position)<2500;dummy.position.set(p.x,surface(p.x,p.z)+.035,p.z);dummy.rotation.set(0,0,0);dummy.scale.set(on?1.5*(a.scale||1):0,1,on?1.2*(a.scale||1):0);dummy.updateMatrix();shadows.setMatrixAt(i,dummy.matrix)});shadows.instanceMatrix.needsUpdate=true;weather.update(dt);
  }
  return {weather,riverDetails,life,terrainStream,vale,root,chunks,meadow,terrainLOD,farTerrain,lanterns,shadows,detailTextures,resetResolution,sampleFrame,update,get resolutionScale(){return scale}};
}
