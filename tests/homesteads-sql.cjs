const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');
await db.exec(`create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${uid(1)}'),('${uid(2)}');create table realm_rooms(id uuid primary key,touched timestamptz,host uuid,persistent boolean);create table realm_members(uid uuid,room uuid,character_id uuid);`);
for(const name of ['characters-foundation','character-commands','character-runtime','prologue','homesteads','homesteads'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
async function as(i){await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(i)]);await db.exec('set role authenticated')}
async function rpc(fn,args){return(await db.query(`select to_jsonb(${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')})) r`,args)).rows[0].r}
await as(1);const host=await rpc('realm_character_create',['Builder',1]);assert.equal(host.solo_world.position.z,151);await rpc('realm_character_open',[host.id,1,uid(9),host.id]);await as(2);const guest=await rpc('realm_character_create',['Guest',1]);await rpc('realm_character_open',[guest.id,1,uid(8),guest.id]);
const room=uid(77);await db.exec('reset role');await db.query("insert into realm_rooms values($1,clock_timestamp(),$2,true)",[room,uid(1)]);await db.query('insert into realm_members values($1,$2,$3),($4,$2,$5)',[uid(1),room,host.id,uid(2),guest.id]);// Context positions are fixtures; production updates come from validated movement.
await db.query('update realm_character_contexts set x=-38,z=118 where character_id=$1',[host.id]);
await as(1);let s=await rpc('realm_estate_read',[host.id,host.id,uid(9),'home']);assert.equal(s.wood,80);
let seq=100;const piece=(type,x=0,z=0,rotation=0,level=0)=>({id:uid(++seq),type,x,z,rotation,level});
const put=async(p,version=s.version)=>{const r=await rpc('realm_estate_change',[host.id,host.id,uid(9),'home',version,p.id,{action:'place',piece:p}]);s=r;return r};
const f=piece('foundation');await put(f);assert.equal(s.wood,68);await put(f,0);assert.equal(s.wood,68);await assert.rejects(()=>put(piece('foundation',1),0),/Base changed/);
await assert.rejects(()=>put(piece('wall',2)),/Foundation required/);await assert.rejects(()=>put(piece('foundation',9)),/Invalid building/);
const wall=piece('wall');await put(wall);await assert.rejects(()=>put(piece('window')),/edge occupied/);
const door=piece('door',0,0,2);await put(door);s=await rpc('realm_estate_change',[host.id,host.id,uid(9),'home',s.version,uid(++seq),{action:'door',id:door.id}]);assert(s.pieces.find(p=>p.id===door.id).open);
await assert.rejects(()=>rpc('realm_estate_change',[host.id,host.id,uid(9),'home',s.version,uid(++seq),{action:'remove',id:f.id}]),/supported/);
await put(piece('foundation',0,1));await put(piece('stairs',0,1));await assert.rejects(()=>put(piece('floor',0,1,0,1)),/stairwell/);await put(piece('floor',0,0,0,1));await assert.rejects(()=>put(piece('roof')),/upper-storey/);
await assert.rejects(()=>db.query('select * from realm_estates'),/permission denied/);
await as(2);await assert.rejects(()=>rpc('realm_estate_read',[host.id,host.id,uid(8),'home']),/Character not found/);
const visit=await rpc('realm_estate_read',[guest.id,room,uid(8),'home']);assert.equal(visit.canEdit,false);await assert.rejects(()=>rpc('realm_estate_change',[guest.id,room,uid(8),'home',visit.version,uid(++seq),{action:'harvest'}]),/Only the owner/);
await db.exec('reset role');await db.query('update realm_character_contexts set world_id=$1,x=-74,z=118 where character_id=$2',[room,guest.id]);await as(2);
const shared=await rpc('realm_estate_read',[guest.id,room,uid(8),'coop']);assert(shared.canEdit);const cf=piece('foundation');const built=await rpc('realm_estate_change',[guest.id,room,uid(8),'coop',0,cf.id,{action:'place',piece:cf}]);assert.equal(built.pieces.length,1);
await assert.rejects(()=>rpc('realm_estate_change',[guest.id,room,uid(8),'coop',1,uid(++seq),{action:'harvest'}]),/Visit the supply/);
await db.exec('reset role');await db.query('update realm_character_contexts set x=-59,z=133 where character_id=$1',[guest.id]);await as(2);
const gathered=await rpc('realm_estate_change',[guest.id,room,uid(8),'coop',1,uid(++seq),{action:'harvest'}]);assert.equal(gathered.wood,92);await assert.rejects(()=>rpc('realm_estate_change',[guest.id,room,uid(8),'coop',2,uid(++seq),{action:'harvest'}]),/replenishing/);
await as(1);assert.equal((await rpc('realm_estate_read',[host.id,host.id,uid(9),'coop'])).pieces.length,1);
console.log('PASS SQL reinstall, new-character graveyard default, home privacy, shared guest edits, independent supplies, duplicate request idempotency, stale versions, support/edge validation, supply proximity/cooldown, RLS and persistent host ownership');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
