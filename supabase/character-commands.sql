-- Stage 3: server-owned character economy and allocation commands.
-- Apply after characters-foundation.sql. Not yet wired to the released game.
-- No arbitrary progression snapshots, XP grants, drops or kill claims are accepted.
begin;
create table if not exists public.realm_item_catalog (
 id text primary key, kind text not null check(kind in ('weapon','armour','consumable','material','quest')),
 base text not null, rank integer not null default 0 check(rank between 0 and 3),
 buy integer check(buy>0), sell integer not null check(sell>=0)
);
insert into public.realm_item_catalog(id,kind,base,buy,sell) values
 ('w0','weapon','w0',null,4),('w1','weapon','w1',30,12),('w2','weapon','w2',85,34),('w3','weapon','w3',170,68),('w4','weapon','w4',290,116),('w5','weapon','w5',null,4),
 ('a0','armour','a0',null,4),('a1','armour','a1',25,10),('a2','armour','a2',70,28),('a3','armour','a3',140,56),('a4','armour','a4',250,100),('a5','armour','a5',null,4),
 ('potion','consumable','potion',12,4),('tooth','material','tooth',null,4),('gem','material','gem',null,32),
 ('caveblade','weapon','caveblade',null,4),('frontier_wolf','weapon','frontier_wolf',null,4),('frontier_skeleton','weapon','frontier_skeleton',null,4),('frontier_bandit','weapon','frontier_bandit',null,4),('frontier_spider','weapon','frontier_spider',null,4),('frontier_elemental','weapon','frontier_elemental',null,4),
 ('trophy_wolf','material','trophy_wolf',null,4),('trophy_skeleton','material','trophy_skeleton',null,4),('trophy_bandit','material','trophy_bandit',null,4),('trophy_spider','material','trophy_spider',null,4),('trophy_elemental','material','trophy_elemental',null,4)
on conflict(id) do update set kind=excluded.kind,base=excluded.base,buy=excluded.buy,sell=excluded.sell;
insert into public.realm_item_catalog(id,kind,base,rank,sell)
 select c.id||'~'||r,'weapon',c.id,r,c.sell+r*10 from public.realm_item_catalog c cross join generate_series(1,3) r where c.kind='weapon' and c.rank=0
 on conflict(id) do update set sell=excluded.sell;
create table if not exists public.realm_skill_catalog (id text primary key, prerequisite text references public.realm_skill_catalog(id));
insert into public.realm_skill_catalog values
 ('strikes',null),('combos','strikes'),('precision','combos'),('breaker','precision'),('whirlwind','breaker'),('blade','whirlwind'),
 ('skin',null),('vitality','skin'),('stamina','vitality'),('shield','stamina'),('recovery','shield'),('unbreakable','recovery'),
 ('swift',null),('dodge','swift'),('instinct','dodge'),('sprint','instinct'),('reflex','sprint'),('shadow','reflex') on conflict(id) do update set prerequisite=excluded.prerequisite;
create table if not exists public.realm_character_commands (
 character_id uuid not null references public.realm_characters(id) on delete cascade,
 request_id uuid not null, action text not null, payload jsonb not null, revision bigint not null,
 created_at timestamptz not null default clock_timestamp(), primary key(character_id,request_id)
);
alter table public.realm_item_catalog enable row level security;
alter table public.realm_skill_catalog enable row level security;
alter table public.realm_character_commands enable row level security;
revoke all on public.realm_item_catalog,public.realm_skill_catalog,public.realm_character_commands from public,anon,authenticated;
grant select on public.realm_character_commands to authenticated;
drop policy if exists realm_command_owner_read on public.realm_character_commands;
create policy realm_command_owner_read on public.realm_character_commands for select to authenticated using(exists(select 1 from public.realm_characters c where c.id=character_id and c.owner=auth.uid()));

