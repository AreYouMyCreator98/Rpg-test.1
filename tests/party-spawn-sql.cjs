const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');
await db.exec(`create schema auth;create schema realtime;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;create table realtime.messages(id bigint,topic text);alter table realtime.messages enable row level security;create function realtime.topic() returns text language sql stable as $$select current_setting('test.topic',true)$$;grant usage on schema auth,realtime to authenticated;insert into auth.users select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,8) i;`);
for(const name of ['multiplayer','characters-foundation','character-commands','character-runtime','persistent-rooms','prologue','party-spawn','party-spawn'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
async function as(i){await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(i)]);await db.exec('set role authenticated')}
async function rpc(fn,args=[]){return(await db.query(`select to_jsonb(public.realm_${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')})) r`,args)).rows[0].r}
const chars=[];for(let i=1;i<=4;i++){await as(i);chars.push(await rpc('character_create',['Adventurer '+i,1]));}
await as(1);const room=await rpc('create_room',['Host',false]);
for(let i=2;i<=4;i++){await as(i);await rpc('join_room',[room.code,'Ally '+i]);}
await db.exec('reset role');await db.query('update realm_rooms set persistent=true where id=$1',[room.id]);for(let i=1;i<=4;i++)await db.query('update realm_members set character_id=$1 where uid=$2',[chars[i-1].id,uid(i)]);
for(let i=1;i<=4;i++){await as(i);const result=await rpc('character_open',[chars[i-1].id,1,uid(100+i),room.id]);assert.deepEqual(result.position,{x:44+2*i,z:153.5});assert.deepEqual(result.character.progression,chars[i-1].progression);assert.deepEqual(result.character.solo_world,chars[i-1].solo_world);}
await db.exec('reset role');await db.query('update realm_character_contexts set x=12,z=70 where character_id=$1 and world_id=$2',[chars[0].id,room.id]);await as(1);assert.deepEqual((await rpc('character_open',[chars[0].id,1,uid(101),room.id])).position,{x:12,z:70});
await as(2);await rpc('leave_room');await as(5);const newcomer=await rpc('character_create',['New ally',1]);await rpc('character_open',[newcomer.id,1,uid(105),newcomer.id]);const joined=await rpc('join_character_room',[room.code,'New ally',newcomer.id,uid(105)]);assert.equal(joined.players.find(p=>p.id===uid(5)).slot,1);assert.equal(joined.players.find(p=>p.id===uid(4)).slot,3);
console.log('PASS four adjacent trusted spawns, unchanged progression/solo save, reconnect position and stable slot reuse');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
