const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {actors,frameCount,scenes}=require('../assets/v2/manifest.json');
const root=path.resolve(__dirname,'../assets/v3/actors');
let count=0;
for(const [actor,anims] of Object.entries(actors))for(const anim of anims)for(let i=0;i<frameCount;i++){
 const file=path.join(root,actor,anim,'f'+i+'.svg');
 assert(fs.existsSync(file),'missing frame '+file);
 const str=fs.readFileSync(file,'utf8');
 assert(str.startsWith('<svg')&&str.endsWith('</svg>'),'malformed '+file);
 assert(str.includes('viewBox="0 0 128 192"'),'wrong frame viewport '+file);
 assert(!str.includes('viewBox="0 0 768 192"'),'unsplit atlas remains '+file);
 count++;
}
console.log('Verified',count,'standalone character frames and',scenes.length,'battlefields.');
