// Articulated procedural creatures. Shared primitive geometry/material cache; no assets.
export function createExpansionModel(api,kind,scale=1){
 const {THREE,mesh,mat}=api,root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
 const palettes={boar:[0x66543a,0x698345],thornling:[0x4b7650,0xb8ac6d],bear:[0x68533c,0x342b28],slime:[0x699851,0xa9d17a],witch:[0x586878,0x856aa0],basilisk:[0x567e64,0xc2a14e],wraith:[0xb0dbe3,0x5d8fac],troll:[0x809d9c,0xe1e7d1],harpy:[0x96887f,0xc8dce0],sentinel:[0x7c8b85,0xc5a766],warden:[0x665841,0x5a9849],serpent:[0x476e66,0xc9a44e],knight:[0x626e7a,0x9a6a64],wyrm:[0x769dbb,0xc9e7ee],titan:[0x443e3b,0xe6893f],priestess:[0x7d829c,0xe2dabe],king:[0x495767,0xd0ad67],fox:[0xba7138,0xebe0bf],wolf:[0x84959c,0xc5d0c6],owl:[0x977f5f,0xe4d9b4],dragon:[0x9d684a,0xe8b272],golem:[0x88917e,0x99c2a0],horse:[0x8a6042,0x403328],emberhorn:[0x6f5442,0xffac54]};
 const [coat,accent]=palettes[kind]||palettes.sentinel,bodyMat=mat(coat).clone(),bladeMat=mat(accent).clone();
 const ownedGeometry=[],legs=[],arms=[],wings=[],tail=[],segments=[],decor=[],head=new THREE.Group();rig.add(head);let body;
 const part=(shape,color,x,y,z,sx,sy,sz,parent=rig)=>mesh(shape,color,x,y,z,sx,sy,sz,parent);
 const pivot=(x,y,z,parent=rig)=>{const p=new THREE.Group();p.position.set(x,y,z);parent.add(p);return p};
 const eye=(x,y,z,size=.06)=>part('orb',mat(0xf4df9c,{emissive:0x79571d,emissiveIntensity:.5}),x,y,z,size,size,size,head);
 const horn=(x,y,z,s=.3,parent=head)=>{const m=part('cone',accent,x,y,z,s*.3,s,s*.3,parent);m.rotation.z=-Math.sign(x)*.4;return m};
 function limb(x,y,z,width=.15,length=.7){const p=pivot(x,y,z);part('cyl',bodyMat,0,-length*.45,0,width,length,width,p);part('orb',accent,0,-length,.1,width*1.3,width*.7,width*1.6,p);legs.push(p);return p}
 function wing(side,y=1.4,z=0,size=1){const w=pivot(side*.35,y,z);const g=new THREE.BufferGeometry();ownedGeometry.push(g);g.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,side*size*1.8,.3,-.3,side*size*.9,-.1,-.8,0,0,0,side*size*.9,-.1,-.8,0,-.1,-.5],3));g.computeVertexNormals();w.add(new THREE.Mesh(g,mat(accent,{side:THREE.DoubleSide,flatShading:true})));part('cyl',coat,side*size*.7,.1,-.1,.06,size*1.5,.06,w).rotation.z=side*-1.3;wings.push(w);return w}
 const quad=['boar','bear','basilisk','fox','wolf','dragon','wyrm','horse','emberhorn'].includes(kind);
 if(quad){
  const bear=kind==='bear',horse=kind==='horse',reptile=['basilisk','dragon','wyrm'].includes(kind),bulk=bear||kind==='emberhorn'?1.25:1;
  body=part('orb',bodyMat,0,horse?1.45:1.05,0,.52*bulk,.61*bulk,horse?1.04:.9);
  const length=horse?1.3:bear?.8:.85;for(const x of [-.38,.38])for(const z of [-.6,.6])limb(x,length,z,bear?.21:.13,length);
  head.position.set(0,horse?1.85:1.23,.78);part('orb',bodyMat,0,0,0,bear?.44:.32,horse?.53:.35,.4,head);part('orb',kind==='fox'?accent:coat,0,-.15,.38,.23,.21,kind==='boar'?.35:.32,head);part('orb',0x292d29,0,-.11,.65,.15,.1,.06,head);
  for(const side of [-1,1]){eye(side*.27,.07,.26);part(reptile?'cone':'orb',bodyMat,side*.23,.35,-.03,.12,reptile?.38:.2,.12,head);if(['boar','basilisk','bear'].includes(kind))horn(side*.21,-.25,.54,.32).rotation.z=side*.7;}
  const t=pivot(0,1,-.8);part('cone',kind==='fox'?accent:coat,0,0,-.42,kind==='fox'?.25:.12,reptile?1.4:.85,.17,t).rotation.x=Math.PI/2;tail.push(t);
  if(kind==='boar')for(let i=0;i<7;i++)part('orb',0x64884c,Math.sin(i*2)*.32,1.54,-.58+i*.15,.25,.18,.23);
  if(reptile){for(let i=0;i<7;i++)horn(0,1.53,-.8+i*.24,.23,rig);if(kind!=='basilisk'){wing(-1,1.35,-.1,kind==='wyrm'?1.7:1);wing(1,1.35,-.1,kind==='wyrm'?1.7:1)}for(const side of [-1,1])horn(side*.21,.4,-.1,.65);}
  if(horse){part('orb',bodyMat,0,1.6,.65,.31,.62,.4);part('box',accent,0,1.8,.32,.2,.58,.45);for(const side of [-1,1])part('cyl',0x503e2c,side*.24,1.62,.9,.025,.9,.025).rotation.x=.8;}
  if(kind==='emberhorn'){for(const side of [-1,1]){horn(side*.23,.45,.08,.9);part('orb',0x716654,side*.47,1.33,.28,.18,.32,.45)}const core=part('orb',mat(accent,{emissive:accent,emissiveIntensity:.8}),0,1.42,.85,.14,.18,.12);decor.push(core);}
 }else if(kind==='slime'){
  body=part('orb',mat(coat,{transparent:true,opacity:.88,roughness:.2}),0,.57,0,.9,.7,.8);head.position.y=.55;for(const side of [-1,1]){part('orb',0x273f2e,side*.25,.07,.7,.08,.12,.06,head);part('orb',accent,side*.4,-.25,.2,.22,.16,.22)}
 }else if(kind==='serpent'){
  body=part('orb',bodyMat,0,.5,0,.8,.52,.9);for(let i=0;i<7;i++){const p=pivot(Math.sin(i*.7)*.6,.45,-i*.55);part('orb',bodyMat,0,0,0,.68-i*.065,.52-i*.042,.65);segments.push(p);p.add(rig.children[rig.children.length-1]);}
  head.position.set(0,1.35,.78);part('orb',bodyMat,0,0,0,.65,.42,.55,head);for(const side of [-1,1]){eye(side*.41,.1,.4,.1);horn(side*.25,-.35,.5,.55).rotation.z=Math.PI;part('cone',accent,side*.5,-.18,-.1,.45,1.3,.16,head).rotation.z=side*.7;}
 }else if(kind==='owl'||kind==='harpy'){
  body=part('orb',bodyMat,0,1.15,0,kind==='owl'?.45:.34,.56,.4);head.position.set(0,1.82,.12);part('orb',bodyMat,0,0,0,.36,.36,.3,head);for(const side of [-1,1]){part('orb',accent,side*.15,.02,.24,.16,.2,.06,head);eye(side*.15,.04,.3,.09)}part('cone',0xc6a561,0,-.15,.36,.1,.27,.1,head).rotation.x=Math.PI/2;wing(-1,1.5,0,kind==='harpy'?1.2:.7);wing(1,1.5,0,kind==='harpy'?1.2:.7);for(const side of [-1,1]){limb(side*.2,.65,.1,.07,.45);for(let k=0;k<3;k++)part('cone',0xc7aa74,side*.2+(k-1)*.06,.14,.3,.035,.3,.035).rotation.x=1.2;}
 }else if(kind==='thornling'||kind==='warden'){
  body=part('cyl',bodyMat,0,1.1,0,kind==='warden'?.62:.3,1.6,.35);head.position.set(0,2.1,.06);part('orb',bodyMat,0,0,0,.38,.42,.3,head);for(const side of [-1,1]){eye(side*.16,.05,.28,.08);const a=pivot(side*.6,1.6,0);part('cyl',bodyMat,0,-.6,0,.13,1.2,.13,a);for(let k=0;k<3;k++)horn((k-1)*.16,-1.2,0,.4,a);arms.push(a);limb(side*.28,.8,0,.16,.8);for(let k=0;k<3;k++)horn(side*(.25+k*.13),2.8+k*.18,0,.6,rig)}for(let i=0;i<8;i++)part('orb',accent,Math.sin(i*2.4)*.6,2.4+(i%3)*.18,Math.cos(i*2.4)*.5,.48,.27,.4);
 }else{
  const floating=['witch','wraith','priestess'].includes(kind),heavy=['troll','titan','golem'].includes(kind);
  body=part(heavy?'orb':'cyl',bodyMat,0,1.35,0,heavy?.68:.38,heavy?.8:.83,heavy?.52:.3);head.position.set(0,heavy?2.35:2.02,0);part('orb',bodyMat,0,0,0,heavy?.4:.29,.34,.28,head);
  for(const side of [-1,1]){eye(side*.14,.05,.25);const a=pivot(side*(heavy?.8:.44),1.75,0);part(heavy?'orb':'cyl',bodyMat,0,-.38,0,heavy?.28:.12,.66,heavy?.26:.12,a);part('orb',accent,0,-.85,.06,heavy?.34:.15,.22,.19,a);arms.push(a);if(!floating)limb(side*(heavy?.32:.2),.87,0,heavy?.22:.14,.87);}
  if(floating){part('cone',bodyMat,0,.72,0,.64,1.7,.45).rotation.z=Math.PI;for(let i=0;i<7;i++){const t=pivot(Math.sin(i)*.4,.35,Math.cos(i)*.3);part('cone',accent,0,-.2,0,.13,.6,.1,t);tail.push(t)}if(kind==='witch'){part('cone',0x384938,0,.53,0,.4,.7,.4,head);part('cyl',0x384938,0,.24,0,.54,.08,.54,head);part('cyl',0x67563d,.1,-.1,.3,.05,2,.05,arms[1]);part('orb',mat(0xadc575,{emissive:0x597537,emissiveIntensity:1}),.1,.95,.3,.17,.19,.17,arms[1])}}
  if(['sentinel','knight','king'].includes(kind)){
   part('box',accent,0,1.3,.32,.38,.48,.08);for(const side of [-1,1])part('orb',bladeMat,side*.5,1.8,0,.29,.23,.35);part('cyl',bladeMat,0,.1,0,.33,.5,.3,head);part('box',0x192622,0,.1,.3,.49,.06,.04,head);part('box',0x423d40,0,1,-.35,.72,1.3,.06);
   part('box',bladeMat,0,-1.45,.12,.13,1.3,.08,arms[1]);part('box',accent,0,-.86,.12,.45,.08,.1,arms[1]);part('orb',bodyMat,0,-.56,.22,.4,.56,.1,arms[0]);
  }
  if(kind==='king'||kind==='priestess')for(let i=0;i<7;i++)horn(Math.cos(i*Math.PI*2/7)*.24,.4,Math.sin(i*Math.PI*2/7)*.24,.3,head);
  if(kind==='priestess'){const ring=new THREE.Mesh(new THREE.TorusGeometry(.64,.04,4,16),mat(accent,{emissive:accent,emissiveIntensity:.4}));ring.position.set(0,.2,-.1);ownedGeometry.push(ring.geometry);head.add(ring);decor.push(ring);}
  if(kind==='troll'){for(const side of [-1,1]){horn(side*.15,-.3,.2,.35);part('cone',accent,side*.8,2.08,0,.23,.7,.22).rotation.z=-side*.5}part('cyl',0x675849,0,-1.4,.1,.14,1.3,.14,arms[1]);part('orb',0x8bb1bc,0,-1.9,.1,.42,.55,.35,arms[1]);}
  if(kind==='titan'||kind==='golem'){const core=part('orb',mat(accent,{emissive:accent,emissiveIntensity:1.1}),0,1.4,.48,.27,.32,.13);decor.push(core);if(kind==='titan')for(const side of [-1,1])part('cyl',0x363633,side*.5,2.1,-.2,.2,.9,.2);}
 }

 // Boss-specific silhouettes are additional geometry, not palette swaps.
 if(kind==='warden'){for(const side of [-1,1]){for(let i=0;i<4;i++){const branch=part('cyl',bodyMat,side*(.7+i*.22),2.5+i*.25,0,.11,.8,.11);branch.rotation.z=-side*.8;horn(side*(.8+i*.22),2.9+i*.25,0,.4,rig)}part('orb',0x354d32,side*.75,1.95,-.1,.65,.38,.55)}for(let i=0;i<6;i++){const root=part('cone',bodyMat,Math.sin(i)*.65,.2,Math.cos(i)*.6,.16,1.1,.16);root.rotation.z=Math.sin(i)*.9;}}
 if(kind==='knight'){part('cone',accent,0,.52,-.05,.16,.75,.34,head).rotation.x=-.3;part('box',0x384450,0,-.6,.27,.85,1.2,.12,arms[0]);part('box',accent,0,-.6,.35,.12,.95,.04,arms[0]);}
 if(kind==='king'){for(const side of [-1,1]){part('cone',0x27343f,side*.38,1,-.42,.42,1.65,.16).rotation.z=Math.PI;part('orb',accent,side*.53,1.9,0,.42,.25,.35);for(let i=0;i<3;i++)horn(side*(.4+i*.16),2.13,.03,.36,rig)}part('box',bladeMat,0,-1.75,.14,.27,1.95,.13,arms[1]);part('orb',mat(accent,{emissive:accent,emissiveIntensity:.8}),0,-.8,.17,.12,.12,.1,arms[1]);}
 if(kind==='titan'){for(const side of [-1,1]){part('box',bodyMat,side*.8,-1.1,.14,.6,.65,.6,arms[side<0?0:1]);for(let i=0;i<3;i++)part('box',mat(accent,{emissive:accent,emissiveIntensity:1}),side*.4,1+i*.18,.47,.09,.1,.07)}part('cone',bodyMat,0,.45,0,.42,.65,.4,head);}
 if(kind==='wyrm'){for(const side of [-1,1])for(let i=0;i<4;i++)horn(side*(.25+i*.13),.25+i*.13,-.2-i*.13,.8,head);for(let i=0;i<5;i++)horn(Math.sin(i)*.23,1.6,-.65-i*.27,.65,rig);}
 const weapon=new THREE.Group(),cape=new THREE.Group();rig.add(weapon,cape);root.scale.setScalar(scale);
 return{ownedGeometry,root,rig,head,body,bodyMat,bladeMat,legs,arms,shoulder:[],weapon,cape,wings,tail,segments,decor,scale,phase:0,modelKind:kind};
}
export function animateExpansionModel(ch,speed,dt,attack=null,dying=0,time=0){
 if(!ch.modelKind)return false;const k=ch.modelKind,walk=Math.min(1,speed/3);ch.phase+=dt*(speed>0?7+speed:2);const s=Math.sin(ch.phase);
 ch.rig.position.set(0,Math.abs(s)*.045*walk,0);ch.rig.rotation.set(-(ch.recoil||0)*.7,0,0);
 ch.legs.forEach((l,i)=>l.rotation.x=Math.sin(ch.phase+(i%2)*Math.PI+(i>1?Math.PI:0))*.62*walk);
 ch.arms.forEach((a,i)=>a.rotation.x=Math.sin(ch.phase+i*Math.PI)*.22*walk);ch.tail.forEach((t,i)=>t.rotation.y=Math.sin(time*3+i)*.2);
 ch.wings.forEach((w,i)=>w.rotation.z=(i?1:-1)*(.25+Math.sin(time*7)*.48));ch.segments.forEach((p,i)=>p.position.x=Math.sin(time*2-i*.55)*.45);
 if(['wraith','witch','priestess','harpy','owl'].includes(k))ch.rig.position.y+=.35+Math.sin(time*2)*.13;
 if(k==='slime'){ch.body.scale.y=.68+Math.sin(time*3)*.06;ch.body.scale.x=.9-Math.sin(time*3)*.06;}
 if(attack){const t=attack.t/attack.duration,impact=Math.sin(Math.min(1,t)*Math.PI);ch.rig.rotation.x=attack.combo===0?-.25*impact:.42*impact;ch.rig.rotation.y=attack.combo===2?Math.sin(t*Math.PI*2)*.7:0;ch.arms.forEach((a,i)=>{a.rotation.x=-impact*(attack.combo===0?2.1:1.2);a.rotation.z=(i?1:-1)*impact*(attack.combo===2?1:.2)});if(ch.legs.length===4)ch.head.rotation.x=impact*(attack.combo===0?-.45:.4);if(k==='slime')ch.rig.scale.y=1-impact*.35;if(k==='bear'&&attack.combo===1){ch.head.rotation.x=Math.sin(t*Math.PI*2)*.4;ch.legs.forEach((l,i)=>{if(i%2)l.rotation.x=-Math.sin(t*Math.PI*2)*.8})}if(k==='harpy')ch.rig.position.y+=Math.sin(t*Math.PI)*.7;}
 else{ch.head.rotation.x=Math.sin(time*1.5)*.025;ch.rig.scale.setScalar(1);ch.arms.forEach(a=>a.rotation.z=0)}
 ch.decor.forEach((o,i)=>{if(o.material.emissive)o.material.emissiveIntensity=.7+Math.sin(time*2+i)*.15});
 if(dying){ch.rig.rotation.z=Math.min(1.6,dying*1.5);ch.rig.position.y=-Math.min(.4,dying*.25);if(['wraith','slime'].includes(k))ch.rig.scale.y=Math.max(.05,1-dying*.35);}
 return true;
}
