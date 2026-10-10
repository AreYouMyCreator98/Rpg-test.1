// Sculpted western horizon: continuous ridges extend from the actual world edge.
// Outside the playable bounds; never a second source of collision or terrain height.
export function createWesternRange(THREE,ground,bounds){
 const positions=[],colors=[],indices=[],nx=28,nz=100;
 for(let j=0;j<=nz;j++)for(let i=0;i<=nx;i++){
  const u=i/nx,z=bounds.top-180+j/nz*(bounds.bottom-bounds.top+360),x=bounds.left-u*410;
  const crest=105+48*Math.sin(z*.015)+30*Math.cos(z*.041)+25*Math.sin(z*.073);
  const ridge=Math.exp(-(((u-.36-.055*Math.sin(z*.019))/.18)**2))*crest;
  const back=Math.exp(-(((u-.78-.04*Math.cos(z*.025))/.19)**2))*(150+45*Math.cos(z*.028));
  const foothill=Math.sin(Math.PI*Math.min(u*2,1))*(12+8*Math.sin(z*.036));
  const y=ground(bounds.left,Math.max(bounds.top,Math.min(bounds.bottom,z)))+ridge+back+foothill-(i===0?4:0);
  positions.push(x,y,z);const rock=Math.max(0,Math.min(1,(ridge+back-25)/70));const c=new THREE.Color(0x4c7857).lerp(new THREE.Color(0x879997),rock);
  if(ridge+back>151)c.lerp(new THREE.Color(0xe2eeeb),Math.min(1,(ridge+back-151)/34));
  c.multiplyScalar(.92+.08*Math.sin(z*.12+u*45));colors.push(c.r,c.g,c.b);
 }
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;indices.push(a,c,b,b,c,d)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setIndex(indices);g.computeVertexNormals();
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true,side:THREE.DoubleSide});const m=new THREE.Mesh(g,mat);m.name='Western ridgelines';m.receiveShadow=false;return m;
}
