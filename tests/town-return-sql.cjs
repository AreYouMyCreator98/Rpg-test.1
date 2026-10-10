const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');await db.exec(`create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${uid(1)}'),('${uid(2)}');create table realm_rooms(id uuid primary key,touched timestamptz);create table realm_members(uid uuid,room uuid);`);
for(const name of ['characters-foundation','character-commands','character-runtime','prologue','character-runtime'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
const catalog=JSON.parse(fs.readFileSync('supabase/game-catalog.json'));await db.query('insert into realm_game_catalog values(true,$1)',[catalog]);
async function as(i){await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(i)]);await db.exec('set role authenticated')}
async function rpc(fn,args){return(await db.query(`select to_jsonb(realm_character_${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')})) r`,args)).rows[0].r}
await as(1);let c=await rpc('create',['Homeward',1]);const session=uid(9);await rpc('open',[c.id,c.revision,session,c.id]);let seq=500;let world=c.id;const stamp=Date.now()-60000;
async function at(x,z,swing=false){await db.exec('reset role');await db.query('update realm_character_contexts set x=$1,z=$2,event_at=to_timestamp($3::numeric/1000),swing_at=case when $4 then clock_timestamp() else null end where character_id=$5 and world_id=$6',[x,z,stamp,swing,c.id,world]);await as(1)}
const call=(x,z,request=uid(++seq),revision=c.revision)=>rpc('event',[c.id,revision,session,world,request,'return_town',{time:stamp+1000,x,z}]);
await at(-60,130);await assert.rejects(()=>call(-60,130),/Visit/);
await at(0,64);await at(-60,130);const original=c.progression,request=uid(++seq);c=await call(-60,130,request);assert.deepEqual(c.solo_world.position,{x:0,z:64});assert.equal(c.progression.coins,original.coins);assert.equal(c.progression.hp,original.hp);assert.equal(c.progression.xp,original.xp);assert.deepEqual(c.progression.inventory,original.inventory);
const revision=c.revision;c=await call(-60,130,request,1);assert.equal(c.revision,revision);
await at(300,5);await assert.rejects(()=>call(300,5),/dungeon/);
await at(-60,130,true);await assert.rejects(()=>call(-60,130),/combat/);
const foe=catalog.enemies[0];await at(foe.x,foe.z);await assert.rejects(()=>call(foe.x,foe.z),/nearby enemies/);
await at(-60,130);await assert.rejects(()=>call(100,-100),/Travel/);
await as(2);await assert.rejects(()=>call(-60,130),/not found/);await as(1);
// One-time migration preserves old saved visits; later checkpoint flags cannot unlock travel.
await db.exec('reset role');await db.query("delete from realm_character_discoveries where character_id=$1 and place='town'",[c.id]);await db.query("update realm_characters set solo_world=jsonb_set(solo_world,'{visited}','[0]') where id=$1",[c.id]);await db.exec(fs.readFileSync('supabase/character-runtime.sql','utf8'));await as(1);await assert.rejects(()=>call(-60,130),/Visit/);
await db.exec('reset role');await db.exec("delete from realm_runtime_migrations where id='town-return-v1'");await db.exec(fs.readFileSync('supabase/character-runtime.sql','utf8'));await as(1);c=await call(-60,130);assert.equal(c.solo_world.position.z,64);
// A co-op return changes only this character's current world context.
world=uid(99);await db.exec('reset role');await db.query("update realm_characters set solo_world=jsonb_set(solo_world,'{position}','{\"x\":-60,\"z\":130}') where id=$1",[c.id]);await db.query("insert into realm_character_contexts(character_id,world_id,x,z,room_grace_until) values($1,$2,0,64,clock_timestamp()+interval '90 seconds')",[c.id,world]);await at(-60,130);c=await call(-60,130);assert.deepEqual(c.solo_world.position,{x:-60,z:130});await db.exec('reset role');const row=(await db.query('select x,z from realm_character_contexts where character_id=$1 and world_id=$2',[c.id,world])).rows[0];assert.deepEqual(row,{x:0,z:64});
console.log('PASS town discovery lock, historic visit migration, fixed arrival, no healing/currency/gear changes, idempotent retry, dungeon/combat/enemy denial, owner isolation and separate co-op/solo positions');
}finally{await db.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
