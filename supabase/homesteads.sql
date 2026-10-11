begin;
create table if not exists public.realm_estates(character_id uuid not null references public.realm_characters(id) on delete cascade,kind text not null check(kind in ('home','coop')),data jsonb not null default '{"version":0,"wood":80,"stone":64,"harvestAt":0,"pieces":[]}',primary key(character_id,kind));
create table if not exists public.realm_estate_events(character_id uuid not null references public.realm_characters(id) on delete cascade,kind text not null,request_id uuid not null,primary key(character_id,kind,request_id));
alter table public.realm_estates enable row level security;alter table public.realm_estate_events enable row level security;
revoke all on public.realm_estates,public.realm_estate_events from public,anon,authenticated;
create or replace function public.realm_estate_owner(actor uuid,world uuid,session uuid) returns uuid language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;owner_id uuid;begin
 select * into c from public.realm_characters where id=actor and owner=public.realm_account_uid() and archived_at is null;if not found then raise exception 'Character not found';end if;
 perform public.realm_character_check(c.id,c.revision,session);
 if world=c.id then return c.id;end if;
 select host_member.character_id into owner_id from public.realm_rooms r join public.realm_members host_member on host_member.room=r.id and host_member.uid=r.host join public.realm_members guest on guest.room=r.id and guest.uid=auth.uid() and guest.character_id=c.id where r.id=world and r.persistent and r.touched>clock_timestamp()-interval '45 seconds';
 if owner_id is null then raise exception 'Active party membership required';end if;return owner_id;
end$$;
create or replace function public.realm_estate_read(actor uuid,world uuid,session uuid,base_kind text) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare owner_id uuid;s jsonb;begin
 if base_kind not in ('home','coop') or base_kind is null then raise exception 'Unknown foundation ownership';end if;
 owner_id:=public.realm_estate_owner(actor,world,session);insert into public.realm_estates(character_id,kind) values(owner_id,base_kind) on conflict do nothing;
 select data into s from public.realm_estates where character_id=owner_id and kind=base_kind;return s||jsonb_build_object('owner',owner_id,'canEdit',base_kind='coop' or owner_id=actor);
end$$;
create or replace function public.realm_workshop_apply(s jsonb,op jsonb,builder text,px float8,pz float8,base_kind text,now_ms numeric) returns jsonb language plpgsql set search_path=pg_catalog,public as $$
declare w jsonb:=coalesce(s->'workshop','{"version":1,"packs":{},"nodes":{},"stock":{"logs":0,"rubble":0,"ore":0,"nails":0},"quest":{"status":"available","logs":0,"rubble":0,"wood":0,"stone":0}}');
 p jsonb;q jsonb;v jsonb;r jsonb;recipes jsonb:='{"axe":{"name":"Stone axe","cost":{"wood":4,"stone":2},"tool":"axe","rank":1},"pickaxe":{"name":"Stone pickaxe","cost":{"wood":4,"stone":3},"tool":"pickaxe","rank":1},"timber":{"name":"Saw 8 timber planks","cost":{"logs":2},"output":{"wood":8}},"blocks":{"name":"Dress 6 stone blocks","cost":{"rubble":2},"output":{"stone":6}},"nails":{"name":"Forge 6 iron nails","cost":{"ore":2},"output":{"nails":6}},"ironaxe":{"name":"Iron axe · two-hit felling","cost":{"wood":8,"nails":6},"tool":"axe","rank":2},"ironpick":{"name":"Iron pickaxe · two-hit mining","cost":{"wood":8,"nails":8},"tool":"pickaxe","rank":2}}'::jsonb;
 a text:=op->>'action';k text;material text;tool text;node integer;rank integer;amount integer:=0;balance integer;delta jsonb:='{}';entry record;ox float8;tx float8;tz float8;near_smith boolean:=sqrt((px+7)^2+(pz-58)^2)<4;
