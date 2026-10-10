// One optional depth-aware pass. HUD stays in DOM and is never blurred.
export function createCinematic(THREE,renderer){
 let target=null;const size=new THREE.Vector2(),point=new THREE.Vector3();
 const uniforms={color:{value:null},depth:{value:null},pixel:{value:new THREE.Vector2()},near:{value:.1},far:{value:1000},focus:{value:7},strength:{value:1}};
 const material=new THREE.ShaderMaterial({uniforms,depthTest:false,depthWrite:false,vertexShader:'varying vec2 uv0;void main(){uv0=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:`
 #include <common>
 #include <packing>
 varying vec2 uv0;uniform sampler2D color,depth;uniform vec2 pixel;uniform float near,far,focus,strength;
 float distanceAt(vec2 p){return -perspectiveDepthToViewZ(texture2D(depth,p).x,near,far);}
 void main(){float z=distanceAt(uv0);float radius=smoothstep(focus+7.,focus+65.,z)*strength*3.;vec3 sum=texture2D(color,uv0).rgb;float total=1.;
 for(int i=0;i<12;i++){float angle=float(i)*2.399963;vec2 p=clamp(uv0+vec2(cos(angle),sin(angle))*sqrt((float(i)+.5)/12.)*radius*pixel,vec2(.001),vec2(.999));float sampleZ=distanceAt(p);float weight=step(focus+5.,sampleZ);sum+=texture2D(color,p).rgb*weight;total+=weight;}
 gl_FragColor=vec4(sum/total,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
 const scene=new THREE.Scene(),camera=new THREE.Camera(),quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);scene.add(quad);
 return {render(world,view,hero,settings){
  const enabled=settings.depthOfField!=='off'&&settings.depthOfField!==undefined&&settings.cameraMode!=='first'&&renderer.capabilities.isWebGL2;
  if(!enabled){if(target){target.dispose();target=null}renderer.render(world,view);return}
  renderer.getDrawingBufferSize(size);
  if(!target){target=new THREE.WebGLRenderTarget(size.x,size.y,{depthBuffer:true});target.depthTexture=new THREE.DepthTexture(size.x,size.y,THREE.UnsignedIntType)}
  if(target.width!==size.x||target.height!==size.y)target.setSize(size.x,size.y);
  hero.getWorldPosition(point);point.y+=1.1;point.applyMatrix4(view.matrixWorldInverse);
  uniforms.focus.value=Math.max(2,-point.z);uniforms.near.value=view.near;uniforms.far.value=view.far;uniforms.strength.value=settings.depthOfField==='cinematic'?1.6:.75;uniforms.pixel.value.set(1/size.x,1/size.y);uniforms.color.value=target.texture;uniforms.depth.value=target.depthTexture;
  const previous=renderer.getRenderTarget(),autoReset=renderer.info.autoReset;renderer.info.reset();renderer.info.autoReset=false;try{renderer.setRenderTarget(target);renderer.render(world,view);renderer.setRenderTarget(previous);renderer.render(scene,camera)}finally{renderer.setRenderTarget(previous);renderer.info.autoReset=autoReset}
 },dispose(){target?.dispose();target=null;quad.geometry.dispose();material.dispose()}};
}
