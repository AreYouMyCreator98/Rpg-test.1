// One sampled height field for rendering, navigation and atlas. No competing terrain generator.
export function createTerrainStream(api,root){
 const {THREE,BOUNDS,ground,terrain,hero}=api,cells=[],cache=new Map();let clock=0,dirty=true,viewKey='';const frustum=new THREE.Frustum(),projection=new THREE.Matrix4();
 const make=(cell,step)=>{const {x0,x1,z0,z1}=cell,nx=Math.ceil((x1-x0)/step),nz=Math.ceil((z1-z0)/step),p=[],n=[],c=[],indices=[];
  function vertex(x,z,drop=0){const y=ground(x,z),normal=new THREE.Vector3(ground(x-.25,z)-ground(x+.25,z),.5,ground(x,z-.25)-ground(x,z+.25)).normalize(),color=new THREE.Color(api.landscapeColor(x,z));if(step<=2){let shade=0;for(const o of api.nearbyObstacles(x,z)){const d=Math.hypot(x-o.x,z-o.z);shade+=Math.exp(-d*d/(o.r>=3?22:10))*.2}color.multiplyScalar(Math.max(.68,1-shade))}p.push(x,y-drop,z);n.push(...normal.toArray());c.push(color.r,color.g,color.b);return p.length/3-1}
  for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++)vertex(x0+(x1-x0)*i/nx,z0+(z1-z0)*j/nz);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,d=a+nx+1,e=d+1;indices.push(a,d,b,b,d,e)}
  // Downward skirts seal fine/coarse edges without overlapping two ground surfaces.
  const edge=[];for(let i=0;i<=nx;i++)edge.push(i);for(let j=1;j<=nz;j++)edge.push(j*(nx+1)+nx);for(let i=nx-1;i>=0;i--)edge.push(nz*(nx+1)+i);for(let j=nz-1;j>0;j--)edge.push(j*(nx+1));
  const lower=edge.map(i=>vertex(p[i*3],p[i*3+2],5));for(let k=0;k<edge.length;k++){const j=(k+1)%edge.length;indices.push(edge[k],lower[k],edge[j],edge[j],lower[k],lower[j])}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.setIndex(indices);g.computeBoundingSphere();return g;
 };
 for(let z=BOUNDS.top;z<BOUNDS.bottom;z+=64)for(let x=BOUNDS.left;x<BOUNDS.right;x+=64){const t={x0:x,x1:Math.min(x+64,BOUNDS.right),z0:z,z1:Math.min(z+64,BOUNDS.bottom),x:x+32,z:z+32,last:0};t.far=make(t,Math.abs(t.z-api.riverZ(t.x))<70?8:16);t.m=new THREE.Mesh(t.far,terrain.material);t.m.receiveShadow=true;root.add(t.m);cells.push(t)}
 // A single indexed coarse surface draws the horizon. Active fine cells are cut out,
 // rather than laying a lowered mesh beneath them or issuing hundreds of tiny draws.
 const positions=[],normals=[],colors=[],coarseIndices=[];
 for(const t of cells){const offset=positions.length/3;positions.push(...t.far.attributes.position.array);normals.push(...t.far.attributes.normal.array);colors.push(...t.far.attributes.color.array);t.indices=Array.from(t.far.index.array,i=>i+offset);coarseIndices.push(...t.indices)}
 const coarse=new THREE.BufferGeometry();coarse.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));coarse.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));coarse.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));coarse.setIndex(new THREE.BufferAttribute(new Uint32Array(coarseIndices),1));coarse.computeBoundingSphere();const farMesh=new THREE.Mesh(coarse,terrain.material);root.add(farMesh);
 function update(profile){clock++;const p=hero.root.position,inside=p.x>200,near=profile.distance*.55,start=performance.now();const candidates=[];
  for(const t of cells){const d=Math.hypot(t.x-p.x,t.z-p.z);t.m.visible=!inside&&!!t.fine;farMesh.visible=!inside;const wants=!inside&&d<near+45;
   if(wants){t.last=clock;if(!t.near)candidates.push({t,d});else {t.m.visible=true;t.m.geometry=t.near;if(!t.fine){t.fine=true;dirty=true}}}
   else if(d>near+85||inside){t.m.geometry=t.far;t.m.visible=false;if(t.fine){t.fine=false;dirty=true}if(t.near&&clock-t.last>24){t.near.dispose();t.near=null;cache.delete(t)}}
  }
  candidates.sort((a,b)=>a.d-b.d);let built=0;for(const {t}of candidates){if(built>=2||performance.now()-start>3)break;t.near=make(t,2);t.m.geometry=t.near;t.m.visible=!inside;t.fine=true;dirty=true;cache.set(t,t.near);built++}
  updateView();
 }
 function updateView(){
  api.camera.updateMatrixWorld();frustum.setFromProjectionMatrix(projection.multiplyMatrices(api.camera.projectionMatrix,api.camera.matrixWorldInverse));
  const visible=cells.filter(t=>!t.fine&&frustum.intersectsSphere(t.far.boundingSphere)),key=visible.map(t=>cells.indexOf(t)).join(',');if(!dirty&&key===viewKey)return;viewKey=key;
  let offset=0;for(const t of visible){coarse.index.array.set(t.indices,offset);offset+=t.indices.length}coarse.index.needsUpdate=true;coarse.setDrawRange(0,offset);dirty=false;
 }
 return{farMesh,cells,update,updateView,get resident(){return cache.size},get queued(){return cells.filter(t=>t.m.visible&&!t.near).length}};
}
