/* Android sprite rendering regression: one SVG per frame, not an atlas. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync('chainfall-mobile/art-v3.js','utf8');
assert(!source.includes('ctx.clip('),'Clip-based renderer was accidentally restored');
assert(!source.includes('ctx.rect('),'Clip-based renderer was accidentally restored');
let images=[];
class FakeImage{constructor(){this.complete=true;this.naturalWidth=128}
  set src(url){this.url=url;images.push(url)}
}
let drawImageCalls=[];
const ctx={
 save(){},restore(){},drawImage(...args){drawImageCalls.push(args)},beginPath(){},ellipse(){},
 fill(){},fillRect(){},translate(){},scale(){},stroke(){},arc(){},fillText(){},
 set globalAlpha(v){},set fillStyle(v){},set strokeStyle(v){},
 set lineWidth(v){},set textAlign(v){},set font(v){}
};
const sandbox={window:{},Image:FakeImage,Math,console};
vm.runInNewContext(source,sandbox,{filename:'art-v3.js'});
const api=sandbox.window.ChainfallArt;
const hero={x:210,y:427,face:1,action:null,inv:0,fury:0,vx:0,ground:true,vy:0,dodge:0,hit:0};
assert(api.drawHero(ctx,hero,{t:50,wave:1}));
const heroDraw=drawImageCalls.at(-1);
assert.equal(heroDraw.length,5,'standalone frame must use drawImage(image,x,y,w,h)');
assert(heroDraw[0].url.match(/\/hero\/idle\/f[0-5]\.svg$/));
drawImageCalls=[];
const enemy={type:'husk',x:730,y:427,face:-1,hp:60,maxHp:65,telegraph:0,attack:0,vx:0,dead:false,flash:0};
assert(api.drawEnemy(ctx,enemy,{scale:1,range:52},{t:80,wave:1}));
assert(drawImageCalls[0][0].url.match(/\/husk\/idle\/f[0-5]\.svg$/));
assert.equal(drawImageCalls[0].length,5);
assert(images.every(x=>!x.match(/\/actors\/\w+\/\w+\.svg$/)),'old atlas path was requested');
console.log('V3 passed: separate per-frame sources and 5-argument drawImage.');
