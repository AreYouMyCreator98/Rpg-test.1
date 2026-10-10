// Sculpted western horizon: continuous ridges extend from the actual world edge.
// Outside the playable bounds; never a second source of collision or terrain height.
export function createWesternRange(THREE,ground,bounds,side='west'){
 const positions=[],colors=[],indices=[],nx=28,nz=100;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,along=j/nz;
  const x=side==='west'?bounds.left-u*410:side==='east'?bounds.right+u*410:bounds.left-180+along*(bounds.right-bounds.left+360);
  const z=side==='north'?bounds.top-u*410:side==='south'?bounds.bottom+u*410:bounds.top-180+along*(bounds.bottom-bounds.top+360);
  const ridgeAxis=side==='north'||side==='south'?x:z;
  const crest=105+48*Math.sin(ridgeAxis*.015)+30*Math.cos(ridgeAxis*.041)+25*Math.sin(ridgeAxis*.073);
  const ridge=Math.exp(-(((u-.36-.055*Math.sin(ridgeAxis*.019))/.18)**2))*crest;
  const back=Math.exp(-(((u-.78-.04*Math.cos(ridgeAxis*.025))/.19)**2))*(150+45*Math.cos(ridgeAxis*.028));
  const foothill=Math.sin(Math.PI*Math.min(u*2,1))*(12+8*Math.sin(ridgeAxis*.036));
  const y=ground(Math.max(bounds.left,Math.min(bounds.right,x)),Math.max(bounds.top,Math.min(bounds.bottom,z)))+ridge+back+foothill-(i===0?4:0);
  positions.push(x,y,z);const rock=Math.max(0,Math.min(1,(ridge+back-8)/48));const c=new THREE.Color(0x4c7857).lerp(new THREE.Color(0x929b9d),rock);
  if(ridge+back>125)c.lerp(new THREE.Color(0xe2eeeb),Math.min(1,(ridge+back-125)/34));
  c.multiplyScalar(.92+.08*Math.sin(ridgeAxis*.12+u*45));colors.push(c.r,c.g,c.b);
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:THREE.DoubleSide});const m=new THREE.Mesh(g,mat);m.name=side+' ridgelines';m.receiveShadow=false;return m;
}
