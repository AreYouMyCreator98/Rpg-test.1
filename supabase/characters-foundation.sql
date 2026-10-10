-- Stage 3 database foundation. NOT a complete cloud-save/reward implementation.
-- The browser cannot write protected character progression. Apply only after review.
-- Existing realm_rooms / realm_members / Realtime policies are unchanged.
begin;
create table if not exists public.realm_characters (
 id uuid primary key default gen_random_uuid(), owner uuid not null references auth.users(id) on delete cascade,
 slot smallint not null check(slot between 1 and 5), name text not null check(char_length(name) between 1 and 24),
 revision bigint not null default 1 check(revision>0), schema_version integer not null default 3 check(schema_version=3),
 progression jsonb not null default '{"level":1,"xp":0,"hp":100,"maxHp":100,"stamina":150,"maxStamina":150,"coins":45,"inventory":[{"id":"w0","qty":1},{"id":"a0","qty":1},{"id":"potion","qty":5}],"weapon":"w0","armour":"a0","attributes":{"strength":0,"vitality":0,"endurance":0,"dexterity":0,"fortitude":0},"skills":[],"pets":[],"mounts":[]}'::jsonb,
 solo_world jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), archived_at timestamptz
);
create unique index if not exists realm_character_slot on public.realm_characters(owner,slot) where archived_at is null;
create table if not exists public.realm_character_leases (
 character_id uuid primary key references public.realm_characters(id) on delete cascade,
 session_id uuid not null, expires_at timestamptz not null
);
create table if not exists public.realm_character_revisions (
 character_id uuid not null references public.realm_characters(id) on delete cascade,
 revision bigint not null, progression jsonb not null, solo_world jsonb not null,
 created_at timestamptz not null default now(), primary key(character_id,revision)
);
alter table public.realm_characters enable row level security;
alter table public.realm_character_leases enable row level security;
alter table public.realm_character_revisions enable row level security;
revoke all on public.realm_characters,public.realm_character_leases,public.realm_character_revisions from public,anon,authenticated;
grant select on public.realm_characters,public.realm_character_revisions to authenticated;
drop policy if exists realm_character_owner_read on public.realm_characters;
create policy realm_character_owner_read on public.realm_characters for select to authenticated using(owner=auth.uid());
drop policy if exists realm_character_backup_owner_read on public.realm_character_revisions;
create policy realm_character_backup_owner_read on public.realm_character_revisions for select to authenticated using(exists(select 1 from public.realm_characters c where c.id=character_id and c.owner=auth.uid()));

create or replace function public.realm_account_uid() returns uuid
language plpgsql stable security definer set search_path=pg_catalog,public as $$
begin
 if auth.uid() is null or coalesce((auth.jwt()->>'is_anonymous')::boolean,true) then raise exception 'An email account is required'; end if;
 return auth.uid();
end $$;

create or replace function public.realm_character_create(character_name text,requested_slot integer) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); result public.realm_characters;
begin
 perform pg_advisory_xact_lock(hashtextextended(uid::text,73));
 if requested_slot not between 1 and 5 or requested_slot is null or character_name is null or char_length(btrim(character_name)) not between 1 and 24 then raise exception 'Invalid character name or slot'; end if;
 insert into public.realm_characters(owner,slot,name) values(uid,requested_slot,btrim(character_name)) returning * into result;
 return result;
end $$;

create or replace function public.realm_character_rename(character_id uuid,expected_revision bigint,character_name text) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); result public.realm_characters;
begin
 select * into result from public.realm_characters c where c.id=character_id and c.owner=uid and c.archived_at is null for update;
 if not found then raise exception 'Character not found'; end if;
 if expected_revision is null or result.revision<>expected_revision then raise exception 'Revision conflict'; end if;
 if character_name is null or char_length(btrim(character_name)) not between 1 and 24 then raise exception 'Invalid character name'; end if;
 if exists(select 1 from public.realm_character_leases l where l.character_id=result.id and l.expires_at>clock_timestamp()) then raise exception 'Character is active'; end if;
 update public.realm_characters c set name=btrim(character_name),revision=c.revision+1,updated_at=clock_timestamp() where c.id=result.id returning * into result;
 return result;
end $$;

create or replace function public.realm_character_archive(character_id uuid,expected_revision bigint) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); c public.realm_characters;
begin
 select * into c from public.realm_characters r where r.id=character_id and r.owner=uid and r.archived_at is null for update;
 if not found then raise exception 'Character not found'; end if;
 if expected_revision is null or c.revision<>expected_revision then raise exception 'Revision conflict'; end if;
 if exists(select 1 from public.realm_character_leases l where l.character_id=c.id and l.expires_at>clock_timestamp()) then raise exception 'Character is active'; end if;
 insert into public.realm_character_revisions(character_id,revision,progression,solo_world) values(c.id,c.revision,c.progression,c.solo_world) on conflict do nothing;
 update public.realm_characters r set archived_at=clock_timestamp(),updated_at=clock_timestamp(),revision=r.revision+1 where r.id=c.id;
end $$;

create or replace function public.realm_character_acquire(character_id uuid,expected_revision bigint,session_id uuid) returns public.realm_characters
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); c public.realm_characters; lease public.realm_character_leases;
begin
 if session_id is null then raise exception 'Session ID required'; end if;
 select * into c from public.realm_characters r where r.id=character_id and r.owner=uid and r.archived_at is null for update;
 if not found then raise exception 'Character not found'; end if;
 if expected_revision is null or c.revision<>expected_revision then raise exception 'Revision conflict'; end if;
 select * into lease from public.realm_character_leases l where l.character_id=c.id;
 if found and lease.expires_at>clock_timestamp() and lease.session_id<>session_id then raise exception 'Character already active'; end if;
 insert into public.realm_character_leases as l(character_id,session_id,expires_at) values(c.id,session_id,clock_timestamp()+interval '90 seconds') on conflict on constraint realm_character_leases_pkey do update set session_id=excluded.session_id,expires_at=excluded.expires_at;
 return c;
end $$;

create or replace function public.realm_character_release(character_id uuid,session_id uuid) returns void
language plpgsql security definer set search_path=pg_catalog,public as $$
declare uid uuid:=public.realm_account_uid(); c public.realm_characters;
begin
 select * into c from public.realm_characters r where r.id=character_id and r.owner=uid for update;
 if not found then raise exception 'Character not found'; end if;
 delete from public.realm_character_leases l where l.character_id=c.id and l.session_id=realm_character_release.session_id;
end $$;

-- Explicit grants: no arbitrary JSON save/reward function is exposed to clients.
revoke all on function public.realm_account_uid() from public,anon,authenticated;
revoke all on function public.realm_character_create(text,integer),public.realm_character_rename(uuid,bigint,text),public.realm_character_archive(uuid,bigint),public.realm_character_acquire(uuid,bigint,uuid),public.realm_character_release(uuid,uuid) from public,anon,authenticated;
grant execute on function public.realm_character_create(text,integer),public.realm_character_rename(uuid,bigint,text),public.realm_character_archive(uuid,bigint),public.realm_character_acquire(uuid,bigint,uuid),public.realm_character_release(uuid,uuid) to authenticated;
commit;
