const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');
await db.exec(`create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${uid(1)}'),('${uid(2)}');`);
await db.exec(fs.readFileSync('supabase/characters-foundation.sql','utf8'));const sql=fs.readFileSync('supabase/character-commands.sql','utf8');await db.exec(sql);await db.exec(sql);
async function as(i){await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(i)]);await db.exec('set role authenticated')}
async function rpc(fn,args){return(await db.query(`select to_jsonb(realm_character_${fn}(${args.map((_,i)=>'$'+(i+1)).join(',')})) r`,args)).rows[0].r}
await as(1);let c=await rpc('create',['Economy test',1]),seq=20;const session=uid(9);
const command=(action,id,request=uid(++seq),rev=c.revision,s=session)=>rpc('command',[c.id,rev,s,request,action,{id}]);
await assert.rejects(()=>command('buy','w1'),/lease/);await rpc('acquire',[c.id,c.revision,session]);
const request=uid(++seq);c=await command('buy','w1',request);assert.equal(c.progression.coins,15);assert.equal(c.progression.inventory.find(i=>i.id==='w1').qty,1);
const retry=await command('buy','w1',request,1);assert.equal(retry.revision,c.revision);assert.equal(retry.progression.coins,15);
await assert.rejects(()=>command('buy','potion',request),/reused/);await assert.rejects(()=>command('buy','w1'),/already owned/);await assert.rejects(()=>command('buy','w2'),/Insufficient/);await assert.rejects(()=>command('buy','w5'),/not for sale/);
c=await command('equip','w1');await assert.rejects(()=>command('sell','w1'),/equipped/);await assert.rejects(()=>command('buy','potion',uid(++seq),1),/Revision/);
c=await command('sell','w0');assert.equal(c.progression.coins,19);await assert.rejects(()=>command('sell','w0'),/not owned/);
await assert.rejects(()=>command('attribute','strength'),/points/);await assert.rejects(()=>command('skill','strikes'),/requirements/);await assert.rejects(()=>command('reward','w5'),/Unsupported/);await assert.rejects(()=>command('buy','potion',uid(++seq),c.revision,uid(8)),/lease/);
await as(2);await assert.rejects(()=>command('equip','w1'),/not found/);assert.equal((await db.query('select * from realm_character_commands')).rows.length,0);
await as(1);await assert.rejects(()=>db.query("update realm_item_catalog set buy=1"),/permission denied/);await assert.rejects(()=>db.query("delete from realm_character_commands"),/permission denied/);
// Trusted fixture setup represents future server-awarded experience/materials, not a public RPC.
await db.exec('reset role');await db.query(`update realm_characters set progression=progression||'{"level":8,"coins":1000,"hp":20}'::jsonb||jsonb_build_object('inventory',progression->'inventory'||'[{"id":"tooth","qty":20},{"id":"gem","qty":5}]'::jsonb) where id=$1`,[c.id]);await as(1);
c=await command('upgrade','w1');assert.equal(c.progression.weapon,'w1~1');assert.equal(c.progression.coins,965);assert.equal(c.progression.inventory.find(i=>i.id==='tooth').qty,18);assert(!c.progression.inventory.some(i=>i.id==='w1'));
c=await command('upgrade','w1~1');assert.equal(c.progression.weapon,'w1~2');assert.equal(c.progression.coins,890);assert.equal(c.progression.inventory.find(i=>i.id==='gem').qty,4);
c=await command('upgrade','w1~2');await assert.rejects(()=>command('upgrade','w1~3'),/cannot be upgraded/);
await assert.rejects(()=>command('skill','combos'),/requirements/);c=await command('skill','strikes');c=await command('skill','combos');await assert.rejects(()=>command('skill','combos'),/requirements/);assert.equal(c.progression.skillPoints,5);
c=await command('attribute','endurance');assert.equal(c.progression.attributePoints,20);assert.equal(c.progression.maxStamina,154);await assert.rejects(()=>command('attribute','xp'),/Unknown/);
c=await command('consume','potion');assert.equal(c.progression.hp,85);assert.equal(c.progression.inventory.find(i=>i.id==='potion').qty,4);
const gold=c.progression.coins;c=await command('respec',null);assert.equal(c.progression.coins,gold-130);assert.deepEqual(c.progression.skills,[]);await assert.rejects(()=>command('respec',null),/No skills/);
await db.exec('reset role');await db.query("update realm_character_leases set expires_at=clock_timestamp()-interval '1 second' where character_id=$1",[c.id]);await as(1);await assert.rejects(()=>command('buy','potion'),/lease/);
assert((await db.query('select * from realm_character_revisions')).rows.length>8);
console.log('PASS command reinstall, server prices/point budgets, atomic upgrade materials, equipment, potion, respec, retry idempotency, stale revisions, lease expiry, owner isolation and denied direct writes');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
