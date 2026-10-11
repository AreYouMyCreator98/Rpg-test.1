import {batchScenery} from './scene-batch.js?v=realm-net-sync-1';
// Wall relief, masonry joints and lighting fixtures stay at existing boundaries.
export function installStrongholdArt({THREE,scene,mesh,mat,ground,hero,arenas,expansion,frontier}){
 const cells=[];
 function cell(x,z,inside=false){const g=new THREE.Group();scene.add(g);cells.push({x,z,inside,g});return g}
 function p(g,shape,c,x,y,z,sx,sy,sz){return mesh(shape,c,x,y,z,sx,sy,sz,g)}
 function arch(g,x,y,z,color){for(const side of [-1,1])for(let row=0;row<8;row++)p(g,'box',row%2?color:0x9b9b86,x+side*2.65,y+.35+row*.6,z,.8,.55,1.5);for(let i=0;i<9;i++){const a=i*Math.PI/8,m=p(g,'box',color,x+Math.cos(a)*2.65,y+4.4+Math.sin(a)*1.55,z,.7,.7,1.55);m.rotation.z=a}
  for(const side of [-1,1]){p(g,'box',0x373b35,x+side*2.7,y+2.1,z+.85,.5,.1,.6);p(g,'cyl',0x725037,x+side*2.7,y+2.35,z+.9,.07,.5,.07);p(g,'cone',mat(0xe6bb68,{emissive:0xdd7629,emissiveIntensity:1}),x+side*2.7,y+2.8,z+.9,.16,.45,.16)}
 }
 for(const a of arenas.arenas){const g=cell(a.x,a.z,a.inside);for(const side of [-1,1])for(let k=-a.wz+1;k<a.wz;k+=2)for(let row=0;row<3;row++)p(g,'box',row%2?0x778077:0x969b88,a.x+side*(a.wx-.42),ground(a.x+side*a.wx,a.z+k)+.4+row*.5,a.z+k+(row%2)*.4,.12,.38,1.55);
  arch(g,a.x,ground(a.x,a.gateZ),a.gateZ,0x7c8376);batchScenery(THREE,g);
 }
 for(const d of expansion.dungeons){
  const door=cell(...d.entry);arch(door,d.entry[0],ground(...d.entry),d.entry[1]-.2,d.color);for(const side of [-1,1])for(let i=0;i<6;i++)p(door,'box',d.color,d.entry[0]+side*(3.4+i*.65),ground(...d.entry)+2.5-i*.3,d.entry[1]-.4,.8,5-i*.6,1.4);batchScenery(THREE,door);
  const g=cell(d.origin,-26,true),stone=d.id==='frost'?0x99aeb3:d.id==='forge'?0x605854:0x858878;
  for(const z of [3,-8,-27]){arch(g,d.origin,0,z,stone);for(const side of [-1,1])for(let row=0;row<5;row++)p(g,'box',stone,d.origin+side*2.8,.25+row*.5,z-2,.3,.4,2.7)}
  for(const side of [-1,1])for(const z of [-15,-19,-23]){const x=d.origin+side*17.5;p(g,'box',stone,x,1.6,z,.5,3.2,.7);p(g,'box',stone,x,3.3,z,.9,.3,1);p(g,'box',0x424d45,x-side*.3,1.5,z,.12,1.7,.45)}
  for(const cx of [-13,13])for(let x=-3;x<=3;x+=1.2)for(let z=-22;z<=-14;z+=1.4)p(g,'box',stone,d.origin+cx+x,.008,z,1.1,.012,1.3);
  // Recessed alcoves and a carved frieze retain the alternate paths and puzzle access.
  for(const side of [-1,1])for(let i=0;i<11;i++){p(g,'box',stone,d.origin+side*13.3,3.6,-35-i*2.3,.4,.35,1.9);p(g,'orb',d.color,d.origin+side*13.1,3,-35-i*2.3,.14,.3,.3)}
  batchScenery(THREE,g);
 }
 const hollow=cell(300,-24,true);for(const z of [-3,-13,-25]){for(const side of [-1,1]){p(hollow,'box',0x6e5840,300+side*3.6,2.3,z,.28,4.6,.35);p(hollow,'box',0x584937,300+side*3.6,1.5,z,1,.14,.7)}p(hollow,'box',0x6e5840,300,4.5,z,7.5,.28,.35)}batchScenery(THREE,hollow);
 const city=frontier.settlements[0],g=cell(city.x,city.z),ky=ground(city.x,city.z+39);
 for(const side of [-1,1]){
  for(let row=0;row<21;row++){p(g,'box',0x727d70,city.x+side*3.94,ky+.3+row*.65,city.z+39,.09,.075,6.8);for(const end of [-1,1])p(g,'box',row%2?0xaeb199:0x959d89,city.x+side*3.98,ky+.35+row*.65,city.z+39+end*3.35,.22,.52,row%2?.6:.9)}
  for(const z of [-1.8,1.8])for(const y of [4,7.5,11]){p(g,'box',0x34413d,city.x+side*3.98,ky+y,city.z+39+z,.1,1.4,.55);p(g,'box',0xbab18f,city.x+side*4.08,ky+y-.76,city.z+39+z,.25,.15,.85);for(const dz of [-.37,.37])p(g,'box',0xa1a68f,city.x+side*4.02,ky+y,city.z+39+z+dz,.2,1.7,.14)}
  p(g,'box',0x425f7e,city.x+side*4.05,ky+9.5,city.z+39,.10,3.5,1.1);p(g,'box',0xc8ae67,city.x+side*4.13,ky+9.7,city.z+39,.06,.7,.16);
 }
 for(const s of frontier.structures.filter(s=>s.kind==='wall'||s.kind==='tower')){const y=ground(s.x,s.z);if(s.kind==='tower'){for(let row=0;row<11;row++)p(g,'cyl',row%2?0x939c8a:0x748476,s.x,y+.35+row*.67,s.z,2.53,.08,2.53);for(const side of [-1,1])for(const h of [3,5.5]){p(g,'box',0x33423e,s.x+side*2.51,y+h,s.z,.08,1.1,.32);p(g,'box',0x33423e,s.x,y+h,s.z+side*2.51,.32,1.1,.08)}continue}for(let row=0;row<6;row++)for(const side of [-1,1])p(g,'box',row%2?0x899385:0xadb09a,s.x,y+.35+row*.65,s.z+side*(s.d/2+.035),s.w-.12,.53,.09)}batchScenery(THREE,g);
 return{cells,update(){for(const c of cells)c.g.visible=(hero.root.position.x>200)===c.inside&&Math.hypot(hero.root.position.x-c.x,hero.root.position.z-c.z)<145}};
}
