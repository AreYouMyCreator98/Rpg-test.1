// Skinned asset validation, independent of gameplay and saves.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),cache=process.env.SCOUT_TEST_CACHE;
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});
 try{const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://asset.test/**',r=>{const file=new URL(r.request().url()).pathname;return r.fulfill({path:path.join(root,file),contentType:file.endsWith('.html')?'text/html':'model/gltf-binary'})});
 if(cache)for(const f of ['three.module.js','GLTFLoader.js','BufferGeometryUtils.js'])await page.route('**/'+f,r=>r.fulfill({path:path.join(cache,f),contentType:'text/javascript'}));
 await page.goto('http://asset.test/previews/goblin-scout/index.html');await page.waitForFunction(()=>window.assetReview);
 const report=await page.evaluate(()=>{const {THREE,asset,mixer,renderer}=assetReview;let triangles=0,weighted=0,bad=0;asset.scene.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.isSkinnedMesh){weighted++;const w=o.geometry.attributes.skinWeight;for(let i=0;i<w.count;i++)if(Math.abs(w.getX(i)+w.getY(i)+w.getZ(i)+w.getW(i)-1)>.001)bad++}});
 const sweeps={};for(const clip of asset.animations){mixer.stopAllAction();const a=mixer.clipAction(clip);a.reset().play();const bounds=[];for(let frame=0;frame<=30;frame++){mixer.setTime(clip.duration*(frame/30)*.99999);asset.scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(asset.scene,true);bounds.push([box.min.y,box.max.y])}sweeps[clip.name]=bounds}
 const poses={};for(const clip of asset.animations){mixer.stopAllAction();const a=mixer.clipAction(clip);a.reset().play();mixer.setTime(clip.duration*.45);asset.scene.updateMatrixWorld(true);const b=asset.scene.getObjectByName('HandR')||asset.scene.getObjectByName('Hand.R');poses[clip.name]={duration:clip.duration,bounds:new THREE.Box3().setFromObject(asset.scene,true).min.toArray(),hand:b?.matrixWorld.elements.slice()};}
 return {sweeps,triangles,weighted,bad,clips:asset.animations.map(c=>c.name),poses,draws:renderer.info.render.calls};});
 for(const [name,frames] of Object.entries(report.sweeps))for(const [min,max] of frames){assert(Number.isFinite(min)&&Number.isFinite(max));assert(min>-.035,name+' must not sink through floor: '+min);assert(max<3.5,name+' must not stretch beyond the rig')}assert(report.sweeps.Death.at(-1)[1]<1.3,'death ends in a grounded collapse');delete report.sweeps;
 assert.deepEqual(report.clips,['Idle','Walk','Run','Attack','Hit','Death']);assert(report.triangles>=8000&&report.triangles<=12000);assert(report.weighted>0);assert.equal(report.bad,0);for(const p of Object.values(report.poses)){assert(p.duration>0);assert(p.bounds.every(Number.isFinite));assert(p.hand,'weapon hand exists')};assert.notDeepEqual(report.poses.Attack.hand,report.poses.Idle.hand);assert.notDeepEqual(report.poses.Walk.hand,report.poses.Idle.hand);assert.deepEqual(errors,[]);console.log('PASS GLTFLoader, WebGL, normalized skin weights, six clips, distinct animated poses',JSON.stringify(report));
 await page.evaluate(()=>{assetReview.mixer.stopAllAction();document.querySelector('#clip').dispatchEvent(new Event('change'))});await page.waitForTimeout(100);await page.screenshot({path:process.env.TEST_ARTIFACT_DIR+'/scout-webgl.png'});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
