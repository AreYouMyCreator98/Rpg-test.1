/* Ensures the complete V2 vector art pack exists and every atlas contains six frames. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {scenes,actors,frameCount}=require('../assets/v2/manifest.json');
const path=require('node:path'),root=path.resolve(__dirname,'../assets/v2');
let sheets=0;
for(const [name,states] of Object.entries(actors)){
  for(const state of states){
    const file=path.join(root,'actors',name,state+'.svg');
    assert(fs.existsSync(file),'Missing art animation '+name+'/'+state);
    const xml=fs.readFileSync(file,'utf8');
    assert(xml.startsWith('<svg')&&xml.endsWith('</svg>'),'Invalid SVG structure '+file);
    assert(xml.includes('viewBox="0 0 768 192"'),'Bad atlas dimensions '+file);
    assert.equal((xml.match(/<g transform="translate\((?:0|128|256|384|512|640) 0\)">/g)||[]).length,frameCount,'Wrong number of animation frames '+file);
    sheets++;
  }
}
for(const stage of scenes)for(const layer of ['sky','ruins','foreground']){
 const file=path.join(root,'scenes',stage+'-'+layer+'.svg');
 assert(fs.existsSync(file),'Missing scenery '+stage+' '+layer);
 assert(fs.readFileSync(file,'utf8').startsWith('<svg'),'Invalid scene SVG '+file);
}
console.log('V2 original asset pack:',sheets,'animation atlases,',sheets*frameCount,'frames,',scenes.length*3,'scene layers');
