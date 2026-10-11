-- Apply after persistent-rooms.sql and character-runtime.sql. Existing positions are preserved.
begin;
alter table public.realm_members add column if not exists spawn_slot integer;
with slots as (select m.uid,row_number() over(partition by m.room order by (m.uid=r.host) desc,m.uid)-1 as slot from public.realm_members m join public.realm_rooms r on r.id=m.room)
update public.realm_members m set spawn_slot=s.slot from slots s where s.uid=m.uid and m.spawn_slot is null;
create unique index if not exists realm_member_spawn_slot on public.realm_members(room,spawn_slot);
create or replace function public.realm_assign_spawn_slot() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
begin
 perform 1 from public.realm_rooms where id=new.room for update;
 select s into new.spawn_slot from generate_series(0,3) s where not exists(select 1 from public.realm_members m where m.room=new.room and m.spawn_slot=s) order by s limit 1;
 if new.spawn_slot is null then raise exception 'Room full (4 players)';end if;
 return new;
end$$;
revoke all on function public.realm_assign_spawn_slot() from public,anon,authenticated;
drop trigger if exists realm_member_spawn on public.realm_members;
create trigger realm_member_spawn before insert on public.realm_members for each row execute function public.realm_assign_spawn_slot();
create or replace function public.realm_room_state() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.realm_rooms; result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 select rr.* into r from public.realm_rooms rr join public.realm_members m on m.room=rr.id where m.uid=auth.uid();
 if r.id is null then return null; end if;
 if r.touched < now()-interval '45 seconds' then delete from public.realm_rooms where id=r.id; return null; end if;
 update public.realm_members set touched=now() where uid=auth.uid();
 if r.host=auth.uid() then update public.realm_rooms set touched=now() where id=r.id; end if;
 delete from public.realm_members where room=r.id and touched<now()-interval '45 seconds';
 select jsonb_build_object('id',r.id,'code',r.code,'host',r.host,'public',r.public,'persistent',r.persistent,'players',coalesce(jsonb_agg(jsonb_build_object('id',m.uid,'name',m.name,'slot',m.spawn_slot)),'[]'::jsonb)) into result from public.realm_members m where m.room=r.id;
 return result;
end $$;

create or replace function public.realm_character_open(character_id uuid,expected_revision bigint,session_id uuid,world_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;pos jsonb;begin
 c:=public.realm_character_acquire(character_id,expected_revision,session_id);
 if not public.realm_character_world_allowed(c.id,world_id) then raise exception 'World membership required';end if;
 pos:=case when world_id=c.id then c.solo_world->'position' else jsonb_build_object('x',46+2*coalesce((select m.spawn_slot from public.realm_members m where m.uid=auth.uid() and m.room=world_id),0),'z',153.5) end;
 insert into public.realm_character_contexts(character_id,world_id,x,z) values(c.id,world_id,coalesce((pos->>'x')::float8,0),coalesce((pos->>'z')::float8,64)) on conflict do nothing;
 if world_id<>c.id then update public.realm_character_contexts ctx set room_grace_until=clock_timestamp()+interval '90 seconds' where ctx.character_id=c.id and ctx.world_id=realm_character_open.world_id;end if;
 return jsonb_build_object('character',to_jsonb(c),'position',(select jsonb_build_object('x',ctx.x,'z',ctx.z) from public.realm_character_contexts ctx where ctx.character_id=c.id and ctx.world_id=realm_character_open.world_id),'serverTime',extract(epoch from clock_timestamp())*1000,'encounters',(select coalesce(jsonb_agg(to_jsonb(e)||jsonb_build_object('damage',(select coalesce(sum(h.damage),0) from public.realm_encounter_hits h where h.character_id=c.id and h.world_id=e.world_id and h.target=e.target and h.generation=e.generation))),'[]') from public.realm_encounters e where e.world_id=realm_character_open.world_id),'credits',(select coalesce(jsonb_agg(to_jsonb(ec)),'[]') from public.realm_encounter_credit ec where ec.character_id=c.id and ec.world_id=realm_character_open.world_id),'uniqueItems',(select coalesce(jsonb_agg(u.item_id),'[]') from public.realm_character_unique_items u where u.character_id=c.id),'bounties',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.realm_character_bounties b where b.character_id=c.id));
end$$;

commit;
