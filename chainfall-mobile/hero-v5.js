/* CHAINFALL V5 — original illustrated hero animations.
 * Real transparent WebP image data (four sheets, six poses per sheet).
 * Frame images are extracted once to independent 256x256 canvases to prevent
 * the split/duplicated SVG animation problems encountered in older versions.
 * Other weapons and enemies continue to use the working V4 renderer.
 */
(function(){
"use strict";
const S={idle:{fps:7},walk:{fps:9},run:{fps:13},attack:{fps:14}};
const SHEET_W=768,SHEET_H=512,COLS=3,ROWS=2,SIZE=256;
const frames={};
let loaded=0;
for(const [name,config] of Object.entries(S)){
  const img=new Image();img.decoding="async";
  img.onload=()=>{
    if(img.naturalWidth!==SHEET_W||img.naturalHeight!==SHEET_H){console.warn("CHAINFALL: unexpected "+name+" sprite dimensions");return}
    try{
      const sprites=[];
      for(let i=0;i<COLS*ROWS;i++){
        const frame=document.createElement("canvas");
        frame.width=SIZE;frame.height=SIZE;
        const ctx=frame.getContext("2d",{alpha:true});
        ctx.clearRect(0,0,SIZE,SIZE);
        ctx.drawImage(img,(i%COLS)*SIZE,Math.floor(i/COLS)*SIZE,SIZE,SIZE,0,0,SIZE,SIZE);
        sprites.push(frame);
      }
      frames[name]=sprites;
      loaded++;
    }catch(e){console.warn("CHAINFALL: image extraction fallback",e)}
  };
  img.onerror=()=>console.warn("CHAINFALL: could not load "+name+" hero artwork");
  img.src="assets/hero-v5/"+name+".webp?v=5.0";
}
function frameIndex(p,world,name){
  if(name==="attack"){
    const a=p.action;
    if(!a)return 0;
    const total=Math.max(1,a.move.wind+a.move.active+a.move.rec);
    return Math.max(0,Math.min(5,Math.floor(a.elapsed/total*6)));
  }
  const speed=name==="idle"?.085:name==="walk"?.15:.22;
  return Math.floor(Math.max(0,world.t||0)*speed)%6;
}
function getState(p){
  if(p.action)return "attack";
  if(p.dodge>0||Math.abs(p.vx)>2.2)return "run";
  if(p.ground&&Math.abs(p.vx)>.34)return "walk";
  if(!p.ground)return "run";
  return "idle";
}
function drawHero(ctx,p,world){
  if(p.weapon!==0)return false;
  const state=getState(p);
  const sheet=frames[state];
  if(!sheet||sheet.length!==6)return false;
  const frame=sheet[frameIndex(p,world,state)];
  if(!frame)return false;
  const width=174,height=174;
  ctx.save();
  ctx.fillStyle="rgba(0,0,0,.55)";
  ctx.beginPath();ctx.ellipse(p.x,427+8,33,6,0,0,Math.PI*2);ctx.fill();
  ctx.translate(p.x,p.y);
  ctx.scale(p.face,1);
  if(p.inv>0&&Math.floor(p.inv/3)%2===0)ctx.globalAlpha=.57;
  const bob=state==="walk"?Math.sin((world.t||0)*.17)*1.3:state==="idle"?Math.sin((world.t||0)*.08)*.7:0;
  // The feet in each generated cell sit at about 92% of the cell height.
  ctx.drawImage(frame,-width/2,-height*.94+bob,width,height);
  if(p.fury>=50){
    ctx.fillStyle="rgba(255,162,65,.12)";
    ctx.beginPath();ctx.ellipse(0,-70,39,51,0,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  return true;
}
window.ChainfallHeroV5={drawHero,getState,frameIndex,loadedCount:()=>loaded,hasArt:name=>!!frames[name],animationNames:Object.keys(S)};
})();