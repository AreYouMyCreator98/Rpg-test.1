// Real PostgreSQL semantics via optional PGlite; no external Supabase credentials.
const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
 await db.exec(`create schema auth;create schema realtime;create role anon;create role authenticated;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create table realtime.messages(id bigint,topic text);alter table realtime.messages enable row level security;
 create function realtime.topic() returns text language sql stable as $$select current_setting('test.topic',true)$$;
 grant usage on schema auth,realtime to authenticated;grant select,insert on realtime.messages to authenticated;
 insert into auth.users select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid from generate_series(1,8) i;`);
 await db.exec(fs.readFileSync('supabase/multiplayer.sql','utf8'));
 await db.exec(fs.readFileSync('supabase/multiplayer.sql','utf8')); // rerunnable installation
 const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');
 async function as(i,sql,args=[]){await db.query("select set_config('test.uid',$1,false)",[uid(i)]);return (await db.query(sql,args)).rows[0]?.result}
 const call=(i,fn,args=[])=>as(i,`select public.realm_${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args);
 const privateRoom=await call(1,'create_room',['Host',false]);assert.equal(privateRoom.players.length,1);assert.equal(privateRoom.code.length,16);
 assert.deepEqual(await call(2,'list_rooms'),[]);
 await assert.rejects(()=>call(2,'join_room',['wrong','Guest']),/not found/);
 for(let i=2;i<=4;i++)await call(i,'join_room',[privateRoom.code,'Guest '+i]);
 await assert.rejects(()=>call(5,'join_room',[privateRoom.code,'Fifth']),/full/);
 await assert.rejects(()=>call(2,'create_room',['Duplicate',true]),/Leave/);
 const hostTopic='realm:'+privateRoom.id+':'+uid(1),guestTopic='realm:'+privateRoom.id+':'+uid(2);
 assert.equal(await call(2,'topic_allowed',[hostTopic,true]),false);assert.equal(await call(2,'topic_allowed',[hostTopic,false]),true);
 assert.equal(await call(2,'topic_allowed',[guestTopic,true]),true);assert.equal(await call(5,'topic_allowed',[hostTopic,false]),false);
 // Test the policy itself under a non-owner role, not only the helper.
 await db.query("select set_config('test.topic',$1,false)",[hostTopic]);await as(2,'select 1');await db.exec('set role authenticated');
 await assert.rejects(()=>db.exec("insert into realtime.messages values(1,'forged')"),/row-level security/);await db.exec('reset role');
 await call(2,'leave_room');assert.equal((await call(1,'room_state')).players.length,3);
 await call(1,'leave_room');assert.equal(await call(3,'room_state'),null);
 const publicRoom=await call(5,'create_room',['Explorer',true]);assert.equal((await call(6,'list_rooms'))[0].code,publicRoom.code);
 await db.exec("update public.realm_rooms set touched=now()-interval '46 seconds'");assert.deepEqual(await call(6,'list_rooms'),[]);assert.equal(await call(5,'room_state'),null);
 console.log('PASS SQL install/reinstall, private discovery, invite validation, four-player capacity, duplicate membership, sender authorization, RLS spoof rejection, leave/host end, public listing and expiry');
 }finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