create or replace function public.realm_inventory_quantity(inventory jsonb,item_id text) returns integer
language sql immutable set search_path=pg_catalog,public as $$
 select coalesce(sum((value->>'qty')::integer),0)::integer from jsonb_array_elements(inventory) where value->>'id'=item_id
$$;
create or replace function public.realm_inventory_adjust(inventory jsonb,item_id text,delta integer) returns jsonb
language plpgsql immutable set search_path=pg_catalog,public as $$
declare n integer:=public.realm_inventory_quantity(inventory,item_id)+delta; result jsonb;
begin
 if n<0 or n>99999 then raise exception 'Invalid item quantity'; end if;
 select coalesce(jsonb_agg(value),'[]') into result from jsonb_array_elements(inventory) where value->>'id'<>item_id;
 if n>0 then result:=result||jsonb_build_array(jsonb_build_object('id',item_id,'qty',n)); end if;
 return result;
end $$;

create or replace function public.realm_character_command(character_id uuid,expected_revision bigint,session_id uuid,request_id uuid,action text,payload jsonb) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); c public.realm_characters; prior public.realm_character_commands;
 p jsonb; inv jsonb; attrs jsonb; skills jsonb; entry public.realm_item_catalog; skill public.realm_skill_catalog;
 item_id text; next_id text; coins integer; level_no integer; cost integer; teeth integer; gems integer; allocated integer; value_no integer; max_hp integer; max_stamina integer;
