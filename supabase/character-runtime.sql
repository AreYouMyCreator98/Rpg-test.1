-- Account runtime: event-validated progression, isolated worlds and recoverable checkpoints.
-- The game catalog is supplied by the trusted deployment script, never by the browser.
begin;
create table if not exists public.realm_game_catalog(id boolean primary key default true check(id),data jsonb not null);
create table if not exists public.realm_legacy_imports(owner uuid primary key references auth.users(id),character_id uuid not null references public.realm_characters(id),imported_at timestamptz not null default now());
create table if not exists public.realm_character_contexts(character_id uuid not null references public.realm_characters(id) on delete cascade,world_id uuid not null,x double precision not null default 0,z double precision not null default 64,event_at timestamptz not null default clock_timestamp(),swing_at timestamptz,swing_id uuid,combo integer,primary key(character_id,world_id));
alter table public.realm_character_contexts add column if not exists room_grace_until timestamptz;
create table if not exists public.realm_encounters(world_id uuid not null,target integer not null,generation integer not null default 0,hp numeric not null,max_hp numeric not null,dead_at timestamptz,x double precision,z double precision,primary key(world_id,target));
create table if not exists public.realm_encounter_hits(character_id uuid not null references public.realm_characters(id) on delete cascade,world_id uuid not null,target integer not null,generation integer not null,swing_id uuid not null,damage numeric not null,primary key(character_id,world_id,target,generation,swing_id));
create table if not exists public.realm_encounter_credit(character_id uuid not null references public.realm_characters(id) on delete cascade,world_id uuid not null,target integer not null,generation integer not null,created_at timestamptz not null default clock_timestamp(),primary key(character_id,world_id,target,generation));
create table if not exists public.realm_dropped_items(world_id uuid not null,request_id uuid primary key,character_id uuid not null references public.realm_characters(id) on delete cascade,item_id text not null,x double precision not null,z double precision not null);
create table if not exists public.realm_reward_claims(world_id uuid not null,reward_id text not null,character_id uuid not null references public.realm_characters(id) on delete cascade,primary key(world_id,reward_id));
create table if not exists public.realm_character_quests(character_id uuid not null references public.realm_characters(id) on delete cascade,world_id uuid not null,quest_id text not null,accepted_at timestamptz not null default clock_timestamp(),claimed boolean not null default false,primary key(character_id,world_id,quest_id));
alter table public.realm_character_quests add column if not exists legacy_count integer not null default 0;
create table if not exists public.realm_character_bounties(character_id uuid not null references public.realm_characters(id) on delete cascade,target text not null,accepted_at timestamptz,claimed_at timestamptz,available_at timestamptz,primary key(character_id,target));
create table if not exists public.realm_character_unique_items(character_id uuid not null references public.realm_characters(id) on delete cascade,item_id text not null,primary key(character_id,item_id));
create table if not exists public.realm_world_structures(world_id uuid not null,structure_id text not null,primary key(world_id,structure_id));
create table if not exists public.realm_character_discoveries(character_id uuid not null references public.realm_characters(id) on delete cascade,world_id uuid not null,place text not null,primary key(character_id,world_id,place));
create table if not exists public.realm_character_events(character_id uuid not null references public.realm_characters(id) on delete cascade,request_id uuid not null,action text not null,body jsonb not null,created_at timestamptz not null default clock_timestamp(),primary key(character_id,request_id));
do $$declare t text;begin foreach t in array array['realm_dropped_items','realm_world_structures','realm_character_discoveries','realm_game_catalog','realm_legacy_imports','realm_character_contexts','realm_encounters','realm_encounter_hits','realm_encounter_credit','realm_reward_claims','realm_character_quests','realm_character_bounties','realm_character_unique_items','realm_character_events'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from public,anon,authenticated',t);end loop;end$$;

-- Discover the village only from server-validated world positions.
create or replace function public.realm_record_town_visit() returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 if new.x*new.x+(new.z-64)^2<144 then
  insert into public.realm_character_discoveries values(new.character_id,new.world_id,'town') on conflict do nothing;
 end if;return new;
end$$;
revoke all on function public.realm_record_town_visit() from public,anon,authenticated;
drop trigger if exists realm_town_visit on public.realm_character_contexts;
create trigger realm_town_visit after insert or update of x,z on public.realm_character_contexts for each row execute function public.realm_record_town_visit();
-- One-time migration honours saved discoveries without allowing later checkpoint edits to unlock travel.
create table if not exists public.realm_runtime_migrations(id text primary key);
alter table public.realm_runtime_migrations enable row level security;
revoke all on public.realm_runtime_migrations from public,anon,authenticated;
do $$begin
 if not exists(select 1 from public.realm_runtime_migrations where id='town-return-v1') then
  insert into public.realm_character_discoveries
   select character_id,world_id,'town' from public.realm_character_contexts where x*x+(z-64)^2<144
   union select id,id,'town' from public.realm_characters where solo_world->'visited' @> '[0]'::jsonb
  on conflict do nothing;
  insert into public.realm_runtime_migrations values('town-return-v1');
 end if;
end$$;

create or replace function public.realm_character_check(character_id uuid,expected_revision bigint,session_id uuid) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;begin
 select * into c from public.realm_characters r where r.id=character_id and r.owner=public.realm_account_uid() and r.archived_at is null for update;
 if not found then raise exception 'Character not found';end if;
 if expected_revision is null or expected_revision<>c.revision then raise exception 'Revision conflict';end if;
 if not exists(select 1 from public.realm_character_leases l where l.character_id=c.id and l.session_id=realm_character_check.session_id and l.expires_at>clock_timestamp()) then raise exception 'Active character lease required';end if;
 return c;
end$$;
create or replace function public.realm_character_world_allowed(character_id uuid,world_id uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$select world_id=character_id or exists(select 1 from public.realm_character_contexts ctx where ctx.character_id=realm_character_world_allowed.character_id and ctx.world_id=realm_character_world_allowed.world_id and ctx.room_grace_until>clock_timestamp()) or exists(select 1 from public.realm_members m join public.realm_rooms r on r.id=m.room where m.uid=auth.uid() and to_jsonb(m)->>'character_id'=realm_character_world_allowed.character_id::text and m.room=world_id and to_jsonb(r)->>'persistent'='true' and r.touched>clock_timestamp()-interval '45 seconds')$$;
create or replace function public.realm_award_experience(p jsonb,amount integer) returns jsonb
language plpgsql immutable set search_path=pg_catalog,public as $$
declare level_no integer:=(p->>'level')::integer; xp integer:=(p->>'xp')::integer+amount; required integer; spent integer; max_hp integer;max_stamina integer;
begin
 loop required:=45+(level_no-1)*25+greatest(0,level_no-20)^2*5;exit when level_no>=40 or xp<required;xp:=xp-required;level_no:=level_no+1;end loop;
 select coalesce(sum(value::integer),0) into spent from jsonb_each_text(p->'attributes');
 max_hp:=100+(level_no-1)*12+coalesce((p#>>'{attributes,vitality}')::integer,0)*8+case when p->'skills'?'vitality' then 30 else 0 end;
 max_stamina:=150+coalesce((p#>>'{attributes,endurance}')::integer,0)*4+case when p->'skills'?'stamina' then 25 else 0 end;
 return p||jsonb_build_object('level',level_no,'xp',least(xp,required),'attributePoints',(level_no-1)*3-spent,'skillPoints',level_no-1-jsonb_array_length(p->'skills'),'maxHp',max_hp,'maxStamina',max_stamina);
end$$;
create or replace function public.realm_character_open(character_id uuid,expected_revision bigint,session_id uuid,world_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;pos jsonb;begin
 c:=public.realm_character_acquire(character_id,expected_revision,session_id);
 if not public.realm_character_world_allowed(c.id,world_id) then raise exception 'World membership required';end if;
 pos:=case when world_id=c.id then c.solo_world->'position' else '{"x":0,"z":64}' end;
 insert into public.realm_character_contexts(character_id,world_id,x,z) values(c.id,world_id,coalesce((pos->>'x')::float8,0),coalesce((pos->>'z')::float8,64)) on conflict do nothing;
 if world_id<>c.id then update public.realm_character_contexts ctx set room_grace_until=clock_timestamp()+interval '90 seconds' where ctx.character_id=c.id and ctx.world_id=realm_character_open.world_id;end if;
 return jsonb_build_object('character',to_jsonb(c),'serverTime',extract(epoch from clock_timestamp())*1000,'encounters',(select coalesce(jsonb_agg(to_jsonb(e)||jsonb_build_object('damage',(select coalesce(sum(h.damage),0) from public.realm_encounter_hits h where h.character_id=c.id and h.world_id=e.world_id and h.target=e.target and h.generation=e.generation))),'[]') from public.realm_encounters e where e.world_id=realm_character_open.world_id),'credits',(select coalesce(jsonb_agg(to_jsonb(ec)),'[]') from public.realm_encounter_credit ec where ec.character_id=c.id and ec.world_id=realm_character_open.world_id),'uniqueItems',(select coalesce(jsonb_agg(u.item_id),'[]') from public.realm_character_unique_items u where u.character_id=c.id),'bounties',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.realm_character_bounties b where b.character_id=c.id));
end$$;
create or replace function public.realm_character_import(character_id uuid,expected_revision bigint,session_id uuid,legacy jsonb) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;p jsonb;cat jsonb;entry jsonb;allocated integer;skill text;prereq text;item_id text;completed boolean;begin
 c:=public.realm_character_check(character_id,expected_revision,session_id);
 perform pg_advisory_xact_lock(hashtextextended(c.owner::text,93));
 if c.revision<>1 or octet_length(legacy::text)>500000 or legacy is null then raise exception 'Import requires an unused character slot';end if;
 if exists(select 1 from public.realm_legacy_imports where owner=c.owner) then raise exception 'Legacy import already used for this account';end if;
 p:=legacy->'player';select data into cat from public.realm_game_catalog where id;
 if not p?&array['level','coins','inventory','xp','attributes','skills','hp','maxHp'] or jsonb_typeof(p)<>'object' or (p->>'level')::integer not between 1 and 40 or (p->>'coins')::integer not between 0 and 9999999 or jsonb_typeof(p->'inventory')<>'array' or jsonb_array_length(p->'inventory')>300 or (p->>'xp')::integer not between 0 and 10000 then raise exception 'Invalid legacy progression';end if;
 for entry in select value from jsonb_array_elements(p->'inventory') loop if not entry?&array['id','qty'] or not (cat->'items'?(entry->>'id')) or (entry->>'qty')::integer not between 1 and 99999 then raise exception 'Invalid legacy item';end if;end loop;
 if (select count(*)<>count(distinct value->>'id') from jsonb_array_elements(p->'inventory')) then raise exception 'Duplicate legacy item';end if;
 if not (p->'attributes')?&array['strength','vitality','endurance','dexterity','fortitude'] or jsonb_typeof(p->'attributes')<>'object' or jsonb_typeof(p->'skills')<>'array' then raise exception 'Invalid legacy build';end if;
 select sum(value::integer) into allocated from jsonb_each_text(p->'attributes');
 if allocated>((p->>'level')::integer-1)*3 or exists(select 1 from jsonb_each_text(p->'attributes') where key not in ('strength','vitality','endurance','dexterity','fortitude') or value::integer not between 0 and 30) then raise exception 'Invalid legacy attributes';end if;
 if jsonb_array_length(p->'skills')>(p->>'level')::integer-1 or (select count(*)<>count(distinct value) from jsonb_array_elements_text(p->'skills')) then raise exception 'Invalid legacy skills';end if;
 for skill in select value from jsonb_array_elements_text(p->'skills') loop select prerequisite into prereq from public.realm_skill_catalog where id=skill;if not found or prereq is not null and not p->'skills'?prereq then raise exception 'Invalid legacy prerequisite';end if;end loop;
 for item_id in select unnest(array['weapon','armour']) loop if p->>item_id is not null and (public.realm_inventory_quantity(p->'inventory',p->>item_id)<1 or cat#>>array['items',p->>item_id,'type']<>item_id) then raise exception 'Invalid legacy equipment';end if;end loop;
 for entry in select value from jsonb_array_elements(cat->'quests') loop if legacy#>>array['living','quests',entry->>'id','status'] in ('active','claimed') then insert into public.realm_character_quests(character_id,world_id,quest_id,claimed,legacy_count) values(c.id,c.id,entry->>'id',legacy#>>array['living','quests',entry->>'id','status']='claimed',least((entry->>'goal')::integer,greatest(0,coalesce((legacy#>>array['living','quests',entry->>'id','count'])::integer,0))));end if;end loop;
 p:=public.realm_award_experience(p,0)||'{"provenance":"legacy"}'::jsonb;
 insert into public.realm_legacy_imports(owner,character_id) values(c.owner,c.id);
 insert into public.realm_character_revisions(character_id,revision,progression,solo_world) values(c.id,c.revision,c.progression,c.solo_world);
 update public.realm_characters r set progression=p,solo_world=(legacy-'player'-'settings')||jsonb_build_object('position',jsonb_build_object('x',p->'x','z',p->'z')),revision=r.revision+1,updated_at=clock_timestamp() where r.id=c.id returning * into c;
 if legacy->'visited' @> '[0]'::jsonb then insert into public.realm_character_discoveries values(c.id,c.id,'town') on conflict do nothing;end if;
 for entry in select value from jsonb_array_elements(p->'inventory') loop if (cat#>>array['items',entry->>'id','rarity'])::integer=4 or (entry->>'id') like 'exp_%' or (entry->>'id') like 'frontier_%' or (entry->>'id') like 'caveblade%' then insert into public.realm_character_unique_items values(c.id,cat#>>array['items',entry->>'id','base']) on conflict do nothing;end if;end loop;
 for entry in select value from jsonb_array_elements(cat->'enemies') loop
  completed:=coalesce((entry->>'boss')::boolean,false) and (coalesce((entry->>'guardian')::boolean,false) and coalesce((legacy#>>'{living,guardianDead}')::boolean,false) or entry->>'type'='3' and not coalesce((entry->>'guardian')::boolean,false) and coalesce((legacy->>'bossDead')::boolean,false) or (legacy#>'{living,frontierBosses}')?(entry->>'family') or (legacy#>'{living,expansion,bosses}')?(entry->>'expansion'));
  if completed then insert into public.realm_encounters(world_id,target,hp,max_hp,dead_at,x,z) values(c.id,(entry->>'id')::integer,0,(entry->>'hp')::numeric,clock_timestamp(),(entry->>'x')::float8,(entry->>'z')::float8) on conflict do nothing;
   update public.realm_character_quests cq set legacy_count=1 where cq.character_id=c.id and exists(select 1 from jsonb_array_elements(cat->'quests') q where q->>'id'=cq.quest_id and (q->>'expansionBoss'=entry->>'expansion' or q->>'bossFamily'=entry->>'family' or q->>'id'='guardian' and (entry->>'guardian')::boolean));
  end if;
 end loop;
 return c;
end$$;
create or replace function public.realm_character_checkpoint(character_id uuid,expected_revision bigint,session_id uuid,world jsonb,hp numeric,stamina numeric) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;ctx public.realm_character_contexts;begin
 c:=public.realm_character_check(character_id,expected_revision,session_id);
 if world is null or jsonb_typeof(world)<>'object' or octet_length(world::text)>500000 then raise exception 'Invalid world snapshot';end if;
 select * into ctx from public.realm_character_contexts t where t.character_id=c.id and t.world_id=c.id;
 if not found then raise exception 'Open the solo world first';end if;
 insert into public.realm_character_revisions(character_id,revision,progression,solo_world) values(c.id,c.revision,c.progression,c.solo_world) on conflict do nothing;
 update public.realm_characters r set solo_world=(world-'player'-'settings'-'position')||jsonb_build_object('position',jsonb_build_object('x',ctx.x,'z',ctx.z)),progression=jsonb_set(jsonb_set(c.progression,'{hp}',to_jsonb(greatest(0,least(coalesce(hp,0),(c.progression->>'maxHp')::numeric)))),'{stamina}',to_jsonb(greatest(0,least(coalesce(stamina,0),(c.progression->>'maxStamina')::numeric)))),revision=r.revision+1,updated_at=clock_timestamp() where r.id=c.id returning * into c;
 return c;
end$$;

create or replace function public.realm_character_event(character_id uuid,expected_revision bigint,session_id uuid,world_id uuid,request_id uuid,action text,body jsonb) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;ctx public.realm_character_contexts;prior public.realm_character_events;cat jsonb;p jsonb;spec jsonb;q jsonb;entry jsonb;inv jsonb;enc public.realm_encounters;quest public.realm_character_quests;bounty public.realm_character_bounties;
 t timestamptz;px float8;pz float8;seconds numeric;target_no integer;amount numeric;maximum numeric;attack_power numeric;atk_speed numeric;total numeric;reward text;item_id text;count_no integer;generation_no integer;current_combo integer;allowed boolean;gold integer;need integer;world_level integer;begin
 if request_id is null or action is null or body is null or jsonb_typeof(body)<>'object' or octet_length(body::text)>4096 then raise exception 'Invalid event';end if;
 -- Serialize world encounters before character locks so simultaneous participants cannot double-credit a death.
 perform pg_advisory_xact_lock(hashtextextended(world_id::text,85));
 select * into c from public.realm_characters r where r.id=character_id and r.owner=public.realm_account_uid() and r.archived_at is null;
 if not found then raise exception 'Character not found';end if;
 select * into prior from public.realm_character_events e where e.character_id=c.id and e.request_id=realm_character_event.request_id;
 if found then if prior.action<>action or prior.body<>body then raise exception 'Event ID reused';end if;return c;end if;
 c:=public.realm_character_check(character_id,expected_revision,session_id);
 if not public.realm_character_world_allowed(c.id,world_id) then raise exception 'World membership required';end if;
 select * into ctx from public.realm_character_contexts r where r.character_id=c.id and r.world_id=realm_character_event.world_id for update;
 if not found then raise exception 'Open the world first';end if;
 t:=to_timestamp((body->>'time')::numeric/1000);px:=(body->>'x')::float8;pz:=(body->>'z')::float8;
 if t is null or t>clock_timestamp()+interval '2 seconds' or t<ctx.event_at-interval '2 seconds' or px is null or pz is null or px::text in ('NaN','Infinity','-Infinity') or pz::text in ('NaN','Infinity','-Infinity') or px not between -330 and 1150 or pz not between -340 and 180 then raise exception 'Invalid event position or time';end if;
 seconds:=greatest(0,extract(epoch from t-ctx.event_at));
 select data into cat from public.realm_game_catalog where id;
 allowed:=sqrt((px-ctx.x)^2+(pz-ctx.z)^2)<=seconds*15+3;
 if not allowed and action='travel' then
  allowed:=sqrt((px-300)^2+pz^2)<5 and sqrt((ctx.x+46)^2+(ctx.z-38)^2)<5 or sqrt((px+46)^2+(pz-39)^2)<5 and sqrt((ctx.x-300)^2+(ctx.z-5)^2)<5;
  for entry in select value from jsonb_array_elements(cat->'dungeons') loop allowed:=allowed or (sqrt((ctx.x-(entry#>>'{entry,0}')::float8)^2+(ctx.z-(entry#>>'{entry,1}')::float8)^2)<6 and abs(px-(entry->>'origin')::float8)<3 and abs(pz-7)<3) or (abs(ctx.x-(entry->>'origin')::float8)<4 and abs(ctx.z-8)<4 and sqrt((px-(entry#>>'{entry,0}')::float8)^2+(pz-(entry#>>'{entry,1}')::float8)^2)<6);end loop;
 end if;
 if action='respawn' then allowed:=sqrt(px^2+(pz-64)^2)<3 or (world_id=c.id and coalesce((c.solo_world#>>'{living,prologue,stage}')::integer,3)<2 and sqrt((px-50)^2+(pz-151)^2)<3);end if;
 if not allowed then raise exception 'Travel exceeds movement allowance';end if;
 p:=jsonb_set(c.progression,'{playtime}',to_jsonb(coalesce((c.progression->>'playtime')::numeric,0)+least(30,seconds)));inv:=p->'inventory';item_id:=body->>'id';
 if action in ('buy','sell','equip','unequip','upgrade','consume','attribute','skill','respec') then
  if action in ('buy','upgrade','sell') then select value into entry from jsonb_array_elements(cat->'npcs') where value->>'id'=case when action='upgrade' or action='buy' and left(item_id,1)='w' then 'smith' else 'merchant' end;if sqrt((px-(entry->>'x')::float8)^2+(pz-(entry->>'z')::float8)^2)>5 then raise exception 'Visit the appropriate shop';end if;end if;
  if action='consume' and body?'hp' then update public.realm_characters r set progression=jsonb_set(progression,'{hp}',to_jsonb(greatest(0,least((body->>'hp')::numeric,(p->>'hp')::numeric)))) where r.id=c.id;end if;
  c:=public.realm_character_command(c.id,c.revision,session_id,request_id,action,jsonb_build_object('id',item_id));p:=c.progression;
 elsif action='return_town' then
  if px>200 then raise exception 'Leave the dungeon before returning to town';end if;
  if not exists(select 1 from public.realm_character_discoveries d where d.character_id=c.id and d.world_id=realm_character_event.world_id and d.place='town') then raise exception 'Visit Wanderer’s Village first to unlock this route';end if;
  if (p->>'hp')::numeric<=0 then raise exception 'You must be alive to return';end if;
  if ctx.swing_at>clock_timestamp()-interval '8 seconds' then raise exception 'Wait until you have been out of combat for 8 seconds';end if;
  if exists(select 1 from jsonb_array_elements(cat->'enemies') ce left join public.realm_encounters en on en.world_id=realm_character_event.world_id and en.target=(ce->>'id')::integer
   where coalesce(en.hp,1)>0 and (coalesce(en.x,(ce->>'x')::float8)-px)^2+(coalesce(en.z,(ce->>'z')::float8)-pz)^2<400)
   then raise exception 'Move away from nearby enemies before returning';end if;
  px:=0;pz:=64;
  -- Persist solo arrival in the same transaction, even if the connection drops before acknowledgement.
  if world_id=c.id then update public.realm_characters r set solo_world=jsonb_set(r.solo_world,'{position}','{"x":0,"z":64}'::jsonb) where r.id=c.id;end if;
 elsif action in ('move','travel','respawn') then
  if sqrt((px+14)^2+(pz-9)^2)<15 then insert into public.realm_character_discoveries values(c.id,world_id,'bridge') on conflict do nothing;end if;
  if sqrt((px+31)^2+(pz+68)^2)<20 then insert into public.realm_character_discoveries values(c.id,world_id,'ruins') on conflict do nothing;end if;
 elsif action='reset_chief' then
  select (value->>'id')::integer into target_no from jsonb_array_elements(cat->'enemies') where value->>'type'='3' and not (value->>'guardian')::boolean limit 1;
  update public.realm_encounters en set hp=en.max_hp,dead_at=null,generation=en.generation+case when en.hp<=0 then 1 else 0 end where en.world_id=realm_character_event.world_id and en.target=target_no;
 elsif action='swing' then
  atk_speed:=1+coalesce((p#>>'{attributes,dexterity}')::numeric,0)*.01+case when p->'skills'?'reflex' then .1 else 0 end;
  if ctx.swing_at is not null and extract(epoch from t-ctx.swing_at)<.40/atk_speed then raise exception 'Attack cooldown';end if;
  current_combo:=coalesce((body->>'combo')::integer,0);
  if current_combo not between 0 and 2 then raise exception 'Invalid combo';end if;
  update public.realm_character_contexts r set swing_at=t,swing_id=request_id,combo=current_combo where r.character_id=c.id and r.world_id=realm_character_event.world_id;
 elsif action='strike' then
  if not body?&array['target','ex','ez','damage'] or body->'ex'='null'::jsonb or body->'ez'='null'::jsonb then raise exception 'Strike data required';end if;
  target_no:=(body->>'target')::integer;spec:=cat->'enemies'->target_no;
  if spec is null or ctx.swing_id is null or t-ctx.swing_at>interval '1.2 seconds' then raise exception 'Attack is not active';end if;
  if sqrt(((body->>'ex')::float8-px)^2+((body->>'ez')::float8-pz)^2)>5 or sqrt(((body->>'ex')::float8-(spec->>'x')::float8)^2+((body->>'ez')::float8-(spec->>'z')::float8)^2)>29 then raise exception 'Target outside encounter range';end if;
  world_level:=(p->>'level')::integer;
  if world_id<>c.id then select (ch.progression->>'level')::integer into world_level from public.realm_characters ch join public.realm_members m on m.character_id=ch.id join public.realm_rooms rr on rr.id=m.room and rr.host=m.uid where rr.id=realm_character_event.world_id;end if;
  maximum:=(spec->>'hp')::numeric*(1+greatest(0,world_level-20)*.035);
  insert into public.realm_encounters(world_id,target,hp,max_hp,x,z) values(world_id,target_no,round(maximum),round(maximum),(body->>'ex')::float8,(body->>'ez')::float8) on conflict do nothing;
  select * into enc from public.realm_encounters e where e.world_id=realm_character_event.world_id and e.target=target_no for update;
  if enc.hp<=0 then
   if not (spec->>'boss')::boolean and t-enc.dead_at>=interval '75 seconds' then update public.realm_encounters e set hp=round(maximum),max_hp=round(maximum),generation=e.generation+1,dead_at=null where e.world_id=enc.world_id and e.target=enc.target returning * into enc;
   else raise exception 'Encounter already defeated';end if;
  end if;
  attack_power:=round((4+(p->>'level')::integer*2+coalesce((p#>>'{attributes,strength}')::numeric,0)*1.5+coalesce((cat#>>array['items',p->>'weapon','damage'])::numeric,0)+case when p->>'pet'='wolf' then 2 else 0 end)*(1+case when p->'skills'?'strikes' then .1 else 0 end+case when p->'skills'?'blade' then .15 else 0 end));
  maximum:=attack_power*case when ctx.combo=2 then case when p->'skills'?'combos' then 2 else 1.75 end else 1 end*case when p->'skills'?'blade' then 1.9 else 1.65 end;
  amount:=(body->>'damage')::numeric;
  if amount is null or amount<=0 or amount>ceil(maximum) then raise exception 'Damage exceeds equipped build';end if;
  insert into public.realm_encounter_hits values(c.id,world_id,target_no,enc.generation,ctx.swing_id,amount);
  update public.realm_encounters e set hp=greatest(0,e.hp-amount),dead_at=case when e.hp<=amount then t else null end,x=(body->>'ex')::float8,z=(body->>'ez')::float8 where e.world_id=enc.world_id and e.target=enc.target;
 elsif action='kill' then
  target_no:=(body->>'target')::integer;spec:=cat->'enemies'->target_no;select * into enc from public.realm_encounters e where e.world_id=realm_character_event.world_id and e.target=target_no;
  if not found or enc.hp>0 then raise exception 'Encounter still active';end if;
  select coalesce(sum(h.damage),0) into total from public.realm_encounter_hits h where h.character_id=c.id and h.world_id=enc.world_id and h.target=target_no and h.generation=enc.generation;
  if total<least(enc.max_hp*.05,15) then raise exception 'Encounter participation required';end if;
  insert into public.realm_encounter_credit values(c.id,world_id,target_no,enc.generation,t) on conflict do nothing;
  if found then p:=public.realm_award_experience(p,round((spec->>'xp')::numeric*(1+greatest(0,(p->>'level')::integer-20)*.025))::integer);end if;
 elsif action='pickup' then
  -- Rewards are selected from the server catalog, never from a client amount.
  if body?'dropped' then
   select jsonb_build_object('id',di.item_id,'qty',1,'x',di.x,'z',di.z) into entry from public.realm_dropped_items di where di.world_id=realm_character_event.world_id and di.request_id=(body->>'dropped')::uuid and di.character_id=c.id;
   if entry is null or entry->>'id'<>item_id or sqrt((px-(entry->>'x')::float8)^2+(pz-(entry->>'z')::float8)^2)>4 then raise exception 'Dropped item unavailable';end if;
   spec:=jsonb_build_object('drops',jsonb_build_array(entry));reward:='drop:'||(body->>'dropped');
  elsif body?'structure' then
   select value into spec from jsonb_array_elements(cat->'structures') where value->>'id'=body->>'structure';
   if spec is null or not exists(select 1 from public.realm_world_structures ws where ws.world_id=realm_character_event.world_id and ws.structure_id=body->>'structure') or sqrt((px-(spec->>'x')::float8)^2+(pz-(spec->>'z')::float8)^2)>4 then raise exception 'Container reward unavailable';end if;
   reward:='structure:'||(body->>'structure')||':'||item_id;
  else
  target_no:=(body->>'target')::integer;generation_no:=(body->>'generation')::integer;spec:=cat->'enemies'->target_no;
  select * into enc from public.realm_encounters e where e.world_id=realm_character_event.world_id and e.target=target_no;
  if not found or enc.hp>0 or enc.generation<>generation_no or (sqrt((px-enc.x)^2+(pz-enc.z)^2)>4 and not (item_id='relic' and exists(select 1 from public.realm_encounter_credit ec where ec.character_id=c.id and ec.world_id=enc.world_id and ec.target=enc.target and ec.generation=enc.generation))) then raise exception 'Reward is unavailable';end if;
  reward:=target_no||':'||generation_no||':'||item_id;
  end if;
  select value into entry from jsonb_array_elements(spec->'drops') where value->>'id'=item_id;
  if entry is null then raise exception 'Invalid encounter reward';end if;
  if item_id='relic' then reward:=reward||':'||c.id::text;end if;
  insert into public.realm_reward_claims values(world_id,reward,c.id);
  if coalesce((entry->>'unique')::boolean,false) then insert into public.realm_character_unique_items values(c.id,item_id) on conflict do nothing;if not found then raise exception 'Unique reward already owned';end if;end if;
  if item_id='coin' then p:=jsonb_set(p,'{coins}',to_jsonb((p->>'coins')::integer+(entry->>'qty')::integer));else p:=jsonb_set(p,'{inventory}',public.realm_inventory_adjust(inv,item_id,(entry->>'qty')::integer));end if;
 elsif action in ('pet','mount') then
  select value into entry from jsonb_array_elements(cat->(action||'s')) where value->>'id'=item_id;
  if item_id is not null and entry is null then raise exception 'Unknown companion';end if;
  inv:=coalesce(p->(action||'s'),'[]');
  if item_id is not null and not inv?item_id then if (p->>'level')::integer<(entry->>'level')::integer or (p->>'coins')::integer<(entry->>'cost')::integer then raise exception 'Companion requirements not met';end if;p:=jsonb_set(p,'{coins}',to_jsonb((p->>'coins')::integer-(entry->>'cost')::integer));inv:=inv||jsonb_build_array(item_id);end if;
  p:=jsonb_set(jsonb_set(p,array[action||'s'],inv),array[action],coalesce(to_jsonb(item_id),'null'));
 elsif action in ('quest_accept','quest_claim') then
  select value into q from jsonb_array_elements(cat->'quests') where value->>'id'=item_id;
  if q is null then raise exception 'Unknown quest';end if;
  select value into entry from jsonb_array_elements(cat->'npcs') where value->>'id'=q->>'giver';
  if entry is null or sqrt((px-(entry->>'x')::float8)^2+(pz-(entry->>'z')::float8)^2)>4 then raise exception 'Visit the quest giver';end if;
  if action='quest_accept' then insert into public.realm_character_quests(character_id,world_id,quest_id,accepted_at) values(c.id,world_id,item_id,t);
  else
   select * into quest from public.realm_character_quests cq where cq.character_id=c.id and cq.world_id=realm_character_event.world_id and cq.quest_id=item_id for update;
   if not found or quest.claimed then raise exception 'Quest unavailable';end if;
   need:=(q->>'goal')::integer;count_no:=0;
   if item_id in ('teeth','supplies','relic') then reward:=case when item_id='teeth' then 'tooth' else item_id end;count_no:=public.realm_inventory_quantity(inv,reward);if count_no>=need then p:=jsonb_set(p,'{inventory}',public.realm_inventory_adjust(inv,reward,-need));end if;
   elsif item_id='trail' then select count(*) into count_no from public.realm_character_discoveries cd where cd.character_id=c.id and cd.world_id=realm_character_event.world_id and cd.place in ('bridge','ruins');
   elsif q?'expansionBoss' or q?'bossFamily' or item_id='guardian' then
    select count(*) into count_no from public.realm_encounters en where en.world_id=realm_character_event.world_id and en.hp=0 and ((q?'expansionBoss' and cat->'enemies'->en.target->>'expansion'=q->>'expansionBoss') or (q?'bossFamily' and cat->'enemies'->en.target->>'family'=q->>'bossFamily' and (cat->'enemies'->en.target->>'boss')::boolean) or (item_id='guardian' and (cat->'enemies'->en.target->>'guardian')::boolean));
   else
    select count(*) into count_no from public.realm_encounter_credit ec where ec.character_id=c.id and ec.world_id=realm_character_event.world_id and (
     (q?'expansionBoss' and cat->'enemies'->ec.target->>'expansion'=q->>'expansionBoss' and (cat->'enemies'->ec.target->>'boss')::boolean) or
     (q?'bossFamily' and cat->'enemies'->ec.target->>'family'=q->>'bossFamily' and (cat->'enemies'->ec.target->>'boss')::boolean) or
     (item_id='guardian' and (cat->'enemies'->ec.target->>'guardian')::boolean) or
     (ec.created_at>=quest.accepted_at and ((q?'expansionEnemy' and cat->'enemies'->ec.target->>'expansion'=q->>'expansionEnemy') or (q?'enemyFamily' and cat->'enemies'->ec.target->>'family'=q->>'enemyFamily' and not (cat->'enemies'->ec.target->>'boss')::boolean) or (item_id='scouts' and (cat->'enemies'->ec.target->>'type')::integer=0))));
   end if;
   if item_id not in ('teeth','supplies','relic','trail') then count_no:=count_no+quest.legacy_count;end if;
   if count_no<need then raise exception 'Quest objectives incomplete';end if;
   update public.realm_character_quests cq set claimed=true where cq.character_id=c.id and cq.world_id=realm_character_event.world_id and cq.quest_id=item_id;
   p:=public.realm_award_experience(jsonb_set(p,'{coins}',to_jsonb((p->>'coins')::integer+(q->>'gold')::integer)),(q->>'xp')::integer);
  end if;
 elsif action in ('bounty_accept','bounty_claim') then
  if sqrt((px-5)^2+(pz-73)^2)>3 then raise exception 'Visit the bounty board';end if;
  select value into spec from jsonb_array_elements(cat->'enemies') where value->>'expansion'=item_id and ((value->>'boss')::boolean or item_id in ('bear','troll')) limit 1;
  if spec is null then raise exception 'Unknown bounty';end if;
  select * into bounty from public.realm_character_bounties cb where cb.character_id=c.id and cb.target=item_id for update;
  if action='bounty_accept' then
   if found and (bounty.claimed_at is null or bounty.available_at>clock_timestamp()) then raise exception 'Bounty cooldown or active contract';end if;
   insert into public.realm_character_bounties as cb(character_id,target,accepted_at) values(c.id,item_id,t) on conflict on constraint realm_character_bounties_pkey do update set accepted_at=excluded.accepted_at,claimed_at=null;
   update public.realm_encounters e set hp=e.max_hp,dead_at=null,generation=e.generation+1 where e.world_id=realm_character_event.world_id and e.hp=0 and cat->'enemies'->e.target->>'expansion'=item_id;
  else
   if not found or bounty.claimed_at is not null then raise exception 'No active bounty';end if;
   if not exists(select 1 from public.realm_encounter_credit ec where ec.character_id=c.id and ec.world_id=realm_character_event.world_id and ec.created_at>=bounty.accepted_at and cat->'enemies'->ec.target->>'expansion'=item_id) then raise exception 'Bounty participation required';end if;
   update public.realm_character_bounties cb set claimed_at=clock_timestamp(),available_at=clock_timestamp()+case when (spec->>'boss')::boolean then interval '2 hours' else interval '30 minutes' end where cb.character_id=c.id and cb.target=item_id;
   p:=public.realm_award_experience(jsonb_set(p,'{coins}',to_jsonb((p->>'coins')::integer+100+(spec->>'level')::integer*10)),(spec->>'xp')::integer);
  end if;
 elsif action='structure' then
  -- A trusted catalog identifies the container; nearby guards must be server-defeated.
  select value into spec from jsonb_array_elements(cat->'structures') where value->>'id'=item_id;
  if spec is null or sqrt((px-(spec->>'x')::float8)^2+(pz-(spec->>'z')::float8)^2)>4 then raise exception 'Structure unavailable';end if;
  if exists(select 1 from jsonb_array_elements(cat->'enemies') ce where sqrt(((ce->>'x')::float8-(spec->>'x')::float8)^2+((ce->>'z')::float8-(spec->>'z')::float8)^2)<coalesce((spec->>'guardRadius')::float8,0) and not exists(select 1 from public.realm_encounters e where e.world_id=realm_character_event.world_id and e.target=(ce->>'id')::integer and e.hp=0)) then raise exception 'Nearby guardians remain';end if;
  if spec?'requires' and exists(select 1 from jsonb_array_elements_text(spec->'requires') req where not exists(select 1 from public.realm_world_structures ws where ws.world_id=realm_character_event.world_id and ws.structure_id=req)) then raise exception 'Structure prerequisite missing';end if;
  insert into public.realm_world_structures values(world_id,item_id) on conflict do nothing;
  if found and item_id='hollow:gate' and public.realm_inventory_quantity(inv,'cavekey')>0 then p:=jsonb_set(p,'{inventory}',public.realm_inventory_adjust(inv,'cavekey',-1));end if;
 elsif action='drop' then
  if public.realm_inventory_quantity(inv,item_id)<1 or cat#>>array['items',item_id,'type']='quest' then raise exception 'Item cannot be dropped';end if;
  p:=jsonb_set(p,'{inventory}',public.realm_inventory_adjust(inv,item_id,-1));if public.realm_inventory_quantity(p->'inventory',item_id)=0 then if p->>'weapon'=item_id then p:=jsonb_set(p,'{weapon}','null');end if;if p->>'armour'=item_id then p:=jsonb_set(p,'{armour}','null');end if;end if;
  insert into public.realm_dropped_items values(world_id,request_id,c.id,item_id,px,pz);
 else raise exception 'Unsupported progression event';end if;
 if action not in ('buy','sell','equip','unequip','upgrade','consume','attribute','skill','respec') then
  insert into public.realm_character_revisions(character_id,revision,progression,solo_world) values(c.id,c.revision,c.progression,c.solo_world) on conflict do nothing;
  update public.realm_characters r set progression=p,revision=r.revision+1,updated_at=clock_timestamp() where r.id=c.id returning * into c;
 end if;
 update public.realm_character_contexts r set x=px,z=pz,event_at=greatest(t,r.event_at),room_grace_until=case when exists(select 1 from public.realm_members m where m.room=realm_character_event.world_id and m.uid=auth.uid()) then clock_timestamp()+interval '90 seconds' else r.room_grace_until end where r.character_id=c.id and r.world_id=realm_character_event.world_id;
 insert into public.realm_character_events(character_id,request_id,action,body) values(c.id,request_id,action,body);
 delete from public.realm_character_revisions cr where cr.character_id=c.id and cr.revision<c.revision-60;
 return c;
end$$;
revoke all on function public.realm_character_check(uuid,bigint,uuid),public.realm_character_world_allowed(uuid,uuid),public.realm_award_experience(jsonb,integer),public.realm_character_open(uuid,bigint,uuid,uuid),public.realm_character_import(uuid,bigint,uuid,jsonb),public.realm_character_checkpoint(uuid,bigint,uuid,jsonb,numeric,numeric),public.realm_character_event(uuid,bigint,uuid,uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.realm_character_open(uuid,bigint,uuid,uuid),public.realm_character_import(uuid,bigint,uuid,jsonb),public.realm_character_checkpoint(uuid,bigint,uuid,jsonb,numeric,numeric),public.realm_character_event(uuid,bigint,uuid,uuid,uuid,text,jsonb) to authenticated;
commit;
