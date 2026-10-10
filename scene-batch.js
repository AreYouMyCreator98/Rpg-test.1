// Static props share geometry/materials and one draw call per material/shape.
export function batchScenery(THREE,root){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert(),batches=new Map();
 root.traverse(o=>{if(!o.isMesh)return;const key=o.geometry.uuid+':'+o.material.uuid;let b=batches.get(key);if(!b)batches.set(key,b={geometry:o.geometry,material:o.material,matrices:[]});b.matrices.push(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld))});
 root.clear();
 for(const b of batches.values()){const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;m.castShadow=true;m.receiveShadow=true;m.computeBoundingSphere();root.add(m)}
}
