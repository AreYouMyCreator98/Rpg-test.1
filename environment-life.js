// Small decorative populations, separate from hostile AI and persistent gameplay.
import {graphics} from './graphics.js?v=realm-party-graves-1';
export function installEnvironmentLife(api){
 const {THREE,scene,hero,ground,riverZ}=api,root=new THREE.Group();root.name='Ambient wildlife';scene.add(root);
 const bodyGeo=new THREE.IcosahedronGeometry(1,0),wingGeo=new THREE.BufferGeometry();wingGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.5,.08,.1,.75,0,-.25,.25,0,-.18],3));wingGeo.setIndex([0,1,2,0,2,3]);wingGeo.computeVertexNormals();
 const materials=[0xe0bd60,0x76b4bd,0x48534a,0x8a7052].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,side:THREE.DoubleSide})),animals=[];
 const make=(g,m,parent,x,y,z,sx,sy,sz)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);parent.add(o);return o};
 for(let i=0;i<12;i++){const g=new THREE.Group(),bird=i<4,rabbit=i>=10,material=materials[rabbit?3:bird?2:i%2];root.add(g);const wings=[];
  make(bodyGeo,material,g,0,0,0,rabbit?.2:.055,rabbit?.16:.04,rabbit?.32:.18);
  if(rabbit){make(bodyGeo,material,g,0,.13,.24,.12,.14,.13);for(const x of [-.06,.06])make(bodyGeo,material,g,x,.33,.24,.038,.17,.045);make(bodyGeo,materials[0],g,0,.08,-.29,.07,.07,.07)}
  else for(const sign of [-1,1]){const pivot=new THREE.Group();g.add(pivot);make(wingGeo,material,pivot,0,0,0,sign*(bird?1:.5),1,bird?1:.65);wings.push(pivot)}
  animals.push({g,wings,bird,rabbit,seed:i*2.399,anchor:new THREE.Vector3(),cell:''});
 }
 let audioState=null,lastBird=0,lastMusic=0,stepDistance=0,previous=hero.root.position.clone();
 function audio(dt,time){const context=api.audioContext;if(!context||context.state!=='running')return;
  if(!audioState){const master=context.createGain();master.connect(context.destination);audioState={master};}
  const on=api.active&&api.settings.sound&&!document.hidden,volume=api.settings.environmentVolume??.7;audioState.master.gain.setTargetAtTime(on?volume:0,context.currentTime,.2);
  function note(frequency,duration,gain,type='sine',end=frequency){const o=context.createOscillator(),g=context.createGain(),t=context.currentTime;o.type=type;o.frequency.setValueAtTime(frequency,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g).connect(audioState.master);o.start();o.stop(t+duration+.03);o.onended=()=>{o.disconnect();g.disconnect()}}
  if(!on)return;
  const p=hero.root.position,travel=p.distanceTo(previous);previous.copy(p);if(travel<3)stepDistance+=travel;if(stepDistance>.95){stepDistance=0;const wet=Math.abs(p.z-riverZ(p.x))<5,road=api.pathDist(p.x,p.z)<3;note(wet?180:road?100:65,.07,wet?.025:.018,'triangle',wet?70:35)}
  if(p.x<200&&p.z>-650&&time-lastBird>5.5){lastBird=time;note(2200+Math.sin(time)*400,.16,.012,'sine',3300);}
  // Quiet generated pentatonic ambience; gain separated from environment by its own bus.
  if(time-lastMusic>12){lastMusic=time;const v=api.settings.musicVolume??.2;if(v>0){const gain=context.createGain(),o=context.createOscillator(),t=context.currentTime;gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(v*.012,t+1);gain.gain.exponentialRampToValueAtTime(.0001,t+7);o.frequency.value=[146.83,174.61,220,261.63][Math.floor(time/12)%4];o.connect(gain).connect(context.destination);o.start();o.stop(t+7.1);o.onended=()=>{o.disconnect();gain.disconnect()};audioState.music=gain;}}
 }
 function update(dt,time){const p=hero.root.position,profile=graphics(api.settings);root.visible=p.x<200&&profile.effects>0;
  for(let i=0;i<animals.length;i++){const a=animals[i];a.g.visible=root.visible&&i<Math.ceil(profile.effects*12);if(!a.g.visible)continue;const cx=Math.floor(p.x/45),cz=Math.floor(p.z/45),key=cx+','+cz;if(a.cell!==key){a.cell=key;const x=cx*45+22+Math.sin(a.seed)*17,z=cz*45+22+Math.cos(a.seed)*17;a.anchor.set(x,ground(x,z),z)}
   const phase=time*(a.bird?.55:a.rabbit?.7:.9)+a.seed,x=a.anchor.x+Math.sin(phase)*(a.bird?12:a.rabbit?2:3),z=a.anchor.z+Math.cos(phase)*(a.bird?8:2);
   a.g.position.set(x,a.rabbit?ground(x,z)+.2+Math.max(0,Math.sin(time*7+a.seed))*.1:a.anchor.y+(a.bird?9:1.5)+Math.sin(time*1.2+a.seed)*.5,z);a.g.rotation.y=Math.atan2(Math.cos(phase),-Math.sin(phase));
   if(a.rabbit&&(api.nearbyObstacles(x,z).some(o=>Math.hypot(x-o.x,z-o.z)<o.r+.4)||Math.abs(z-riverZ(x))<5))a.g.visible=false;
   a.wings.forEach((w,j)=>w.rotation.z=Math.sin(time*(a.bird?7:15)+a.seed)*(a.bird?.5:1.1)*(j?1:-1));
  }
  audio(dt,time);if(audioState?.music&&(!api.active||!api.settings.sound||document.hidden))audioState.music.gain.setTargetAtTime(0,api.audioContext.currentTime,.1);
 }
 return{root,animals,update};
}
