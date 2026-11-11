const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {actors,frameCount}=require('../assets/v2/manifest.json');
let count=0;
for(const [actor,anims] of Object.entries(actors)){
 for(const anim of anims)for(let f=0;f<frameCount;f++){
   const file=path.join(__dirname,'../assets/v4/actors',actor,anim,'f'+f+'.svg');
   assert(fs.existsSync(file),'Missing: '+file);
   const xml=fs.readFileSync(file,'utf8');
   assert(xml.startsWith('<svg')&&xml.endsWith('</svg>'),'Bad SVG: '+file);
   assert(xml.includes('width="192" height="192" viewBox="-32 0 192 192"'),'Actor must have padded centered viewBox: '+file);
   assert(/<g transform="translate\(0 [^)]+\) scale\([^)]+\)">/.test(xml),'Expected centered body coordinates: '+file);
   assert(!xml.includes('<g transform="translate(64 '),'Half-character clipping regression: '+file);
   count++;
 }
}
assert.equal(count,234);
console.log('Verified',count,'single-frame characters with correctly centered art in widened viewports.');
