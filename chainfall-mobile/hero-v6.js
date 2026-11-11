/* CHAINFALL V6: illustrated Chain Blades with a seven-stage, 12-frame combo.
   Seven compact transparent WebP strips are split into 84 single-frame canvases
   once on load. Idle, walk, run, heavy and fury retain V5 animation sheets.
   Each attack row keeps its original frame coordinates: no atlas clipping
   at render time, no rotating pose that breaks character alignment. */
(function(){
"use strict";
const CONFIG={
 idle:{cols:3,rows:2,cell:256,frames:6,src:"assets/hero-v5/idle.webp?v=5.0"},
 walk:{cols:3,rows:2,cell:256,frames:6,src:"assets/hero-v5/walk.webp?v=5.0"},
 run:{cols:3,rows:2,cell:256,frames:6,src:"assets/hero-v5/run.webp?v=5.0"},
 attack:{cols:3,rows:2,cell:256,frames:6,src:"assets/hero-v5/attack.webp?v=5.0"}
};
for(let i=1;i<=7;i++)CONFIG["combo"+i]={
 cols:12,rows:1,cell:160,frames:12,src:"assets/hero-v6/attack"+i+".webp?v=6.0"
};
const sheets={};
let loaded=0;
for(const [name,cfg] of Object.entries(CONFIG)){
 const img=new Image();
 img.decoding="async";
 img.onload=()=>{
   if(img.naturalWidth!==cfg.cols*cfg.cell||img.naturalHeight!==cfg.rows*cfg.cell){
     console.warn("CHAINFALL: wrong image dimensions for",name,img.naturalWidth,img.naturalHeight);
     return;
   }
   try{
     const cells=[];
     for(let i=0;i<cfg.frames;i++){
       const tile=document.createElement("canvas");
       tile.width=cfg.cell;tile.height=cfg.cell;
       const c=tile.getContext("2d",{alpha:true});
       if(!c)throw Error("No 2D sprite extraction context");
       c.clearRect(0,0,cfg.cell,cfg.cell);
       c.drawImage(img,(i%cfg.cols)*cfg.cell,Math.floor(i/cfg.cols)*cfg.cell,
         cfg.cell,cfg.cell,0,0,cfg.cell,cfg.cell);
       cells.push(tile);
     }
     sheets[name]=cells;
     loaded++;
   }catch(e){console.warn("CHAINFALL: could not extract",name,e)}
 };
 img.onerror=()=>console.warn("CHAINFALL: failed to load",name);
 img.src=cfg.src;
}
function getState(p){
 if(p.action){
   if(p.weapon===0&&p.action.kind==="light")return "combo"+Math.max(1,Math.min(7,(p.combo|0)+1));
   return "attack";
 }
 if(p.dodge>0||Math.abs(p.vx)>2.2)return "run";
 if(p.ground&&Math.abs(p.vx)>.34)return "walk";
 if(!p.ground)return "run";
 return "idle";
}
function frameIndex(p,world,name){
 if(name.startsWith("combo")||name==="attack"){
   const action=p.action;
   if(!action)return 0;
   const frames=name.startsWith("combo")?12:6;
   const total=Math.max(1,action.move.wind+action.move.active+action.move.rec);
   return Math.max(0,Math.min(frames-1,Math.floor(action.elapsed/total*frames)));
 }
 const speed=name==="idle"?.085:name==="walk"?.15:.22;
 return Math.floor(Math.max(0,world.t||0)*speed)%6;
}
function drawHero(ctx,p,world){
 if(p.weapon!==0)return false;
 const mode=getState(p);
 const fallback=mode.startsWith("combo")?"attack":mode;
 const spriteSet=sheets[mode]||sheets[fallback];
 if(!spriteSet)return false;
 const animName=sheets[mode]?mode:fallback;
 const frame=spriteSet[frameIndex(p,world,animName)];
 if(!frame)return false;
 const width=mode.startsWith("combo")?190:174;
 const height=width;
 ctx.save();
 ctx.fillStyle="rgba(0,0,0,.55)";
 ctx.beginPath();ctx.ellipse(p.x,435,33,6,0,0,Math.PI*2);ctx.fill();
 ctx.translate(p.x,p.y);
 ctx.scale(p.face,1);
 if(p.inv>0&&Math.floor(p.inv/3)%2===0)ctx.globalAlpha=.57;
 const bob=mode==="walk"?Math.sin((world.t||0)*.17)*1.3:mode==="idle"?Math.sin((world.t||0)*.08)*.7:0;
 ctx.drawImage(frame,-width/2,-height*.94+bob,width,height);
 if(p.fury>=50){
  ctx.fillStyle="rgba(255,162,65,.12)";
  ctx.beginPath();ctx.ellipse(0,-70,39,51,0,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
 return true;
}
window.ChainfallHeroV6={
 drawHero,getState,frameIndex,loadedCount:()=>loaded,
 hasArt:name=>!!sheets[name],animationNames:Object.keys(CONFIG)
};
})();