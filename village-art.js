// Authored village detailing, emitted into the existing deterministic scenery batches.
// No additional collisions: architecture remains within existing building footprints.
export function dressVillage({THREE,buildings,ground,add,geometries}){
 const outline=new THREE.Shape();outline.moveTo(-.5,.5);outline.lineTo(.5,.5);outline.lineTo(.48,-.34);outline.quadraticCurveTo(0,-.64,-.48,-.34);outline.closePath();
 const tile=new THREE.ExtrudeGeometry(outline,{depth:.09,bevelEnabled:false});tile.rotateX(Math.PI/2);geometries.shingle=tile;
 const stone=new THREE.DodecahedronGeometry(1,0);geometries.cobble=stone;
 const emit=add;
 const roof=[0x805d47,0x577e79,0x6a7653,0x91684e];
 for(const [bi,b] of buildings.entries()){
  const {x,z}=b,y=ground(x,z),tint=roof[bi%4],wx=(b.w||5.4)/5.4,dz=(b.d||4.4)/4.4,h=b.h||3.3;
  const add=(shape,c,px,py,pz,sx,sy,sz,...rest)=>emit(shape,c,x+(px-x)*wx,y+(py-y<=3.3?(py-y)*h/3.3:h+py-y-3.3),z+(pz-z)*dz,sx*wx,sy*(py-y<=3.3?h/3.3:1),sz*dz,...rest);
  // Individually lapped, round-ended shingles and overhanging carved bargeboards.
  for(const side of [-1,1]){
   for(let row=0;row<8;row++)for(let col=0;col<12;col++){
    const xx=.22+row*.4,zz=-2.65+col*.47+(row%2)*.16;
    const c=new THREE.Color(tint).multiplyScalar(.82+((row*7+col*3)%9)*.035);
    add('shingle',c.getHex(),x+side*xx,y+5.12-xx*.52,z+zz,.55,.8,.58,0,-side*.48);
   }
   for(const end of [-1,1])add('box',0x4d3326,x+side*1.65,y+4.05,z+end*2.92,3.75,.20,.18,0,-side*.48);
   // Warm dressed-stone plinth, irregular stacked joints and corner quoins.
   for(let row=0;row<3;row++)for(let col=0;col<9;col++)add('cobble',row%2?0x8a8875:0xaaa087,x-2.5+col*.63+(row%2)*.16,y+.14+row*.19,z+side*2.28,.37,.14,.19);
   for(const corner of [-1,1])for(let row=0;row<9;row++)add('box',row%2?0xc1b195:0xa49b84,x+corner*2.67,y+.55+row*.3,z+side*2.26,row%2?.29:.43,.24,.20);
   // Recessed sash frames with sills, slatted shutters and flower boxes.
   for(const wx of [-1.55,1.55]){
    for(const dx of [-.46,.46])add('box',0x4a3529,x+wx+dx,y+1.86,z+side*2.34,.11,1.22,.18);
    for(const h of [1.25,2.48])add('box',0x6b4930,x+wx,y+h,z+side*2.38,1.1,.13,.25);
    add('box',0x443b2f,x+wx,y+1.86,z+side*2.4,.055,1.1,.08);
    add('box',0x443b2f,x+wx,y+1.9,z+side*2.4,.85,.055,.08);
    for(const lr of [-1,1])for(let k=0;k<3;k++)add('box',0x63715b,x+wx+lr*(.59+k*.11),y+1.86,z+side*2.34,.09,1.13,.10);
    add('box',0x795336,x+wx,y+1.15,z+side*2.54,1.08,.23,.38);
    for(let k=0;k<5;k++){add('orb',0x426446,x+wx-.4+k*.2,y+1.35,z+side*2.57,.19,.17,.17);add('orb',k%2?0xe6c172:0xc7858e,x+wx-.4+k*.2,y+1.49,z+side*2.58,.075,.085,.075)}
   }
   // Gable fan framing and a deep eave shadow band.
   add('box',0x453a29,x,y+3.18,z+side*2.29,5.55,.22,.20);
   for(const dx of [-1,1])add('box',0x664930,x+dx*.85,y+3.85,z+side*2.34,.10,1.9,.14,0,-dx*.74);
  }
  for(const side of [-1,1]){
   // Side elevations are prominent at the smith; rotate the full window assembly.
   for(const wz of [-.95,1.05]){
    add('box',0xbfa775,x+side*2.79,y+1.88,z+wz,.055,1.12,1.02);
    for(const h of [1.23,2.5])add('box',0x9b7550,x+side*2.86,y+h,z+wz,.22,.15,1.26);
    for(const dz of [-.52,.52])add('box',0x694730,x+side*2.85,y+1.87,z+wz+dz,.18,1.25,.10);
    for(const dz of [-.25,0,.25])add('box',0x473626,x+side*2.91,y+1.87,z+wz+dz,.08,1.1,.045);
    add('box',0x473626,x+side*2.91,y+1.87,z+wz,.08,.065,1.03);
    for(const lr of [-1,1])for(let k=0;k<3;k++)add('box',0x52706a,x+side*2.84,y+1.87,z+wz+lr*(.62+k*.09),.11,1.14,.07);
   }
   for(let row=0;row<4;row++)for(let k=0;k<8;k++)add('cobble',row%2?0xaaa48c:0x8c917f,x+side*2.75,y+.12+row*.17,z-2+k*.57,.18,.12,.31);
  }
  for(let i=0;i<12;i++)add('cyl',0xa78663,x,y+4.96,z-2.65+i*.48,.20,.52,.20,0,0,false,Math.PI/2);
  // Chimney cap and coursed terracotta flue.
  for(let row=0;row<7;row++)for(const side of [-1,1])add('box',row%2?0x9b7962:0xb59b7a,x+1.7,y+3.7+row*.27,z-1.1+side*.35,.76,.22,.10);
 }
 // Deliberately clustered lane paving: broad worn centres, broken edges.
 for(let row=0;row<30;row++)for(let col=-2;col<=2;col++){
  const z=50+row*.84,x=col*.72+Math.sin(z*.23)*.5;
  if((row*13+col*7)%11===0)continue;
  add('cobble',(row+col)%3?0xb3aa8b:0x92937b,x,ground(x,z)+.018,z,.38,.035,.42,(row+col)*.43,0,true);
 }
 // The smith's working apron: closely fitted, worn flagstones around the anvil.
 for(let row=0;row<10;row++)for(let col=0;col<8;col++){
  const x=-9.2+col*.53+(row%2)*.23,z=56.7+row*.59;
  if((row===0||row===9)&&(col%3===0))continue;
  add('cobble',(row*3+col)%4?0x8e9287:0xaaa795,x,ground(x,z)+.018,z,.31,.035,.34,(row+col)*.15,0,true);
 }
 // Smith's approach remains navigable; small pavers follow the route to his feet.
 for(let i=0;i<9;i++){const x=-1-i*.66,z=59.5+Math.sin(i*.7)*.3;add('cobble',0x9a9881,x,ground(x,z)+.02,z,.45,.045,.38,i*.6,0,true)}
}
