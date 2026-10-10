const {PGlite}=require(process.env.PGLITE_PATH||'@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
const uid=i=>'00000000-0000-0000-0000-'+String(i).padStart(12,'0');await db.exec(`create schema auth;create role anon;create role authenticated;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;grant usage on schema auth to authenticated;insert into auth.users values('${uid(1)}'),('${uid(2)}');create table realm_rooms(id uuid primary key,touched timestamptz);create table realm_members(uid uuid,room uuid);`);
for(const f of ['characters-foundation','character-commands','character-runtime'])await db.exec(fs.readFileSync('supabase/'+f+'.sql','utf8'));
await db.query('insert into realm_game_catalog values(true,$1)',[JSON.parse(fs.readFileSync('supabase/game-catalog.json'))]);
for(let i=0;i<2;i++)await db.exec(fs.readFileSync('supabase/settlement-trade.sql','utf8'));
const shops=JSON.parse(fs.readFileSync('supabase/settlement-trade.json'));
for(const s of shops){const [x,z]=s.points[0];assert.equal((await db.query('select realm_regional_vendor_allowed($1,$2,$3,$4) ok',[s.id,s.role,x,z])).rows[0].ok,true);assert.equal((await db.query('select realm_regional_vendor_allowed($1,$2,0,0) ok',[s.id,s.role])).rows[0].ok,false)}
const as=async id=>{await db.exec('reset role');await db.query("select set_config('test.uid',$1,false)",[uid(id)]);await db.exec('set role authenticated')};await as(1);
assert.equal((await db.query('select realm_settlement_trade_ready() v')).rows[0].v,1);
await assert.rejects(()=>db.query("select realm_regional_vendor_allowed('capital-smith','smith',-187,35)"),/permission/);
let c=(await db.query("select to_jsonb(realm_character_create('Trade test',1)) c")).rows[0].c;const session=uid(8);await db.query('select realm_character_open($1,$2,$3,$1)',[c.id,c.revision,session]);let seq=30;const now=Date.now()-1000;
async function fixture(x,z){await db.exec('reset role');await db.query('update realm_character_contexts set x=$1,z=$2,event_at=to_timestamp($3::numeric/1000) where character_id=$4',[x,z,now,c.id]);await db.query("update realm_characters set progression=jsonb_set(progression,'{coins}','1000') where id=$1",[c.id]);await as(1)}
async function event(action,body,request=uid(++seq)){return(await db.query('select to_jsonb(realm_character_event($1,$2,$3,$1,$4,$5,$6)) c',[c.id,c.revision,session,request,action,{time:now,...body}])).rows[0].c}
const m=shops.find(s=>s.id==='capital-merchant'),[x,z]=m.points[0];await fixture(x,z);const body={x,z,vendor:m.id,id:'potion'},request=uid(++seq);c=await event('buy',body,request);assert.equal(c.progression.coins,988);const rev=c.revision;c=await event('buy',body,request);assert.equal(c.revision,rev);assert.equal(c.progression.coins,988);
await assert.rejects(()=>event('buy',{...body,vendor:'invented'}),/regional shop/);await assert.rejects(()=>event('buy',{...body,id:'w1'}),/regional shop/);
const s=shops.find(s=>s.id==='capital-smith');await fixture(...s.points[0]);c=await event('buy',{x:s.points[0][0],z:s.points[0][1],vendor:s.id,id:'w1'});assert.equal(c.progression.coins,970);await assert.rejects(()=>event('buy',{x:s.points[0][0],z:s.points[0][1],vendor:s.id,id:'w1'}));
await fixture(0,64);await assert.rejects(()=>event('buy',{x:0,z:64,vendor:m.id,id:'potion'}),/regional shop/);
await as(2);await assert.rejects(()=>event('buy',body),/Character not found/);
console.log('PASS real PostgreSQL migration twice, all 19 vendor zones, guarded capability, private helper, correct prices, replay idempotency, wrong vendor/role/location and owner rejection');
}finally{await db.close()}})().catch(e=>{console.error(e);process.exitCode=1});