begin
 ox:=case when base_kind='home' then -38 else -74 end;tx:=ox+15;tz:=case when a='transfer' then 129 else 133 end;
 if a='gather' then
  node:=(op->>'node')::integer;if node is null or node<0 or node>7 or (op->>'node')::numeric<>node then raise exception 'Unknown resource node';end if;
  tx:=ox+(array[-12,-4,4,12])[mod(node,4)+1];tz:=case when node<4 then 140 else 98 end;
 end if;
 if sqrt((px-tx)^2+(pz-tz)^2)>(case when a='gather' then 3.6 else 4 end) and not (a in ('shelter_accept','shelter_claim') and near_smith) then raise exception 'Move closer to the resource or workstation';end if;
 p:=w#>array['packs',builder];
 if p is null then
  if (select count(*) from jsonb_object_keys(w->'packs'))>=64 then raise exception 'Builder pack limit reached';end if;
  p:='{"tools":{"axe":0,"pickaxe":0},"bag":{"logs":0,"rubble":0,"ore":0,"wood":0,"stone":0,"nails":0},"lastHit":0}';
 end if;q:=w->'quest';
 if a='gather' then
  v:=coalesce(w#>array['nodes',node::text],'{"hits":0,"readyAt":0,"lastHit":0,"looseAt":0}');
  if now_ms-(p->>'lastHit')::numeric<800 then raise exception 'Gathering cooldown';end if;
  if (v->>'readyAt')::numeric>now_ms then raise exception 'Resource is regrowing';end if;
  if (v->>'readyAt')::numeric>0 then v:=v||'{"hits":0,"readyAt":0}';end if;
  tool:=case when node<4 then 'axe' else 'pickaxe' end;material:=case when node<4 then 'logs' when node<6 then 'rubble' else 'ore' end;rank:=(p#>>array['tools',tool])::integer;
  if rank=0 then
   if node>=6 then raise exception 'Craft a pickaxe to mine ore';end if;
   if now_ms-(v->>'looseAt')::numeric<10000 then raise exception 'No loose materials here yet';end if;
   v:=v||jsonb_build_object('looseAt',now_ms);amount:=1;
  else
   v:=v||jsonb_build_object('hits',(v->>'hits')::integer+rank,'lastHit',now_ms);
   if (v->>'hits')::integer>=3 then v:=v||jsonb_build_object('hits',0,'readyAt',now_ms+4320000);amount:=case when node>=6 then 4 else 6 end;end if;
  end if;
  balance:=(p#>>array['bag',material])::integer+amount;if balance>500 then raise exception 'Builder pack is full';end if;
  p:=jsonb_set(p,array['bag',material],to_jsonb(balance))||jsonb_build_object('lastHit',now_ms);
  w:=jsonb_set(w,array['nodes',node::text],v);
  if q->>'status'='active' and material in ('logs','rubble') then q:=jsonb_set(q,array[material],to_jsonb(least(6,(q->>material)::integer+amount)));end if;
 elsif a='craft' then
  r:=recipes->(op->>'recipe');if r is null then raise exception 'Unknown recipe';end if;
  tool:=r->>'tool';
  if tool is not null then
   if (p#>>array['tools',tool])::integer<>(r->>'rank')::integer-1 then raise exception 'Tool already owned or prerequisite missing';end if;
   p:=jsonb_set(p,array['tools',tool],r->'rank');
  end if;
  for entry in select key,value from jsonb_each(r->'cost') loop delta:=delta||jsonb_build_object(entry.key,-(entry.value::text)::integer);end loop;
  for entry in select key,value from jsonb_each(coalesce(r->'output','{}')) loop
   delta:=delta||jsonb_build_object(entry.key,coalesce((delta->>entry.key)::integer,0)+(entry.value::text)::integer);
   if q->>'status'='active' and entry.key in ('wood','stone') then q:=jsonb_set(q,array[entry.key],to_jsonb(least(case when entry.key='wood' then 8 else 6 end,(q->>entry.key)::integer+(entry.value::text)::integer)));end if;
  end loop;
 elsif a='transfer' then
  if op->>'direction' is null or op->>'direction' not in ('deposit','withdraw') or op->>'resource' is null or op->>'resource' not in ('logs','rubble','ore','wood','stone','nails','all') or op->>'resource'='all' and op->>'direction'<>'deposit' then raise exception 'Invalid transfer';end if;
  if op->>'resource'<>'all' and (op->>'qty' is null or (op->>'qty')::numeric<>trunc((op->>'qty')::numeric) or (op->>'qty')::numeric not between 1 and 500) then raise exception 'Invalid transfer quantity';end if;
  for k in select unnest(array['logs','rubble','ore','wood','stone','nails']) loop
   if op->>'resource'<>'all' and k<>op->>'resource' then continue;end if;
   amount:=case when op->>'resource'='all' then (p#>>array['bag',k])::integer else (op->>'qty')::integer end;
   if op->>'direction'='withdraw' then amount:=-amount;end if;
   balance:=(p#>>array['bag',k])::integer-amount;if balance<0 or balance>500 then raise exception 'Insufficient pack supplies or pack full';end if;
   p:=jsonb_set(p,array['bag',k],to_jsonb(balance));delta:=delta||jsonb_build_object(k,amount);
  end loop;
 elsif a='shelter_accept' then
  if q->>'status'<>'available' then raise exception 'Contract already accepted';end if;q:=q||'{"status":"active"}';
 elsif a='shelter_claim' then
  if q->>'status'<>'active' or (q->>'logs')::integer<6 or (q->>'rubble')::integer<6 or (q->>'wood')::integer<8 or (q->>'stone')::integer<6 or not exists(
   select 1 from jsonb_array_elements(s->'pieces') f where f->>'type'='foundation'
   and (select count(distinct part->>'rotation') from jsonb_array_elements(s->'pieces') part where part->>'type' in ('wall','window','door') and part->>'x'=f->>'x' and part->>'z'=f->>'z' and part->>'level'='0')=4
   and (select count(distinct part->>'type') from jsonb_array_elements(s->'pieces') part where part->>'type' in ('door','window','roof') and part->>'x'=f->>'x' and part->>'z'=f->>'z' and part->>'level'='0')=3
  ) then raise exception 'Shelter contract incomplete or already claimed';end if;
  delta:='{"wood":80,"stone":40}';q:=q||'{"status":"claimed"}';
 else raise exception 'Unknown workshop command';end if;
 for entry in select key,value from jsonb_each(delta) loop
  k:=entry.key;balance:=case when k in ('wood','stone') then (s->>k)::integer else coalesce((w#>>array['stock',k])::integer,0) end+(entry.value::text)::integer;
  if balance<0 or balance>500 then raise exception 'Insufficient supplies or storage full';end if;
  if k in ('wood','stone') then s:=jsonb_set(s,array[k],to_jsonb(balance));else w:=jsonb_set(w,array['stock',k],to_jsonb(balance));end if;
 end loop;
 w:=jsonb_set(w,array['packs',builder],p)||jsonb_build_object('quest',q);
 return s||jsonb_build_object('workshop',w);
end$$;
revoke all on function public.realm_workshop_apply(jsonb,jsonb,text,float8,float8,text,numeric) from public,anon,authenticated;

create or replace function public.realm_estate_change(actor uuid,world uuid,session uuid,base_kind text,expected_version integer,request_id uuid,op jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare owner_id uuid;s jsonb;p jsonb;entry jsonb;pieces jsonb;newpieces jsonb;ctx public.realm_character_contexts;action text;typ text;xx integer;zz integer;lev integer;rot integer;wood integer;stone integer;costw integer;costs integer;ox float8;oz float8:=118;wx float8;wz float8;found_piece boolean:=false;support_count integer;now_ms numeric:=extract(epoch from clock_timestamp())*1000;
begin
 if request_id is null or op is null or jsonb_typeof(op)<>'object' or octet_length(op::text)>4096 then raise exception 'Invalid construction command';end if;
 s:=public.realm_estate_read(actor,world,session,base_kind);owner_id:=(s->>'owner')::uuid;
 if not (s->>'canEdit')::boolean then raise exception 'Only the owner may edit a Home Base';end if;
 select data into s from public.realm_estates where character_id=owner_id and kind=base_kind for update;
 if exists(select 1 from public.realm_estate_events e where e.character_id=owner_id and e.kind=base_kind and e.request_id=realm_estate_change.request_id) then return s||jsonb_build_object('owner',owner_id,'canEdit',true);end if;
 if expected_version is null or expected_version<>(s->>'version')::integer then raise exception 'Base changed; refresh before building';end if;
 select * into ctx from public.realm_character_contexts where character_id=actor and world_id=world;if not found then raise exception 'Open the world first';end if;
 ox:=case when base_kind='home' then -38 else -74 end;action:=op->>'action';pieces:=s->'pieces';wood:=(s->>'wood')::integer;stone:=(s->>'stone')::integer;
 if action in ('gather','craft','transfer','shelter_accept','shelter_claim') then
  s:=public.realm_workshop_apply(s,op,actor::text,ctx.x,ctx.z,base_kind,now_ms);wood:=(s->>'wood')::integer;stone:=(s->>'stone')::integer;
 elsif action='harvest' then raise exception 'Supply piles have been replaced by harvesting and workbenches';
 elsif action='place' then
  p:=op->'piece';typ:=p->>'type';xx:=(p->>'x')::integer;zz:=(p->>'z')::integer;lev:=(p->>'level')::integer;rot:=(p->>'rotation')::integer;
  if p is null or jsonb_typeof(p)<>'object' or typ is null or xx is null or zz is null or lev is null or rot is null or not p?&array['id','type','x','z','level','rotation'] or p->>'id'<>request_id::text or typ not in ('foundation','wall','window','door','stairs','floor','roof') or xx not between -3 and 3 or zz not between -3 and 3 or lev not between 0 and 1 or rot not between 0 and 3 or jsonb_array_length(pieces)>=64 or typ in ('foundation','stairs') and lev<>0 or typ='floor' and lev<>1 then raise exception 'Invalid building piece';end if;
  if (p->>'x')::numeric<>xx or (p->>'z')::numeric<>zz or (p->>'level')::numeric<>lev or (p->>'rotation')::numeric<>rot then raise exception 'Use whole grid cells';end if;
  wx:=ox+xx*4;wz:=oz+zz*4;if sqrt((ctx.x-wx)^2+(ctx.z-wz)^2)>16 then raise exception 'Move closer to the building cell';end if;
  for entry in select value from jsonb_array_elements(pieces) loop
   if typ not in ('wall','window','door') and entry->>'type'=typ and (entry->>'x')::integer=xx and (entry->>'z')::integer=zz and (entry->>'level')::integer=lev then raise exception 'Building slot occupied';end if;
   if typ in ('wall','window','door') and entry->>'type' in ('wall','window','door') and (entry->>'level')::integer=lev and mod((entry->>'rotation')::integer,2)=mod(rot,2) and
    (case when mod(rot,2)=0 then (entry->>'x')::integer=xx and (entry->>'z')::integer+case when (entry->>'rotation')::integer=2 then 1 else 0 end=zz+case when rot=2 then 1 else 0 end else (entry->>'z')::integer=zz and (entry->>'x')::integer+case when (entry->>'rotation')::integer=3 then 1 else 0 end=xx+case when rot=3 then 1 else 0 end end) then raise exception 'Wall edge occupied';end if;
  end loop;
  if typ='foundation' then
   if exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='foundation') and not exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='foundation' and abs((q->>'x')::integer-xx)+abs((q->>'z')::integer-zz)=1) then raise exception 'Join an existing foundation';end if;
  else
   if not exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='foundation' and (q->>'x')::integer=xx and (q->>'z')::integer=zz) then raise exception 'Foundation required';end if;
   if lev=1 and typ<>'floor' and not exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='floor' and (q->>'x')::integer=xx and (q->>'z')::integer=zz) then raise exception 'Upper floor required';end if;
   if typ='floor' and exists(select 1 from jsonb_array_elements(pieces) q where (q->>'x')::integer=xx and (q->>'z')::integer=zz and (q->>'type'='stairs' or q->>'type'='roof' and (q->>'level')::integer=0)) or typ='stairs' and exists(select 1 from jsonb_array_elements(pieces) q where (q->>'x')::integer=xx and (q->>'z')::integer=zz and q->>'type'='floor') then raise exception 'Keep the stairwell open and remove lower roofs';end if;
   if typ='floor' and not exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='floor' and abs((q->>'x')::integer-xx)+abs((q->>'z')::integer-zz)=1 or q->>'type'='stairs' and (q->>'x')::integer+case (q->>'rotation')::integer when 1 then -1 when 3 then 1 else 0 end=xx and (q->>'z')::integer+case (q->>'rotation')::integer when 0 then -1 when 2 then 1 else 0 end=zz) then raise exception 'Join the top of stairs or another upper floor';end if;
   if typ='roof' and lev=0 and exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='floor' and (q->>'x')::integer=xx and (q->>'z')::integer=zz) then raise exception 'Use an upper-storey roof';end if;
   if typ='roof' and (select count(*) from jsonb_array_elements(pieces) q where q->>'type' in ('wall','window','door') and (q->>'x')::integer=xx and (q->>'z')::integer=zz and (q->>'level')::integer=lev)<2 then raise exception 'Two supporting walls required';end if;
  end if;
  costw:=case typ when 'foundation' then 12 when 'wall' then 8 when 'window' then 8 when 'door' then 10 when 'stairs' then 14 when 'floor' then 10 else 12 end;
  costs:=case typ when 'foundation' then 8 when 'wall' then 0 when 'floor' then 0 else 2 end;
  if wood<costw or stone<costs then raise exception 'Insufficient building supplies';end if;
  wood:=wood-costw;stone:=stone-costs;pieces:=pieces||jsonb_build_array(jsonb_build_object('id',request_id,'type',typ,'x',xx,'z',zz,'level',lev,'rotation',rot,'open',false));
 elsif action in ('remove','door') then
  select value into p from jsonb_array_elements(pieces) where value->>'id'=op->>'id';if p is null then raise exception 'Piece no longer exists';end if;
  typ:=p->>'type';xx:=(p->>'x')::integer;zz:=(p->>'z')::integer;lev:=(p->>'level')::integer;
  if sqrt((ctx.x-ox-xx*4)^2+(ctx.z-oz-zz*4)^2)>16 then raise exception 'Move closer to the piece';end if;
  if action='door' then if typ<>'door' then raise exception 'Choose a door';end if;p:=p||jsonb_build_object('open',not (p->>'open')::boolean);select coalesce(jsonb_agg(case when value->>'id'=p->>'id' then p else value end),'[]') into pieces from jsonb_array_elements(pieces);
  else
   if typ='foundation' and exists(select 1 from jsonb_array_elements(pieces) q where q->>'id'<>p->>'id' and (q->>'x')::integer=xx and (q->>'z')::integer=zz) or typ='floor' and exists(select 1 from jsonb_array_elements(pieces) q where q->>'id'<>p->>'id' and (q->>'x')::integer=xx and (q->>'z')::integer=zz and (q->>'level')::integer=1) or typ='stairs' and exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='floor') then raise exception 'Remove supported pieces first';end if;
   if typ in ('wall','window','door') and exists(select 1 from jsonb_array_elements(pieces) q where q->>'type'='roof' and (q->>'x')::integer=xx and (q->>'z')::integer=zz and (q->>'level')::integer=lev) and (select count(*) from jsonb_array_elements(pieces) q where q->>'type' in ('wall','window','door') and (q->>'x')::integer=xx and (q->>'z')::integer=zz and (q->>'level')::integer=lev)<=2 then raise exception 'Remove supported roof first';end if;
   wood:=least(500,wood+case typ when 'foundation' then 6 when 'wall' then 4 when 'window' then 4 when 'door' then 5 when 'stairs' then 7 when 'floor' then 5 else 6 end);stone:=least(500,stone+case typ when 'foundation' then 4 when 'wall' then 0 when 'floor' then 0 else 1 end);select coalesce(jsonb_agg(value),'[]') into pieces from jsonb_array_elements(pieces) where value->>'id'<>p->>'id';
  end if;
 else raise exception 'Unknown construction action';end if;
 s:=s||jsonb_build_object('version',(s->>'version')::integer+1,'wood',wood,'stone',stone,'pieces',pieces);
 update public.realm_estates set data=s where character_id=owner_id and kind=base_kind;insert into public.realm_estate_events values(owner_id,base_kind,request_id);
 return s||jsonb_build_object('owner',owner_id,'canEdit',true);
end$$;
revoke all on function public.realm_estate_owner(uuid,uuid,uuid),public.realm_estate_read(uuid,uuid,uuid,text),public.realm_estate_change(uuid,uuid,uuid,text,integer,uuid,jsonb) from public,anon;
grant execute on function public.realm_estate_read(uuid,uuid,uuid,text),public.realm_estate_change(uuid,uuid,uuid,text,integer,uuid,jsonb) to authenticated;
commit;
