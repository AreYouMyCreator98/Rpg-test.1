const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const ROOT='chainfall-mobile';
const imageNames=Array.from({length:7},(_,i)=>'attack'+(i+1));
for(const name of imageNames){
 const b=fs.readFileSync(ROOT+'/assets/hero-v6/'+name+'.webp');
 assert.equal(b.toString('ascii',0,4),'RIFF',name+' malformed RIFF');
 assert.equal(b.toString('ascii',8,12),'WEBP',name+' malformed WEBP');
 assert.equal(b.toString('ascii',12,16),'VP8X',name+' missing extended WebP header');
 assert.equal(b.readUIntLE(24,3)+1,1920,name+' incorrect width');
 assert.equal(b.readUIntLE(27,3)+1,160,name+' incorrect height');
 assert(b.length>40000,name+' unexpectedly small');
}
const actions=[];
let drawCount=0;
class FakeImage {
 set src(value){
  this.url=value;
  if(value.includes('/hero-v6/')){this.naturalWidth=1920;this.naturalHeight=160;}
  else {this.naturalWidth=768;this.naturalHeight=512;}
  actions.push(value);
  this.onload?.();
 }
}
const frameCanvas={width:0,height:0,getContext(){return {clearRect(){},drawImage(){drawCount++}}}};
const doc={createElement(){return {...frameCanvas}}};
const sandbox={window:{},document:doc,Image:FakeImage,console,Math};
const script=fs.readFileSync(ROOT+'/hero-v6.js','utf8');
vm.runInNewContext(script,sandbox,{filename:'hero-v6.js',timeout:2000});
const api=sandbox.window.ChainfallHeroV6;
assert.equal(api.loadedCount(),11,'7 combos plus 4 original sheets');
assert.equal(drawCount,108,'7×12 + 4×6 extracted independent frames');
const hero={weapon:0,x:200,y:427,face:1,combo:0,action:null,dodge:0,inv:0,vx:0,ground:true,vy:0,fury:0};
const renderer={save(){},restore(){},fill(){},beginPath(){},ellipse(){},translate(){},scale(){},drawImage(...args){drawOps.push(args)}};
let drawOps=[];
for(let i=0;i<7;i++){
 hero.combo=i;
 const move={wind:7,active:12,rec:10};
 hero.action={kind:'light',move,elapsed:0};
 assert.equal(api.getState(hero),'combo'+(i+1),'wrong attack state for hit '+(i+1));
 for(let j=0;j<12;j++){
  hero.action.elapsed=j*(move.wind+move.active+move.rec)/12;
  assert.equal(api.frameIndex(hero,{t:20},'combo'+(i+1)),j,'bad frame timing');
  assert(api.drawHero(renderer,hero,{t:20}),'cannot draw combo '+(i+1));
 }
}
assert.equal(drawOps.length,84,'all 84 unique sprites must render');
assert(drawOps.every(a=>a.length===5),'must draw pre-sliced frame with 5-arg drawImage');
assert.equal(api.frameIndex({...hero,action:{...hero.action,elapsed:10000}},{t:20},'combo7'),11,'frame must clamp at 12');
hero.weapon=2;assert(!api.drawHero(renderer,hero,{t:20}),'other weapons must use V4');
const source=fs.readFileSync(ROOT+'/game.js','utf8');
assert(source.includes("hero.action.queueNext=true"),'missing one-input attack buffer');
assert(source.includes("(hero.combo+1)%w.moves.length"),'combat engine still restricted to 3 hits');
assert(source.includes("if(chained&&state.phase==='playing')attack('light')"),'queued hit never fires');
assert(source.includes("ChainfallHeroV6.drawHero"),'new hero renderer not connected');
assert(source.includes("m('Final Oath'"),'final combo hit missing');
const html=fs.readFileSync(ROOT+'/index.html','utf8');
assert(html.includes('hero-v6.js?v=6.0')&&html.includes('game.js?v=6.0'),'cached old script');
console.log('V6 passed: 84 unique illustrated frames, 7 attack states, buffered input, non-combo fallback.');
