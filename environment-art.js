// Shared, texture-free art geometry. Gameplay rigs and collision shapes are untouched.
export function createForestArt(THREE){
 const pine=new THREE.ConeGeometry(1,1,10,3),p=pine.attributes.position;
 for(let i=0;i<p.count;i++){const y=p.getY(i),a=Math.atan2(p.getZ(i),p.getX(i)),tier=(Math.round((y+.5)*3)%2)?.91:1.06;const r=tier*(1+.065*Math.sin(a*5+y*9));p.setXYZ(i,p.getX(i)*r,y,p.getZ(i)*r)}
 pine.computeVertexNormals();
 const canopy=new THREE.IcosahedronGeometry(1,1);
 const leafMaterial=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,flatShading:false});
 const wind={value:0};leafMaterial.onBeforeCompile=s=>{s.uniforms.canopyWind=wind;s.vertexShader='uniform float canopyWind;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
 #ifdef USE_INSTANCING
 float phase=instanceMatrix[3].x*.12+instanceMatrix[3].z*.17;
 transformed.x+=sin(canopyWind*.8+phase)*.018*max(position.y+.5,0.);
 transformed.z+=cos(canopyWind*.65+phase)*.012*max(position.y+.5,0.);
 #endif`)};
 return{pine,canopy,leafMaterial,wind};
}
