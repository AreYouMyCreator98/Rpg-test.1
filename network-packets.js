// Bounded frames keep large housing/resource state below Realtime message limits.
const FRAME=40000,MAX=1048576;
export function encodePacket(packet){
 const text=JSON.stringify(packet);if(text.length>MAX)throw Error('Party state exceeds the network limit.');
 if(text.length<=FRAME)return [packet];
 const total=Math.ceil(text.length/FRAME);return Array.from({length:total},(_,index)=>({type:'fragment',seq:packet.seq,index,total,text:text.slice(index*FRAME,(index+1)*FRAME)}));
}
export function packetReader(){
 const pending=new Map();
 return packet=>{
  if(!packet||typeof packet!=='object')return null;
  if(packet.type!=='fragment')return JSON.stringify(packet).length<=FRAME?packet:null;
  const {seq,index,total,text}=packet,now=Date.now();
  for(const [id,p] of pending)if(now-p.time>10000)pending.delete(id);
  if(!Number.isSafeInteger(seq)||!Number.isInteger(total)||total<2||total>Math.ceil(MAX/FRAME)||!Number.isInteger(index)||index<0||index>=total||typeof text!=='string'||text.length>FRAME)return null;
  let p=pending.get(seq);if(!p){if(pending.size>=4)pending.delete(pending.keys().next().value);p={time:now,total,parts:new Map()};pending.set(seq,p)}
  if(p.total!==total)return null;p.parts.set(index,text);if(p.parts.size!==total)return null;
  pending.delete(seq);const joined=Array.from({length:total},(_,i)=>p.parts.get(i)).join('');if(joined.length>MAX)return null;
  try{const result=JSON.parse(joined);return result.seq===seq&&result.type!=='fragment'?result:null}catch{return null}
 };
}
