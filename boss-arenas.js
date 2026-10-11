import {batchScenery} from './scene-batch.js?v=realm-balance-1';
// Encounter gates derive from the existing replicated boss HP; no duplicate save state.
export function installBossArenas(api){
 const {THREE,scene,enemies,hero,surface,mesh,mat}=api,arenas=[];
 const themes={gruk:['Gruk · The Broken Crown',0x686f68,0xd8bb82,'castle'],guardian:['Varg · The Rootbound Vault',0x4d615b,0x8ac7b6,'roots'],wolf:['Fenrir · Moonstone Circle',0x737d82,0xb3c8f0,'moon'],skeleton:['Morvain · Court of Tombs',0x777568,0xb5a3d8,'tombs'],bandit:['Rook · The Burned Bastion',0x685747,0xda9364,'barricade'],spider:['Silkmaw · The Silken Court',0x62566b,0xc4a6d8,'web'],elemental:['Astrax · Stormglass Sanctum',0x526c78,0x83d7e8,'crystal'],warden:['Grove Warden · Heartroot Shrine',0x556747,0xa8c877,'roots'],serpent:['Nythra · The Drowned Altar',0x476c65,0x8ad2ba,'fountain'],knight:['Hollow Knight · Oathbreaker Hall',0x73777c,0xb9c8dc,'lists'],wyrm:['Skarveth · The Frozen Throne',0x72929f,0xbbdfe9,'ice'],titan:['Ash Titan · Crucible of Kings',0x44434a,0xffac64,'forge'],priestess:['Selene · Lunar Observatory',0x65647e,0xcac5f2,'orrery'],king:['Forgotten King · The Last Court',0x655e54,0xddbd77,'throne']};
 const fogGeo=new THREE.PlaneGeometry(4.8,4.8,1,1);
 const fogBase=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{time:{value:0},tint:{value:new THREE.Color()}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;uniform vec3 tint;void main(){float folds=sin(v.x*35.+sin(v.y*8.-time)*2.+time*.4)*.5+.5;float wisps=sin(v.y*24.-time*1.7+sin(v.x*19.)*2.)*.5+.5;float edge=smoothstep(0.,.08,v.x)*smoothstep(0.,.08,1.-v.x)*smoothstep(0.,.1,v.y)*smoothstep(0.,.15,1.-v.y);gl_FragColor=vec4(mix(tint,vec3(.88,.93,.9),folds*.5),edge*(.62+folds*.18+wisps*.13));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 for(const e of enemies.filter(e=>e.type===3||e.isBoss)){
  const id=e.guardian?'guardian':e.expansionKind||e.family||'gruk',theme=themes[id];if(!theme)continue;
  const [name,stone,accent,motif]=theme,x=e.home.x,z=e.home.z,inside=!!e.cave,wx=inside?e.guardian?8:11:13,wz=inside?7:12;
  const root=new THREE.Group();root.name=name;scene.add(root);const fixed=new THREE.Group();root.add(fixed);
  const a={id,e,name,x,z,wx,wz,gateZ:z+wz,root,fog:null,moving:[],inside};arenas.push(a);
  const prop=(shape,color,xx,yy,zz,sx,sy,sz,parent=fixed)=>mesh(shape,color,x+xx,surface(x+xx,z+zz)+yy,z+zz,sx,sy,sz,parent);
  // A continuous perimeter with one wide entry. Walls follow the same terrain as actors.
  for(const side of [-1,1]){
   for(let k=-wz;k<wz;k+=2){prop('box',stone,side*wx,inside?1:2.1,k+1,.7,inside?2:4.2,2.05);if(!inside)prop('box',stone,side*wx,4.45,k+.6,1,.65,.85)}
   for(let k=-wx;k<wx;k+=2){const xx=k+1;if(side===1&&Math.abs(xx)<3)continue;prop('box',stone,xx,inside?1:2.1,side*wz,2.05,inside?2:4.2,.7);if(!inside)prop('box',stone,xx,4.45,side*wz,.85,.65,1)}
   prop('box',stone,side*2.8,2.8,wz,.9,5.6,1.1);prop('box',accent,side*2.8,5.6,wz,1.15,.25,1.3);
   prop('cyl',mat(accent,{emissive:accent,emissiveIntensity:.65}),side*2.8,2.2,wz+.65,.12,.75,.12);
  }
  prop('box',stone,0,5.15,wz,5.6,.6,1.1);
  if(motif==='castle')for(const xx of [-wx,wx])for(const zz of [-wz,wz]){prop('cyl',stone,xx,3.2,zz,2.3,6.4,2.3);prop('cyl',0x414c46,xx,6.5,zz,2.65,.45,2.65);for(let i=0;i<8;i++)prop('box',stone,xx+Math.cos(i*Math.PI/4)*2.2,7,zz+Math.sin(i*Math.PI/4)*2.2,.6,.9,.6)}
  // Distinct architecture outside the central combat lanes; no decorative obstacles in the arena floor.
  for(const side of [-1,1])for(let i=0;i<3;i++){
   const xx=side*(wx-1.6),zz=-wz+2+i*(wz-2);
   if(['crystal','ice'].includes(motif)){const c=prop('cone',mat(accent,{emissive:accent,emissiveIntensity:.2}),xx,2,zz,.7,4,.7);c.rotation.z=side*.22;if(motif==='crystal')a.moving.push({m:c,y:c.position.y,kind:'float',phase:i})}
   else if(motif==='roots'){const r=prop('cyl',0x65523c,xx,1.8,zz,.35,3.6,.35);r.rotation.z=side*.35;prop('orb',accent,xx,3.7,zz,.7,.3,.7)}
   else if(motif==='tombs'){prop('box',stone,xx,1,zz,.8,2,.35);prop('box',accent,xx,1.6,zz,1.3,.2,.4)}
   else if(motif==='barricade'){prop('cone',0x665039,xx,1.5,zz,.4,3,.4);prop('box',0x4c3427,xx,1,zz,.6,.3,2.6)}
   else if(motif==='fountain'){prop('cyl',stone,xx,.6,zz,.9,1.2,.9);prop('cone',mat(accent,{emissive:accent,emissiveIntensity:.4}),xx,1.5,zz,.3,1.2,.3)}
   else {prop('cyl',stone,xx,1.6,zz,.6,3.2,.6);prop('box',accent,xx,3.3,zz,1.2,.25,1.2)}
  }
  if(motif==='web')for(const side of [-1,1])for(let i=0;i<7;i++){const web=prop('cyl',accent,side*(wx-1),2.5,-wz+4,.022,8,.022);web.rotation.x=i*.38;web.rotation.z=side*.6;}
  if(['moon','orrery','forge'].includes(motif)){
   const ring=new THREE.Mesh(new THREE.TorusGeometry(motif==='forge'?1.7:2.5,.1,5,24),mat(accent,{metalness:.5,roughness:.5}));ring.position.set(x,surface(x,z-wz+1)+4,z-wz+1);fixed.add(ring);if(motif!=='moon'){fixed.remove(ring);root.add(ring);a.moving.push({m:ring,kind:'spin'})}
  }
  if(['castle','throne','lists'].includes(motif)){prop('box',stone,0,.4,-wz+2,4,.8,2.5);prop('box',accent,0,2,-wz+1.5,2.3,3.2,.45);prop('box',stone,0,1,-wz+1,2.4,.4,1.5);for(const side of [-1,1])prop('box',id==='gruk'?0x713936:0x404d70,side*4,3.1,-wz+.6,1,2.8,.07)}
  // Animated meshes retain ownership, all architectural repetition is instanced once.
  for(const m of a.moving){if(m.m.parent===fixed){fixed.remove(m.m);root.add(m.m)}}batchScenery(THREE,fixed);
  const fog=new THREE.Mesh(fogGeo,fogBase.clone());fog.material.uniforms.tint.value.setHex(accent);fog.position.set(x,surface(x,a.gateZ)+2.4,a.gateZ);root.add(fog);a.fog=fog;
 }
 fogBase.dispose();
 function blocked(x,z,r=.4){for(const a of arenas){const dx=Math.abs(x-a.x),dz=Math.abs(z-a.z);if(a.id==='gruk')for(const sx of [-1,1])for(const sz of [-1,1])if(Math.hypot(x-a.x-sx*a.wx,z-a.z-sz*a.wz)<2.3+r)return true;if(dx>a.wx+r+1||dz>a.wz+r+1)continue;
  if(Math.abs(dx-a.wx)<r+.4&&dz<a.wz+r||Math.abs(z-(a.z-a.wz))<r+.4&&dx<a.wx+r)return true;
  if(Math.abs(z-a.gateZ)<r+.4&&dx<a.wx+r&&(dx>2.35-r||a.e.hp>0))return true;
 }return false}
 function nearGate(){const p=hero.root.position;return arenas.find(a=>a.e.hp>0&&Math.abs(p.x-a.x)<2.3&&Math.abs(p.z-a.gateZ)<2.7)}
 function hint(){const a=nearGate();return a?(hero.root.position.z<a.gateZ?'Fog sealed · defeat '+a.e.name:'Traverse the mist · '+a.name):null}
 function interact(){const a=nearGate();if(!a)return false;if(hero.root.position.z<a.gateZ){api.toast('The mist will lift when '+a.e.name+' falls.');return true}
  // Validate destination against every original wall, hazard boundary and player building.
  const z=a.gateZ-1.6;let landing=null;for(const dx of [0,-.6,.6,-1.2,1.2])if(!api.blocked(a.x+dx,z,.4)){landing=[a.x+dx,z];break}
  if(!landing){api.toast('The entrance is obstructed. Clear the approach before entering.');return true}
  api.dismount();api.setPosition(...landing);api.toast(a.name);api.save();return true;
 }
 function update(dt,time){for(const a of arenas){a.root.visible=(hero.root.position.x>200)===a.inside&&Math.hypot(hero.root.position.x-a.x,hero.root.position.z-a.z)<95;if(!a.root.visible)continue;a.fog.visible=a.e.hp>0;a.fog.material.uniforms.time.value=time;for(const p of a.moving)if(p.kind==='float')p.m.position.y=p.y+Math.sin(time+p.phase)*.25;else p.m.rotation.z+=dt*.3}}
 function cameraBlocked(p){return arenas.some(a=>p.y<surface(p.x,p.z)+(a.id==='gruk'?7.5:a.inside?5.8:4.8)&&Math.abs(p.x-a.x)<a.wx+3&&Math.abs(p.z-a.z)<a.wz+3)&&blocked(p.x,p.z,.2)}
 return {arenas,blocked,cameraBlocked,hint,interact,update};
}
