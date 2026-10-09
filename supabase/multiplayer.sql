-- Run once in the game's Supabase SQL Editor. Enable Anonymous Sign-ins in Auth.
-- These names are isolated from any existing application tables.
begin;
create table if not exists public.realm_rooms (
 id uuid primary key default gen_random_uuid(),
 code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)),
 host uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 40),
 public boolean not null default false,
 touched timestamptz not null default now()
);
create table if not exists public.realm_members (
 room uuid not null references public.realm_rooms(id) on delete cascade,
 uid uuid primary key references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 24),
 touched timestamptz not null default now()
);
alter table public.realm_rooms enable row level security;
alter table public.realm_members enable row level security;
revoke all on public.realm_rooms, public.realm_members from anon, authenticated;

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
 select jsonb_build_object('id',r.id,'code',r.code,'host',r.host,'public',r.public,'players',coalesce(jsonb_agg(jsonb_build_object('id',m.uid,'name',m.name)),'[]'::jsonb)) into result from public.realm_members m where m.room=r.id;
 return result;
end $$;

create or replace function public.realm_create_room(player_name text, is_public boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.realm_rooms;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 -- Serialize concurrent create/join attempts by the same identity.
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 delete from public.realm_rooms where touched<now()-interval '45 seconds';
 delete from public.realm_members where touched<now()-interval '45 seconds';
 if exists(select 1 from public.realm_members where uid=auth.uid()) then raise exception 'Leave your current room first'; end if;
 if (select count(*) from public.realm_rooms)>=100 then raise exception 'Server full; try later'; end if;
 insert into public.realm_rooms(host,name,public) values(auth.uid(),left(coalesce(nullif(trim(player_name),''),'Wanderer'),24)||'’s world',coalesce(is_public,false)) returning * into r;
 insert into public.realm_members(room,uid,name) values(r.id,auth.uid(),left(coalesce(nullif(trim(player_name),''),'Wanderer'),24));
 return public.realm_room_state();
end $$;

create or replace function public.realm_join_room(invite_code text,player_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.realm_rooms;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.realm_members where uid=auth.uid()) then raise exception 'Leave your current room first'; end if;
 select * into r from public.realm_rooms where code=upper(trim(invite_code)) and touched>now()-interval '45 seconds' for update;
 if r.id is null then raise exception 'Room not found or host disconnected'; end if;
 delete from public.realm_members where room=r.id and touched<now()-interval '45 seconds';
 if (select count(*) from public.realm_members where room=r.id)>=4 then raise exception 'Room full (4 players)'; end if;
 insert into public.realm_members(room,uid,name) values(r.id,auth.uid(),left(coalesce(nullif(trim(player_name),''),'Wanderer'),24));
 return public.realm_room_state();
end $$;

create or replace function public.realm_list_rooms() returns jsonb
language sql security definer set search_path = '' as $$
 select coalesce(jsonb_agg(jsonb_build_object('code',r.code,'name',r.name,'count',r.n)),'[]'::jsonb)
 from (select r.code,r.name,count(m.uid) n from public.realm_rooms r join public.realm_members m on m.room=r.id and m.touched>now()-interval '45 seconds'
 where auth.uid() is not null and r.public and r.touched>now()-interval '45 seconds' group by r.id having count(m.uid)<4 order by r.touched desc limit 100) r;
$$;

create or replace function public.realm_leave_room() returns void
language plpgsql security definer set search_path = '' as $$
begin
 delete from public.realm_rooms where host=auth.uid();
 delete from public.realm_members where uid=auth.uid();
end $$;

-- Each sender has a separate private topic. RLS ties WRITE permission to the
-- authenticated sender, so another member cannot impersonate the host.
create or replace function public.realm_topic_allowed(topic text, writing boolean) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.realm_members me
 join public.realm_rooms r on r.id=me.room
 join public.realm_members sender on sender.room=r.id
 where me.uid=auth.uid() and me.touched>now()-interval '45 seconds' and r.touched>now()-interval '45 seconds'
 and topic='realm:'||r.id::text||':'||sender.uid::text
 and (not writing or sender.uid=auth.uid()));
$$;

drop policy if exists realm_broadcast_read on realtime.messages;
create policy realm_broadcast_read on realtime.messages for select to authenticated
 using(public.realm_topic_allowed(realtime.topic(),false));
drop policy if exists realm_broadcast_write on realtime.messages;
create policy realm_broadcast_write on realtime.messages for insert to authenticated
 with check(public.realm_topic_allowed(realtime.topic(),true));

revoke all on function public.realm_room_state(), public.realm_create_room(text,boolean), public.realm_join_room(text,text), public.realm_list_rooms(), public.realm_leave_room(), public.realm_topic_allowed(text,boolean) from public, anon;
grant execute on function public.realm_room_state(), public.realm_create_room(text,boolean), public.realm_join_room(text,text), public.realm_list_rooms(), public.realm_leave_room(), public.realm_topic_allowed(text,boolean) to authenticated;
commit;
