const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const{encodePacket,packetReader}=await import('data:text/javascript;base64,'+fs.readFileSync('network-packets.js').toString('base64'));
const p={type:'snapshot',seq:42,data:{estates:'🌲'.repeat(140000)}},frames=encodePacket(p),read=packetReader();assert(frames.length>5);assert(frames.every(p=>JSON.stringify(p).length<45000));let result;for(const f of [...frames].reverse())result=read(f)||result;assert.deepEqual(result,p);
assert.equal(read({type:'fragment',seq:1,index:0,total:99999,text:'bad'}),null);assert.equal(read({type:'fragment',seq:1,index:-1,total:2,text:'bad'}),null);assert.throws(()=>encodePacket({seq:1,data:'x'.repeat(1048577)}),/limit/);
const r=packetReader();assert.equal(r(frames[0]),null);assert.equal(r(frames[0]),null);for(const f of frames.slice(1))result=r(f)||result;assert.deepEqual(result,p);
console.log('PASS large world-state fragmentation, out-of-order reassembly, duplicates and bounded malformed packets');})();
