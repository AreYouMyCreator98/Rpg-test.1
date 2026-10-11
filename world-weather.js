import {graphics} from './graphics.js?v=realm-harvest-2';
export const DAY_SECONDS=1440;
const hash=n=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)};
export function weatherAt(days){
 const block=Math.floor(days/14),start=block*14+3+Math.floor(hash(block+11)*10),duration=.18+hash(block+81)*.3;
 if(days>=start&&days<start+duration)return hash(block+91)<.4?'storm':'rain';
 const day=Math.floor(days),phase=days-day;
 if(day>1&&hash(day+120)<.2&&phase>.21&&phase<.34)return 'fog';
 if(day>1&&hash(day+60)<.32&&phase>.32&&phase<.7)return 'cloudy';
 return 'sunshine';
}
export function bearingOffset(dx,dz,heading){return Math.atan2(Math.sin(Math.atan2(dx,-dz)-heading),Math.cos(Math.atan2(dx,-dz)-heading))}
export function installWorldWeather(api){
 const {THREE,scene,hero,camera,sun,living,sky,ambient}=api,hemi=scene.children.find(o=>o.isHemisphereLight),direction=new THREE.Vector3();
 const hud=document.createElement('div');hud.id='world-compass';hud.innerHTML='<button aria-label="Open world map" id="compass-map"><canvas width="560" height="64" aria-hidden="true"></canvas></button><div class="world-clock"></div><button class="compass-quest" aria-label="Open tracked quest journal"></button>';document.getElementById('hud').append(hud);hud.querySelector('#compass-map').onclick=()=>living.worldMap();hud.querySelector('.compass-quest').onclick=()=>living.journal();
 const canvas=hud.querySelector('canvas'),ctx=canvas.getContext('2d');
 const count=650,positions=new Float32Array(count*6),geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const rain=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0xaecbda,transparent:true,opacity:.3,depthWrite:false}));rain.frustumCulled=false;rain.name='Local pooled rainfall';scene.add(rain);
 const rays=new THREE.Group();rays.name='Sunlight shafts';scene.add(rays);const rayGeo=new THREE.ConeGeometry(2,26,4,1,true),rayMat=new THREE.MeshBasicMaterial({color:0xffe9b3,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 for(let i=0;i<5;i++){const m=new THREE.Mesh(rayGeo,rayMat);m.position.set((i-2)*7,10,-12-i*3);m.rotation.z=.35;rays.add(m)}
 let elapsed=0,cloud=0,wet=0,mist=0,flash=0,uiTime=0,weather='sunshine',daylight=1,noise=null,lastThunder=-1;
 const color=(hex)=>new THREE.Color(hex),night=color(0x101d3a),day=color(0x598dbb),horizonDay=color(0xa9c9c7),horizonNight=color(0x25334a),warm=color(0xffb66d),white=color(0xffe0b0),moon=color(0xabc7ff),grey=color(0x899c9e),overcast=color(0x657581),reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
 function state(){const d=living.serialize();if(!d.climate||d.climate.version!==1||!Number.isFinite(d.climate.days)||d.climate.days<0)d.climate={version:1,days:.375};return d.climate}
 function target(){const d=living.serialize(),p=d.prologue;if(p&&p.stage<3){if(!p.read)return {name:'Read the warning',point:[47.8,150]};if(p.stage===1){const e=api.prologue()?.foes.filter(e=>e.hp>0).sort((a,b)=>a.root.position.distanceToSquared(hero.root.position)-b.root.position.distanceToSquared(hero.root.position))[0];return e?{name:'The Unburied',point:[e.root.position.x,e.root.position.z]}:{name:'Open the graveyard gate',point:[50,118]}}return {name:'Bram’s charter',point:[0,83]}}
 const q=living.questDefinitions.find(q=>q.id===d.tracked&&d.quests[q.id]?.status==='active')||living.questDefinitions.find(q=>d.quests[q.id]?.status==='active');if(!q)return null;const n=living.progress(q)>=q.goal?living.npcs.find(n=>n.id===q.giver):null;return {name:q.name,point:n?[n.root.position.x,n.root.position.z]:q.id==='trail'&&api.visited().includes(2)?[-8,-66]:q.target}}
 function compass(days){camera.getWorldDirection(direction);const heading=Math.atan2(direction.x,-direction.z);ctx.clearRect(0,0,560,64);ctx.textAlign='center';ctx.font='22px Georgia';ctx.strokeStyle='#b7c9bd88';ctx.fillStyle='#f3e8d1';
 for(let i=0;i<16;i++){const angle=i*Math.PI/8,offset=bearingOffset(Math.sin(angle),-Math.cos(angle),heading),x=280+offset*170;if(x<12||x>548)continue;if(i%4===0)ctx.fillText(['N','E','S','W'][i/4],x,26);else{ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,25);ctx.stroke()}}
 ctx.fillStyle='#d7b66d';ctx.beginPath();ctx.moveTo(280,34);ctx.lineTo(275,43);ctx.lineTo(285,43);ctx.fill();const t=target(),label=hud.querySelector('.compass-quest');label.hidden=!t;if(t?.point){const dx=t.point[0]-hero.root.position.x,dz=t.point[1]-hero.root.position.z,offset=bearingOffset(dx,dz,heading),x=Math.max(12,Math.min(548,280+offset*170));ctx.beginPath();ctx.moveTo(x,38);ctx.lineTo(x+7,46);ctx.lineTo(x,54);ctx.lineTo(x-7,46);ctx.closePath();ctx.fill();label.textContent=(Math.abs(offset)>1.55?(offset<0?'‹ ':'› '):'')+t.name+' · '+Math.round(Math.hypot(dx,dz))+' m'}
 const hour=(days%1)*24,period=hour<5||hour>=20?'Night':hour<7?'Dawn':hour<17?'Day':hour<20?'Dusk':'Night';hud.querySelector('.world-clock').textContent=`Day ${Math.floor(days)+1} · ${period} ${String(Math.floor(hour)).padStart(2,'0')}:${String(Math.floor(hour%1*60)).padStart(2,'0')} · ${weather==='sunshine'?(period==='Night'?'Clear': 'Sunny'):weather[0].toUpperCase()+weather.slice(1)}`;
 }
 function audio(outside){const a=api.audioContext;if(!a||a.state!=='running')return;if(!noise){const buffer=a.createBuffer(1,a.sampleRate*2,a.sampleRate),v=buffer.getChannelData(0);for(let i=0;i<v.length;i++)v[i]=Math.random()*2-1;const source=a.createBufferSource(),filter=a.createBiquadFilter(),gain=a.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=1100;gain.gain.value=0;source.connect(filter).connect(gain).connect(a.destination);source.start();noise={gain,filter}}
 noise.gain.gain.setTargetAtTime(outside&&api.active&&api.settings.sound?wet*(api.settings.environmentVolume??.7)*.045:0,a.currentTime,.5);noise.filter.frequency.value=weather==='storm'?550:1100;
 const cycle=Math.floor(state().days*DAY_SECONDS/70);
 if(outside&&api.active&&api.settings.sound&&weather==='storm'&&cycle!==lastThunder){lastThunder=cycle;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type='triangle';o.frequency.setValueAtTime(52,t);o.frequency.exponentialRampToValueAtTime(24,t+2.5);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(Math.max(.0001,(api.settings.environmentVolume??.7)*.075),t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+3);o.connect(g).connect(a.destination);o.start();o.stop(t+3.1);o.onended=()=>{o.disconnect();g.disconnect()}}

 }
 function update(dt){const c=state(),net=api.net();if(api.active&&(!net?.active||net.host))c.days+=Math.min(dt,.1)/DAY_SECONDS;elapsed+=dt;weather=weatherAt(c.days);const blend=1-Math.exp(-dt/12),over=weather==='cloudy'||weather==='storm'||weather==='rain';cloud+=(Number(over)-cloud)*blend;wet+=(Number(weather==='rain'||weather==='storm')-wet)*blend;mist+=(Number(weather==='fog')-mist)*blend;
 const outside=hero.root.position.x<200,profile=graphics(api.settings);rain.visible=outside&&wet>.015&&profile.effects>0;rays.visible=outside&&profile.effects>.5&&cloud<.6;audio(outside);
 if(!outside)sun.color.copy(white);
 if(outside){const h=c.days%1,alt=Math.sin((h-.25)*Math.PI*2);daylight=THREE.MathUtils.smoothstep(alt,-.12,.35);const twilight=Math.max(0,1-Math.abs(alt)*5)*daylight;sun.color.copy(moon).lerp(white,daylight).lerp(warm,twilight*.65);sun.intensity=(.22+3.03*daylight)*(1-cloud*.68);hemi.intensity=.48+daylight*.65;ambient.intensity=.15+daylight*.21;scene.fog.color.copy(horizonNight).lerp(horizonDay,daylight).lerp(grey,cloud*.55);scene.fog.density=(api.settings.quality==='low'?.0019:.0013)+mist*.018+wet*.003;
 sky.material.uniforms.zenith.value.copy(night).lerp(day,daylight).lerp(overcast,cloud*.65);sky.material.uniforms.horizon.value.copy(scene.fog.color);sky.material.uniforms.cloudCover.value=cloud;sky.material.uniforms.cloudLight.value=.1+.9*daylight;
 const angle=h*Math.PI*2;sun.position.set(hero.root.position.x+Math.cos(angle)*45,hero.root.position.y+30+Math.abs(alt)*40,hero.root.position.z+25);sun.target.position.copy(hero.root.position);
 // A slow, localised lightning glow, never rapid full-screen strobing.
 flash=weather==='storm'&&profile.effects>0&&!reduceMotion.matches?Math.pow(Math.max(0,Math.sin(c.days*DAY_SECONDS*.09)),100)*.4:0;sun.intensity+=flash;
 rays.position.set(Math.floor(hero.root.position.x/40)*40,hero.root.position.y,Math.floor(hero.root.position.z/40)*40);rayMat.opacity=.012*daylight*(1-cloud)*Math.max(0,Math.sin(alt*Math.PI));
 }
 if(rain.visible){const n=Math.floor(count*profile.effects);geo.setDrawRange(0,n*2);for(let i=0;i<n;i++){const x=hero.root.position.x+(hash(i+3)-.5)*34,z=hero.root.position.z+(hash(i+802)-.5)*34,y=hero.root.position.y+((hash(i+123)*22-elapsed*(weather==='storm'?17:12))%22+22)%22;const k=i*6;positions[k]=x;positions[k+1]=y;positions[k+2]=z;positions[k+3]=x-.13;positions[k+4]=y+.65;positions[k+5]=z+.04}geo.attributes.position.needsUpdate=true;rain.material.opacity=wet*.35}
 uiTime+=dt;if(uiTime>.1){uiTime=0;compass(c.days)}
 }
 return {update,state,get weather(){return weather},rain,rays,hud,target};
}
