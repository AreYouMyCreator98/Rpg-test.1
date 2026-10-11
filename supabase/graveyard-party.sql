begin;
create table if not exists public.realm_graveyard_parties(world_id uuid primary key,party_size integer not null check(party_size between 1 and 4));
alter table public.realm_graveyard_parties enable row level security;
revoke all on public.realm_graveyard_parties from public,anon,authenticated;
create or replace function public.realm_character_graveyard_party(character_id uuid,expected_revision bigint,session_id uuid,world_id uuid) returns integer
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;n integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(world_id::text,85));
 c:=public.realm_character_check(character_id,expected_revision,session_id);
 if not public.realm_character_world_allowed(character_id,world_id) then raise exception 'World membership required';end if;
 if not exists(select 1 from public.realm_character_contexts ctx where ctx.character_id=c.id and ctx.world_id=realm_character_graveyard_party.world_id and sqrt((ctx.x-47.8)^2+(ctx.z-150)^2)<45) then raise exception 'Return to the graveyard';end if;
 n:=1;
 if world_id<>character_id then select greatest(1,least(4,count(*)::integer)) into n from public.realm_members m where m.room=world_id and m.touched>clock_timestamp()-interval '45 seconds';end if;
 insert into public.realm_graveyard_parties values(world_id,n) on conflict do nothing;
 select g.party_size into n from public.realm_graveyard_parties g where g.world_id=realm_character_graveyard_party.world_id;
 return n;
end$$;
revoke all on function public.realm_character_graveyard_party(uuid,bigint,uuid,uuid) from public,anon;
grant execute on function public.realm_character_graveyard_party(uuid,bigint,uuid,uuid) to authenticated;
-- Reserve enemies cannot be claimed in solo or outside the locked party encounter.
create or replace function public.realm_guard_graveyard_encounter() returns trigger
language plpgsql security definer set search_path=pg_catalog,public as $$
declare p integer;n integer;
begin
 select (data->'enemies'->new.target->>'prologue')::integer into p from public.realm_game_catalog where id;
 if p>=8 then
  select party_size into n from public.realm_graveyard_parties where world_id=new.world_id;
  if n is null or p>=8*n then raise exception 'Skeleton is not part of this encounter';end if;
 end if;
 return new;
end$$;
revoke all on function public.realm_guard_graveyard_encounter() from public,anon,authenticated;
drop trigger if exists realm_graveyard_encounter_guard on public.realm_encounters;
create trigger realm_graveyard_encounter_guard before insert on public.realm_encounters for each row execute function public.realm_guard_graveyard_encounter();
commit;
