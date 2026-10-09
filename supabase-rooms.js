// Supabase handles authenticated membership and transport. Game authority stays
// with the host. Private per-sender topics prevent guests spoofing host packets.
export async function connectSupabase(url,key,receive) {
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
  const db=createClient(url,key,{auth:{storage:sessionStorage,storageKey:'realm-coop-auth-'+new URL(url).hostname,persistSession:true,autoRefreshToken:true,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:40}}});
  try {
  let {data:{session},error}=await db.auth.getSession();if(error)throw error;
  if(!session){const result=await db.auth.signInAnonymously();if(result.error)throw result.error;session=result.data.session}
  await db.realtime.setAuth(session.access_token);
  const id=session.user.id,channels=new Map();let room=null,interval=null,closed=false,polling=false,joining=false,lastState=Date.now();
  async function rpc(name,args){const {data,error}=await db.rpc('realm_'+name,args);if(error)throw error;return data}
  function errorMessage(e){receive({type:'error',message:e?.message||'Supabase connection failed.'})}
  async function subscribe(uid){
    if(channels.has(uid))return;
    const channel=db.channel('realm:'+room.id+':'+uid,{config:{private:true,broadcast:{self:false,ack:false}}});channels.set(uid,channel);
    channel.on('broadcast',{event:'game'},({payload})=>{
      if(!room||!payload||typeof payload!=='object'||JSON.stringify(payload).length>196608)return;
      if(payload.type==='pose')receive({type:'pose',id:uid,data:payload.data});
      if(payload.type==='command'&&room.host===id)receive({type:'command',id:uid,data:payload.data});
      if(uid===room.host&&payload.type==='snapshot')receive(payload);
      if(uid===room.host&&payload.type==='event'&&(!payload.to||payload.to===id))receive(payload);
    });
    await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Room connection timed out. Check Realtime private-channel policies.')),15000);channel.subscribe(status=>{if(status==='SUBSCRIBED'){clearTimeout(timeout);resolve()}else if(status==='CHANNEL_ERROR'||status==='TIMED_OUT'){clearTimeout(timeout);reject(new Error('Room channel failed. Check Supabase configuration.'))}})});
  }
  async function refresh(){
    if(!room||closed||polling)return;polling=true;
    try{
      const next=await rpc('room_state');lastState=Date.now();
      if(!next){await leave(false);receive({type:'ended',reason:'The host disconnected or the room expired. Your solo save is unchanged.'});return}
      const previous=new Set(room.players.map(p=>p.id));room=next;
      for(const p of room.players)await subscribe(p.id);
      for(const uid of previous)if(!room.players.some(p=>p.id===uid)){const ch=channels.get(uid);if(ch)await db.removeChannel(ch);channels.delete(uid);receive({type:'left',id:uid})}
      receive({type:'roster',players:room.players,host:room.host});
    }catch(e){if(Date.now()-lastState>20000){await leave(false);receive({type:'ended',reason:'Connection lost. Your solo save is unchanged.'})}else errorMessage(e)}finally{polling=false}
  }
  async function leave(notify=true){clearInterval(interval);interval=null;room=null;await db.removeAllChannels();channels.clear();if(notify)await rpc('leave_room')}
  async function send(m){
    if((m.type==='create'||m.type==='join')&&joining){errorMessage(new Error('Already joining a room. Please wait.'));return}
    try{
      if(m.type==='list'){receive({type:'rooms',rooms:await rpc('list_rooms')});return}
      if(m.type==='create'||m.type==='join'){
        if(room)throw new Error('Leave your current room first.');
        joining=true;
        await rpc('leave_room');
        room=await rpc(m.type==='create'?'create_room':'join_room',m.type==='create'?{player_name:m.name,is_public:m.public}:{player_name:m.name,invite_code:m.code});
        try{for(const p of room.players)await subscribe(p.id)}catch(e){await leave();throw e}
        lastState=Date.now();interval=setInterval(refresh,3000);
        receive({type:'joined',id,host:room.host,code:room.code,public:room.public});receive({type:'roster',players:room.players,host:room.host});return;
      }
      if(m.type==='leave'){await leave();return}
      const ch=channels.get(id);if(ch)await ch.send({type:'broadcast',event:'game',payload:m});
    }catch(e){errorMessage(e)}finally{if(m.type==='create'||m.type==='join')joining=false}
  }
  // Reloading the host tab ends its previous ephemeral room cleanly.
  await rpc('leave_room');
  receive({type:'hello',id,protocol:1});
  return {send,async close(){closed=true;try{await leave()}catch{}await db.auth.stopAutoRefresh();db.realtime.disconnect()}};
  } catch(error) {await db.removeAllChannels();await db.auth.stopAutoRefresh();db.realtime.disconnect();throw error}
}
