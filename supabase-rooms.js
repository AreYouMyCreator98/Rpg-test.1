// Supabase handles authenticated membership and transport. Game authority stays
// with the host. Private per-sender topics prevent guests spoofing host packets.
export async function connectSupabase(url,key,receive,account=null) {
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/+esm');
  const db=account?.db||createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false},realtime:{params:{eventsPerSecond:40}}});
  try {
  let {data:{session},error}=await db.auth.getSession();if(error)throw error;
  if(!session){const result=await db.auth.signInAnonymously();if(result.error)throw result.error;session=result.data.session}
  await db.realtime.setAuth(session.access_token);
  const id=session.user.id,channels=new Map();let room=null,interval=null,closed=false,polling=false,joining=false,generation=0,lastState=Date.now();
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
    if(!room||closed||polling)return;polling=true;const ticket=generation;
    try{
      const next=await rpc('room_state');if(ticket!==generation||!room)return;lastState=Date.now();
      if(!next){await leave(false);receive({type:'ended',reason:'The host disconnected or the room expired. Your solo save is unchanged.'});return}
      const previous=new Set(room.players.map(p=>p.id));room=next;
      for(const p of room.players){await subscribe(p.id);if(ticket!==generation||!room)return}
      for(const uid of previous)if(!room.players.some(p=>p.id===uid)){const ch=channels.get(uid);if(ch)await db.removeChannel(ch);channels.delete(uid);receive({type:'left',id:uid})}
      receive({type:'roster',players:room.players,host:room.host});
    }catch(e){if(ticket!==generation)return;if(Date.now()-lastState>20000){await leave(false);receive({type:'ended',reason:'Connection lost. Your solo save is unchanged.'})}else errorMessage(e)}finally{polling=false}
  }
  async function leave(notify=true){generation++;clearInterval(interval);interval=null;room=null;await db.removeAllChannels();channels.clear();if(notify)await rpc('leave_room')}
  async function send(m){
    if((m.type==='create'||m.type==='join')&&joining){errorMessage(new Error('Already joining a room. Please wait.'));return}
    try{
      if(m.type==='list'){receive({type:'rooms',rooms:await rpc('list_rooms')});return}
      if(m.type==='create'||m.type==='join'){
        if(room)throw new Error('Leave your current room first.');
        joining=true;
        await rpc('leave_room');
        room=await rpc(account?(m.type==='create'?'create_character_room':'join_character_room'):(m.type==='create'?'create_room':'join_room'),{...(m.type==='create'?{player_name:m.name,is_public:m.public}:{player_name:m.name,invite_code:m.code}),...(account?{character_id:account.selected.id,session_id:account.sessionId}:{})});
        try{for(const p of room.players)await subscribe(p.id)}catch(e){await leave();throw e}
        lastState=Date.now();interval=setInterval(refresh,3000);
        receive({type:'joined',worldId:room.id,persistent:room.persistent,id,host:room.host,code:room.code,public:room.public});receive({type:'roster',players:room.players,host:room.host});return;
      }
      if(m.type==='leave'){await leave();return}
      const ch=channels.get(id);if(ch)await ch.send({type:'broadcast',event:'game',payload:m});
    }catch(e){errorMessage(e)}finally{if(m.type==='create'||m.type==='join')joining=false}
  }
  // Each tab has an in-memory identity. Persistent Supabase auth broadcasts
  // sign-in changes across tabs, which would replace another tab's room identity.
  await rpc('leave_room');
  receive({type:'hello',id,protocol:1});
  return {send,async close(){closed=true;try{await leave()}catch{}if(!account){await db.auth.stopAutoRefresh();db.realtime.disconnect()}}};
  } catch(error) {await db.removeAllChannels();if(!account){await db.auth.stopAutoRefresh();db.realtime.disconnect()};throw error}
}
