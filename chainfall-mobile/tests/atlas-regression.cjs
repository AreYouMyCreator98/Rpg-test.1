/* Regression: frame atlas must be hard-clipped on Android/Chromium SVG canvas. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('chainfall-mobile/art-v2.js','utf8');
let images=0;
class Img{constructor(){images++}set src(v){this.url=v}get complete(){return true}get naturalWidth(){return 768}}
let recent=[],clipped=false;
const ctx={
 save(){recent.push(['save'])},restore(){recent.push(['restore'])},beginPath(){recent.push(['begin'])},
 rect(...a){recent.push(['rect',...a])},clip(){recent.push(['clip']);clipped=true},
 drawImage(...args){recent.push(['image',...args])},
 ellipse(){},fill(){},fillRect(){},stroke(){},arc(){},fillText(){},
 translate(){},scale(){},set globalAlpha(v){},set fillStyle(v){},set strokeStyle(v){},
 set lineWidth(v){},set textAlign(v){},set font(v){}
};
const sandbox={window:{},Image:Img,Math,console};
vm.runInNewContext(src,sandbox,{filename:'art-v2.js'});
const hero={x:210,y:427,face:1,action:null,inv:0,fury:0,vx:0,ground:true,vy:0,dodge:0,hit:0};
const game={t:120,wave:1};
assert(sandbox.window.ChainfallArt.drawHero(ctx,hero,game));
let image=recent.find(e=>e[0]==='image');
assert(clipped,'sprite was not clipped');
assert(image,'sprite image not drawn');
assert.equal(image.length,6,'must use complete atlas via 5-arg drawImage, not broken SVG source rectangle');
assert.equal(image[4],128*.93*6,'atlas width must cover all six frames before clipping');
const firstRect=recent.find(x=>x[0]==='rect');
assert.equal(firstRect[3],128*.93,'clip should contain only one frame width');
recent=[];clipped=false;
const enemy={type:'husk',x:730,y:427,face:-1,hp:60,maxHp:65,telegraph:0,attack:0,vx:0,dead:false,flash:0};
assert(sandbox.window.ChainfallArt.drawEnemy(ctx,enemy,{scale:1,range:52},game));
assert(clipped,'enemy atlas not clipped');
image=recent.find(e=>e[0]==='image');
assert.equal(image.length,6,'enemy must use full atlas drawImage with clipping');
console.log('SVG atlas canvas clipping regression passed: hero/enemy use one viewport and five-argument full-sheet draw.');
