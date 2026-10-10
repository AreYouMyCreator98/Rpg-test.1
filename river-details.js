// Small hillside tributaries descend into the established river. Its crossing/deep-water rules stay unchanged.
export function installRiverDetails(api){
 const {THREE,scene,ground,riverZ,hero}=api,root=new THREE.Group();root.name='Riverside cascades';scene.add(root);const time={value:0};
 const material=new THREE.ShaderMaterial({uniforms:{time},transparent:true,depthWrite:false,side:THREE.DoubleSide,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float time;varying vec2 vUv;void main(){float streak=pow(max(0.,sin(vUv.x*48.+sin(vUv.y*12.-time*4.))),6.);float pulse=.5+.5*sin(vUv.y*55.-time*6.);vec3 c=mix(vec3(.06,.43,.38),vec3(.69,.87,.78),streak*.7+pulse*.15);float alpha=smoothstep(0.,.12,vUv.x)*smoothstep(0.,.12,1.-vUv.x)*.85;gl_FragColor=vec4(c,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const falls=[];
 for(const x of [-482,-225]){const river=riverZ(x),p=[],uv=[],idx=[];
  for(let i=0;i<=24;i++){const t=i/24,z=river-16+t*12.5,cx=x+Math.sin(t*5)*.7;for(const side of [-1,1]){const xx=cx+side*(.3+t*.45),y=Math.max(-.32,ground(xx,z)+.045);p.push(xx,y,z);uv.push((side+1)/2,t)}if(i<24){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3)}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);const m=new THREE.Mesh(g,material);root.add(m);falls.push({m,x,z:river-4});
 }
 const mistMaterial=new THREE.MeshBasicMaterial({color:0xc0e4d6,transparent:true,opacity:.13,depthWrite:false}),mist=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mistMaterial,24),dummy=new THREE.Object3D();mist.frustumCulled=false;root.add(mist);
 function update(clock,profile){time.value=clock;const p=hero.root.position;root.visible=p.x<200&&profile.water>0;for(const f of falls)f.m.visible=Math.hypot(p.x-f.x,p.z-f.z)<120;mist.visible=root.visible&&profile.effects>.5;for(let i=0;i<24;i++){const f=falls[i%2],t=(clock*.35+i*.137)%1,on=f.m.visible&&mist.visible;dummy.position.set(f.x+Math.sin(i*3.1)*t,Math.max(-.28,ground(f.x,f.z))+.12+t*.65,f.z+Math.cos(i*2.7)*t);dummy.scale.setScalar(on?.06+Math.sin(t*Math.PI)*.2:0);dummy.updateMatrix();mist.setMatrixAt(i,dummy.matrix)}mist.instanceMatrix.needsUpdate=true}
 return{root,falls,update};
}
