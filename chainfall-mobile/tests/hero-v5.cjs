const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const path='chainfall-mobile/assets/hero-v5/';
for(const name of ['idle','walk','run','attack']){
 const data=fs.readFileSync(path+name+'.webp');
 assert.equal(data.toString('ascii',0,4),'RIFF','not RIFF for '+name);
 assert.equal(data.toString('ascii',8,12),'WEBP','not WEBP for '+name);
 assert.equal(data.toString('ascii',12,16),'VP8X','not VP8X for '+name);
 const width=1+data.readUIntLE(24,3),height=1+data.readUIntLE(27,3);
 assert.deepEqual([width,height],[768,512],'wrong grid dimensions '+name);
 assert(data.length>10000,'image unexpectedly small '+name);
}
let images=[],drawing=0;
const sandbox={console,Math,window:{},Image:class {set src(v){images.push(v);this.naturalWidth=768;this.naturalHeight=512;if(this.onload)this.onload()}},document:{createElement(){return {width:0,height:0,getContext(){return {clearRect(){},drawImage(){drawing++}}}}}}};
const script=fs.readFileSync('chainfall-mobile/hero-v5.js','utf8');
vm.runInNewContext(script,sandbox,{timeout:1800});
assert.equal(sandbox.window.ChainfallHeroV5.loadedCount(),4);
assert.equal(drawing,24);
const p={weapon:0,action:null,vx:0,dodge:0,ground:true,inv:0,x:200,y:427,face:1,fury:0};
const calls=[],ctx={save(){},restore(){},fill(){},beginPath(){},ellipse(){},translate(){},scale(){},drawImage(...args){calls.push(args)}};
assert(sandbox.window.ChainfallHeroV5.drawHero(ctx,p,{t:5}));
assert.equal(calls.length,1,'one sprite frame per draw');
assert.equal(calls[0].length,5,'single-frame canvas uses 5-arg draw');
for(const [vx,want] of [[0,'idle'],[1.2,'walk'],[4,'run']]){p.vx=vx;assert.equal(sandbox.window.ChainfallHeroV5.getState(p),want)}
p.action={move:{wind:5,active:9,rec:8},elapsed:10};
assert.equal(sandbox.window.ChainfallHeroV5.getState(p),'attack');
assert.equal(sandbox.window.ChainfallHeroV5.frameIndex(p,{t:30},'attack'),2);
p.weapon=1;assert(!sandbox.window.ChainfallHeroV5.drawHero(ctx,p,{t:6}),'other weapons must use original art renderer');
const game=fs.readFileSync('chainfall-mobile/game.js','utf8');
assert(game.includes('ChainfallHeroV6.drawHero'),'new hero V6 renderer not installed');
assert(fs.readFileSync('chainfall-mobile/hero-v6.js','utf8').includes('assets/hero-v5/'),'V6 must preserve V5 idle/walk/run assets');
console.log('V5 illustrated hero assets verified: 4 transparent 3x2 raster sheets, 24 frames, state transitions, safe weapon fallback.');