begin
 if request_id is null or session_id is null or action is null or payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>256 then raise exception 'Invalid command'; end if;
 select * into c from public.realm_characters r where r.id=character_id and r.owner=uid and r.archived_at is null for update;
 if not found then raise exception 'Character not found'; end if;
 select * into prior from public.realm_character_commands q where q.character_id=c.id and q.request_id=realm_character_command.request_id;
 if found then
  if prior.action<>action or prior.payload<>payload then raise exception 'Request ID reused for a different command'; end if;
  return c; -- Retry returns the current state, never reapplies the debit/credit.
 end if;
 if expected_revision is null or expected_revision<>c.revision then raise exception 'Revision conflict'; end if;
 if not exists(select 1 from public.realm_character_leases l where l.character_id=c.id and l.session_id=realm_character_command.session_id and l.expires_at>clock_timestamp()) then raise exception 'Active character lease required'; end if;
 p:=c.progression; inv:=p->'inventory'; attrs:=p->'attributes'; skills:=p->'skills'; coins:=(p->>'coins')::integer; level_no:=(p->>'level')::integer; item_id:=payload->>'id';
 if action in ('buy','sell','equip','upgrade','consume') then
  select * into entry from public.realm_item_catalog r where r.id=item_id;
  if not found then raise exception 'Unknown item'; end if;
  if action<>'buy' and public.realm_inventory_quantity(inv,item_id)<1 then raise exception 'Item not owned'; end if;
  case action
   when 'buy' then
    if entry.buy is null then raise exception 'Item is not for sale'; end if;
    if entry.kind<>'consumable' and public.realm_inventory_quantity(inv,item_id)>0 then raise exception 'Item already owned'; end if;
    coins:=coins-entry.buy; inv:=public.realm_inventory_adjust(inv,item_id,1);
   when 'sell' then
    if entry.kind='quest' or item_id=coalesce(p->>'weapon','') or item_id=coalesce(p->>'armour','') then raise exception 'Cannot sell equipped or quest item'; end if;
    coins:=coins+entry.sell; inv:=public.realm_inventory_adjust(inv,item_id,-1);
   when 'equip' then
    if entry.kind not in ('weapon','armour') then raise exception 'Item cannot be equipped'; end if;
    p:=jsonb_set(p,array[entry.kind],to_jsonb(item_id));
   when 'upgrade' then
    if entry.kind<>'weapon' or entry.rank>=3 then raise exception 'Item cannot be upgraded'; end if;
    cost:=35+entry.rank*40; teeth:=2+entry.rank*2; gems:=case when entry.rank>=1 then 1 else 0 end;
    coins:=coins-cost; inv:=public.realm_inventory_adjust(inv,'tooth',-teeth); inv:=public.realm_inventory_adjust(inv,'gem',-gems);
    next_id:=entry.base||'~'||(entry.rank+1); inv:=public.realm_inventory_adjust(public.realm_inventory_adjust(inv,item_id,-1),next_id,1);
    if p->>'weapon'=item_id then p:=jsonb_set(p,'{weapon}',to_jsonb(next_id)); end if;
   when 'consume' then
    if item_id<>'potion' or (p->>'hp')::numeric>=(p->>'maxHp')::numeric then raise exception 'Potion cannot be used'; end if;
    inv:=public.realm_inventory_adjust(inv,item_id,-1);
    p:=jsonb_set(p,'{hp}',to_jsonb(least((p->>'maxHp')::numeric,(p->>'hp')::numeric+65+case when skills?'recovery' then 20 else 0 end)));
  end case;
 elsif action='unequip' then
  if item_id is null or item_id not in ('weapon','armour') then raise exception 'Invalid equipment slot'; end if;
  p:=jsonb_set(p,array[item_id],'null');
 elsif action='attribute' then
  if item_id is null or item_id not in ('strength','vitality','endurance','dexterity','fortitude') then raise exception 'Unknown attribute'; end if;
  select sum(value::integer) into allocated from jsonb_each_text(attrs);
  value_no:=(attrs->>item_id)::integer;
  if allocated>=(level_no-1)*3 or value_no>=30 then raise exception 'No attribute points available'; end if;
  attrs:=jsonb_set(attrs,array[item_id],to_jsonb(value_no+1));
 elsif action='skill' then
  select * into skill from public.realm_skill_catalog s where s.id=item_id;
  if not found then raise exception 'Unknown skill'; end if;
  if skills?item_id or jsonb_array_length(skills)>=level_no-1 or (skill.prerequisite is not null and not skills?skill.prerequisite) then raise exception 'Skill requirements not met'; end if;
  skills:=skills||jsonb_build_array(item_id);
 elsif action='respec' then
  if jsonb_array_length(skills)=0 then raise exception 'No skills to reset'; end if;
  coins:=coins-50-level_no*10; skills:='[]';
 else raise exception 'Unsupported character command'; end if;
 if coins<0 or coins>9999999 then raise exception 'Insufficient funds or currency limit'; end if;
 select sum(value::integer) into allocated from jsonb_each_text(attrs);
 max_hp:=100+(level_no-1)*12+(attrs->>'vitality')::integer*8+case when skills?'vitality' then 30 else 0 end;
 max_stamina:=150+(attrs->>'endurance')::integer*4+case when skills?'stamina' then 25 else 0 end;
 p:=p||jsonb_build_object('inventory',inv,'coins',coins,'attributes',attrs,'attributePoints',(level_no-1)*3-allocated,'skills',skills,'skillPoints',level_no-1-jsonb_array_length(skills),'maxHp',max_hp,'maxStamina',max_stamina,'hp',least((p->>'hp')::numeric,max_hp),'stamina',least((p->>'stamina')::numeric,max_stamina));
 insert into public.realm_character_revisions(character_id,revision,progression,solo_world) values(c.id,c.revision,c.progression,c.solo_world) on conflict do nothing;
 update public.realm_characters r set progression=p,revision=r.revision+1,updated_at=clock_timestamp() where r.id=c.id returning * into c;
 insert into public.realm_character_commands(character_id,request_id,action,payload,revision) values(c.id,request_id,action,payload,c.revision);
 return c;
end $$;
revoke all on function public.realm_inventory_quantity(jsonb,text),public.realm_inventory_adjust(jsonb,text,integer),public.realm_character_command(uuid,bigint,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.realm_character_command(uuid,bigint,uuid,uuid,text,jsonb) to authenticated;
commit;
