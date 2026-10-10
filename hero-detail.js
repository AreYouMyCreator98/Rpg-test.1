// Reusable tailored geometry, attached to the original articulated/equipment rig.
export function refineAdventurer(THREE,ch){
 const leather=new THREE.MeshStandardMaterial({color:0x503725,roughness:.85}),trim=new THREE.MeshStandardMaterial({color:0xb79b62,metalness:.65,roughness:.4});
 function panel(points,depth=.045){const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.018,bevelThickness:.012,bevelSegments:1,steps:1})}
 function add(geo,mat,parent,x,y,z){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
 // Replace the flat rectangular cloak with a tapered, pleated, scalloped silhouette.
 const v=[],ix=[];for(let r=0;r<7;r++)for(let c=0;c<9;c++){const u=c/8,t=r/6;v.push((u-.5)*(.88+t*.25),.5-t*1.05+(r===6?Math.abs(u-.5)*.11:0),Math.sin(u*Math.PI*6)*.28*t-Math.sin(t*Math.PI)*.5)}
 for(let r=0;r<6;r++)for(let c=0;c<8;c++){const a=r*9+c;ix.push(a,a+1,a+9,a+1,a+10,a+9)}const cape=new THREE.BufferGeometry();cape.setAttribute('position',new THREE.Float32BufferAttribute(v,3));cape.setIndex(ix);cape.computeVertexNormals();ch.cape.geometry=cape;
 // Replace spherical pauldrons with a curved, layered armour shell.
 const pv=[],pi=[];for(let row=0;row<4;row++)for(let col=0;col<9;col++){const a=col/8*Math.PI;pv.push(Math.cos(a)*(1-row*.09),Math.sin(a)*(.75-row*.1)-row*.22,(row/3-.5)*1.7)}
 for(let r=0;r<3;r++)for(let c=0;c<8;c++){const a=r*9+c;pi.push(a,a+1,a+9,a+1,a+10,a+9)}const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(pv,3));shell.setIndex(pi);shell.computeVertexNormals();ch.shoulder.forEach(m=>{m.geometry=shell;m.material.side=THREE.DoubleSide});ch.arms.forEach(a=>{a.children[0].geometry=shell;});
 // Smaller inset eyes and swept locks refine the existing expressive head.
 ch.head.children.filter(o=>o.isMesh&&o.geometry.type==='BoxGeometry').forEach(o=>{o.scale.x*=.82;o.scale.y*=.72});
 const hair=ch.head.children[2]?.material;
 for(let k=0;k<5;k++){const lock=add(panel([[-.06,.13],[.07,.11],[.10,-.04],[.025,-.18],[-.04,-.06]],.045),hair,ch.head,-.21+k*.095,.21,.20);lock.rotation.z=-.28+k*.07;}
 // Chest harness, collar and layered tassets follow existing torso movement.
 for(const side of [-1,1]){
 const strap=add(panel([[-.055,.32],[.055,.32],[.055,-.32],[-.055,-.32]]),leather,ch.rig,side*.19,1.23,.275);strap.rotation.z=side*.42;
 add(panel([[-.12,.13],[.12,.13],[.15,-.12],[0,-.2],[-.15,-.12]]),ch.bodyMat,ch.rig,side*.23,.83,.25);
 const cuff=add(new THREE.CylinderGeometry(.151,.14,.22,10,1,true),leather,ch.arms[side===-1?0:1],0,-.47,0);
 add(new THREE.TorusGeometry(.145,.018,4,10),trim,cuff,0,.07,0).rotation.x=Math.PI/2;
 add(panel([[-.09,.10],[.09,.10],[.075,-.12],[0,-.16],[-.075,-.12]],.035),ch.bodyMat,ch.legs[side===-1?0:1],0,-.28,.135);
 }
 const clasp=add(new THREE.TorusGeometry(.075,.016,4,8),trim,ch.rig,0,1.45,.3);clasp.rotation.z=Math.PI/4;
 // Sculpted angular cheek planes rather than additional square facial blocks.
 const skin=ch.head.children.find(o=>o.isMesh)?.material;
 for(const side of [-1,1])add(panel([[-.07,.055],[.07,.025],[.05,-.06],[-.04,-.085]],.018),skin,ch.head,side*.18,-.08,.23);
 ch.root.userData.refinedAdventurer=true;
}
