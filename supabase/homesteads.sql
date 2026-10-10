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
 if action='harvest' then
  if sqrt((ctx.x-ox-15)^2+(ctx.z-oz-15)^2)>4 then raise exception 'Visit the supply pile';end if;
  if now_ms-(s->>'harvestAt')::numeric<5000 then raise exception 'Supply pile is replenishing';end if;
  wood:=least(500,wood+24);stone:=least(500,stone+12);s:=s||jsonb_build_object('harvestAt',now_ms);
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
