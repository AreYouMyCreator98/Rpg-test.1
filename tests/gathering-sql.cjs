const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');
await db.exec(`create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${uid(1)}'),('${uid(2)}');create table realm_rooms(id uuid primary key,touched timestamptz,host uuid,persistent boolean);create table realm_members(uid uuid,room uuid,character_id uuid);`);
for(const name of ['characters-foundation','character-commands','character-runtime','prologue','homesteads','homesteads','world-gathering','world-gathering'])await db.exec(fs.readFileSync('supabase/'+name+'.sql','utf8'));
async function as(i){await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(i)]);await db.exec('set role authenticated')}
async function rpc(fn,args){return(await db.query(`select to_jsonb(${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')})) r`,args)).rows[0].r}
await as(1);const host=await rpc('realm_character_create',['Builder',1]);assert.equal(host.solo_world.position.z,151);await rpc('realm_character_open',[host.id,1,uid(9),host.id]);await as(2);const guest=await rpc('realm_character_create',['Guest',1]);await rpc('realm_character_open',[guest.id,1,uid(8),guest.id]);
const room=uid(77);await db.exec('reset role');await db.query("insert into realm_rooms values($1,clock_timestamp(),$2,true)",[room,uid(1)]);await db.query('insert into realm_members values($1,$2,$3),($4,$2,$5)',[uid(1),room,host.id,uid(2),guest.id]);// Context positions are fixtures; production updates come from validated movement.
await db.query('update realm_character_contexts set x=-38,z=118 where character_id=$1',[host.id]);
await as(1);let s=await rpc('realm_estate_read',[host.id,host.id,uid(9),'home']);assert.equal(s.wood,80);

let seq=1000;const session=uid(9);
async function at(x,z){await db.exec('reset role');await db.query('update realm_character_contexts set x=$1,z=$2 where character_id=$3',[x,z,host.id]);await as(1)}
async function command(op,request=uid(++seq),version=s.version){const result=await rpc('realm_estate_change',[host.id,host.id,session,'home',version,request,op]);s=result;return result}
await at(-7,58);await command({action:'shelter_accept'});await assert.rejects(()=>command({action:'shelter_claim'}),/incomplete/);await assert.rejects(()=>command({action:'craft',recipe:'axe'}),/closer/);
await at(-23,133);const request=uid(++seq);await command({action:'craft',recipe:'axe'},request);await command({action:'craft',recipe:'axe'},request,0);assert.equal(s.wood,76);await assert.rejects(()=>command({action:'craft',recipe:'axe'}),/already owned/);await command({action:'craft',recipe:'pickaxe'});
for(const node of [0,4,6]){await at(-50,node===0?140:98);if(node===6)await at(-34,98);for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,850));await command({action:'gather',node});if(i===0)await assert.rejects(()=>command({action:'gather',node}),/cooldown/)}await new Promise(r=>setTimeout(r,850));await assert.rejects(()=>command({action:'gather',node}),/regrowing/)}
assert.equal(s.workshop.packs[host.id].bag.logs,6);assert.equal(s.workshop.packs[host.id].bag.rubble,6);assert.equal(s.workshop.packs[host.id].bag.ore,4);
await at(-23,129);await command({action:'transfer',direction:'deposit',resource:'all'});assert.equal(s.workshop.stock.logs,6);assert.equal(s.workshop.packs[host.id].bag.logs,0);
await assert.rejects(()=>command({action:'transfer',direction:'withdraw',resource:'wood',qty:-1}),/quantity/);await assert.rejects(()=>command({action:'transfer',direction:'withdraw',resource:'logs',qty:7}),/Insufficient/);
await at(-23,133);for(const recipe of ['timber','blocks','nails','ironaxe'])await command({action:'craft',recipe});assert.equal(s.workshop.packs[host.id].tools.axe,2);
await at(-42,140);for(let i=0;i<2;i++){await new Promise(r=>setTimeout(r,850));await command({action:'gather',node:1})}assert(s.workshop.nodes['1'].readyAt>Date.now());assert.equal(s.workshop.packs[host.id].bag.logs,6);
await at(-38,118);for(const[type,rotation]of [['foundation',0],['wall',0],['wall',1],['window',2],['door',3],['roof',0]]){const id=uid(++seq);await command({action:'place',piece:{id,type,x:0,z:0,rotation,level:0}},id)}
await at(-23,133);const before=s.wood;await command({action:'shelter_claim'});assert.equal(s.wood,before+80);await assert.rejects(()=>command({action:'shelter_claim'}),/already claimed/);
await assert.rejects(()=>rpc('realm_workshop_apply',[s,{action:'craft',recipe:'axe'},host.id,-23,133,'home',Date.now()]),/permission/);
const wild=(await db.query('select * from public.realm_world_resources where id=8').catch(()=>({rows:[]}))).rows;assert.equal(wild.length,0,'clients cannot read or modify authoritative catalog directly');
await db.exec('reset role');const resources=(await db.query(`select * from public.realm_world_resources where id=8 or id=(select min(id) from public.realm_world_resources where resource='rubble')`)).rows;await as(1);
for(const n of resources){await at(n.x+10,n.z);await assert.rejects(()=>command({action:'gather',node:n.id,x:n.x,z:n.z}),/closer/);await at(n.x,n.z);for(let i=0;i<(n.resource==='logs'?2:3);i++){await new Promise(r=>setTimeout(r,850));await command({action:'gather',node:n.id})}const wait=s.workshop.nodes[n.id].readyAt-Date.now();assert(wait>4310000&&wait<=4320000);await new Promise(r=>setTimeout(r,850));await assert.rejects(()=>command({action:'gather',node:n.id}),/regrowing/)}
await assert.rejects(()=>command({action:'gather',node:999999}),/Unknown/);
await as(2);await assert.rejects(()=>rpc('realm_estate_change',[host.id,host.id,uid(8),'home',s.version,uid(++seq),{action:'transfer',direction:'withdraw',resource:'wood',qty:1}]),/not found/);
console.log('PASS trusted gathering/cooldown/depletion, exact recipes, duplicate-request replay, positive transfer quantities, atomic insufficient-stock rejection, iron upgrade, complete shelter reward once, owner isolation and helper denial');
}finally{await db.close()}})().catch(e=>{console.error(e.message);process.exitCode=1});
