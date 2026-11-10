/* CHAINFALL V2 individual-frame renderer. Original local SVG assets, no external image host. */
(function(){
"use strict";
const ROOT="assets/v3/",SCENE_ROOT="assets/v2/",FRAMES=6,FRAME_W=128,FRAME_H=192;
const stages=["gate","cathedral","forge","abyss","throne"];
const anims={
 hero:["idle","run","jump","fall","dodge","hurt","death","attack1","attack2","attack3","heavy","special"],
 husk:["idle","run","attack","hurt","death"],
 raider:["idle","run","attack","hurt","death"],
 shade:["idle","run","attack","hurt","death","special"],
 brute:["idle","run","attack","hurt","death"],
 warden:["idle","run","attack","hurt","death","special"]
};
const images=new Map(),sequences=new Map();
function load(path){
 if(images.has(path))return images.get(path);
 const image=new Image();
 image.decoding="async";
 image.src=(path.startsWith("scenes/")?SCENE_ROOT:ROOT)+path;
 images.set(path,image);
 return image;
}
function ready(im){return !!(im&&im.complete&&im.naturalWidth===128)}
function readyScene(im){return !!(im&&im.complete&&im.naturalWidth>0)}
function sequence(name,action){
 const key=name+"/"+action;
 if(!sequences.has(key))sequences.set(key,Array.from({length:FRAMES},(_,i)=>load("actors/"+key+"/f"+i+".svg")));
 const frames=sequences.get(key);
 return frames.every(ready)?frames:null;
}
function prefetch(){
 for(const place of stages)for(const layer of ["sky","ruins","foreground"])load("scenes/"+place+"-"+layer+".svg");
 for(const name of Object.keys(anims)){
  sequence(name,"idle");sequence(name,"run");
 }
 sequence("hero","attack1");sequence("hero","attack2");sequence("hero","attack3");
}
function stage(wave){return Math.floor((Math.max(1,wave)-1)/4)%stages.length}
function bg(ctx,game,w,h){
 const t=game.t||0,place=stages[stage(game.wave||1)];
 const imgs=["sky","ruins","foreground"].map(layer=>load("scenes/"+place+"-"+layer+".svg"));
 if(!imgs.every(readyScene))return false;
 ctx.drawImage(imgs[0],-35,0,w+70,h);
 ctx.drawImage(imgs[1],-13+Math.sin(t*.002)*4,0,w+26,h);
 ctx.drawImage(imgs[2],0,0,w,h);
 // atmospheric depth: embers, ashfall and distant mist
 ctx.save();
 for(let i=0;i<54;i++){
   const x=(i*173.7+t*(.1+i%4*.085))%(w+30)-15;
   const y=(i*83.5-t*(.11+i%5*.082))%(h+20)+12;
   const r=.5+(i%4)*.45,alpha=.09+(i%7)*.048;
   ctx.fillStyle=place==="abyss"?"rgba(168,209,255,"+alpha+")":"rgba(255,178,116,"+alpha+")";
   ctx.fillRect(x,y,r,r*1.6);
 }
 ctx.restore();
 return true;
}
function frameOf(actor,key,game,isEnemy){
 if(key==="death"&&isEnemy)return Math.min(5,Math.floor(((22-actor.deathTimer)/22)*FRAMES));
 if(key==="special"&&!isEnemy)return Math.floor((actor.action.elapsed/Math.max(1,actor.action.move.wind+actor.action.move.active+actor.action.move.rec))*6)%6;
 if(key==="attack1"||key==="attack2"||key==="attack3"||key==="heavy")return Math.min(5,Math.floor((actor.action?.elapsed||0)/Math.max(1,(actor.action?.move.wind||10)+(actor.action?.move.active||10)+(actor.action?.move.rec||10))*6));
 if(key==="attack")return Math.floor((game.t*.12)%FRAMES);
 if(key==="dodge")return Math.floor((18-actor.dodge)/3)%FRAMES;
 if(key==="hurt")return Math.floor(game.t*.19)%FRAMES;
 if(key==="jump"||key==="fall")return Math.floor(game.t*.10)%FRAMES;
 if(key==="run")return Math.floor(game.t*.17)%FRAMES;
 return Math.floor(game.t*.045)%FRAMES;
}
function sprite(ctx,image,x,y,size,alpha=1){
 if(!ready(image))return false;
 // Each source image is one physical frame (128x192).
 // No sprite-sheet crop, no source rectangles, no SVG viewBox ambiguity.
 const height=FRAME_H*(size/FRAME_W);
 ctx.save();ctx.globalAlpha=alpha;
 ctx.drawImage(image,x-size*.5,y-height+8,size,height);
 ctx.restore();
 return true;
}
function shadow(ctx,x,y,scale){
 ctx.save();ctx.fillStyle="#0009";ctx.beginPath();ctx.ellipse(x,y+7,27*scale,5*scale,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function hero(ctx,p,game){
 let anim=p.dodge>0?"dodge":p.hit>0?"hurt":p.action?(p.action.kind==="special"?"special":p.action.kind==="heavy"?"heavy":"attack"+(p.combo+1)):!p.ground?(p.vy<0?"jump":"fall"):Math.abs(p.vx)>.5?"run":"idle";
 const frames=sequence("hero",anim);
 if(!frames)return false;
 const scl=.93;shadow(ctx,p.x,427,1);
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.face,1);
 // The atlas is centered at the character and remains independent of weapon pose
 const size=128*scl;
 sprite(ctx,frames[Math.max(0,Math.min(5,frameOf(p,anim,game,false)))],0,0,size,p.inv>0&&Math.floor(p.inv/3)%2===0?.66:1);
 if(p.fury>=50){
   ctx.fillStyle="rgba(255,173,79,.06)";ctx.beginPath();ctx.arc(0,-80,52,0,6.283);ctx.fill();
 }
 ctx.restore();
 return true;
}
function enemy(ctx,e,def,game){
 let anim=e.dead?"death":e.flash>0?"hurt":e.telegraph>0||e.attack>0?"attack":Math.abs(e.vx)>.19?"run":"idle";
 const frames=sequence(e.type,anim);
 if(!frames)return false;
 const scale=def.scale*.90,sz=128*scale;
 shadow(ctx,e.x,427,def.scale);
 ctx.save();ctx.translate(e.x,e.y);ctx.scale(e.face,1);
 sprite(ctx,frames[Math.max(0,Math.min(5,frameOf(e,anim,game,true)))],0,0,sz,e.dead?Math.min(1,e.deathTimer/13):1);
 ctx.restore();
 if(!e.dead&&(e.hp<e.maxHp||e.type==="warden")){
   const width=e.type==="warden"?132:36,y=e.y-132*scale;
   ctx.fillStyle="#090b14db";ctx.fillRect(e.x-width/2,y,width,6);
   ctx.fillStyle=e.type==="warden"?"#eca662":"#c57267";ctx.fillRect(e.x-width/2,y,width*Math.max(0,e.hp/e.maxHp),6);
   if(e.type==="warden"){ctx.textAlign="center";ctx.font="bold 11px Cinzel,serif";ctx.fillStyle="#f5d2a4";ctx.fillText("THE ASHEN WARDEN",e.x,y-10)}
 }
 if(e.telegraph>0){
   ctx.save();ctx.globalAlpha=.32+.18*Math.sin(game.t*.4);ctx.strokeStyle="#ff7258";ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(e.x+e.face*def.range*.6,e.y-55*scale,def.range*.6,27,0,0,6.283);ctx.stroke();ctx.restore();
 }
 return true;
}
window.ChainfallArt={prefetch,drawBackground:bg,drawHero:hero,drawEnemy:enemy,stages,manifest:anims};
prefetch();
})();