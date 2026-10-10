begin;
alter table public.realm_rooms add column if not exists persistent boolean not null default false;
alter table public.realm_members add column if not exists character_id uuid references public.realm_characters(id);
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
 select jsonb_build_object('id',r.id,'code',r.code,'host',r.host,'public',r.public,'persistent',r.persistent,'players',coalesce(jsonb_agg(jsonb_build_object('id',m.uid,'name',m.name)),'[]'::jsonb)) into result from public.realm_members m where m.room=r.id;
 return result;
end $$;

create or replace function public.realm_join_room(invite_code text,player_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare r public.realm_rooms;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.realm_members where uid=auth.uid()) then raise exception 'Leave your current room first'; end if;
 select * into r from public.realm_rooms where code=upper(trim(invite_code)) and touched>now()-interval '45 seconds' for update;
 if r.persistent then raise exception 'Choose an account adventurer to join this world';end if;
 if r.id is null then raise exception 'Room not found or host disconnected'; end if;
 delete from public.realm_members where room=r.id and touched<now()-interval '45 seconds';
 if (select count(*) from public.realm_members where room=r.id)>=4 then raise exception 'Room full (4 players)'; end if;
 insert into public.realm_members(room,uid,name) values(r.id,auth.uid(),left(coalesce(nullif(trim(player_name),''),'Wanderer'),24));
 return public.realm_room_state();
end $$;


create or replace function public.realm_create_character_room(player_name text,is_public boolean,character_id uuid,session_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;r jsonb;begin
 select * into c from public.realm_characters ch where ch.id=character_id and ch.owner=public.realm_account_uid() and ch.archived_at is null;
 if not found then raise exception 'Character not found';end if;
 perform public.realm_character_check(c.id,c.revision,session_id);
 r:=public.realm_create_room(player_name,is_public);
 update public.realm_rooms rr set persistent=true where rr.id=(r->>'id')::uuid;
 update public.realm_members m set character_id=c.id where m.uid=auth.uid();return public.realm_room_state();end$$;
create or replace function public.realm_join_character_room(invite_code text,player_name text,character_id uuid,session_id uuid) returns jsonb
language plpgsql security definer set search_path=pg_catalog,public as $$
declare c public.realm_characters;r public.realm_rooms;begin
 select * into c from public.realm_characters ch where ch.id=character_id and ch.owner=public.realm_account_uid() and ch.archived_at is null;
 if not found then raise exception 'Character not found';end if;perform public.realm_character_check(c.id,c.revision,session_id);
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 if exists(select 1 from public.realm_members m where m.uid=auth.uid()) then raise exception 'Leave your current room first';end if;
 select * into r from public.realm_rooms rr where rr.code=upper(trim(invite_code)) and rr.touched>clock_timestamp()-interval '45 seconds' for update;
 if not found or not r.persistent then raise exception 'This is not a persistent-character room';end if;
 delete from public.realm_members m where m.room=r.id and m.touched<clock_timestamp()-interval '45 seconds';
 if (select count(*) from public.realm_members m where m.room=r.id)>=4 then raise exception 'Room full (4 players)';end if;
 insert into public.realm_members(room,uid,name,character_id) values(r.id,auth.uid(),left(coalesce(nullif(trim(player_name),''),'Wanderer'),24),c.id);return public.realm_room_state();end$$;
create or replace function public.realm_character_world_allowed(character_id uuid,world_id uuid) returns boolean
language sql stable security definer set search_path=pg_catalog,public as $$select world_id=character_id or exists(select 1 from public.realm_character_contexts ctx where ctx.character_id=realm_character_world_allowed.character_id and ctx.world_id=realm_character_world_allowed.world_id and ctx.room_grace_until>clock_timestamp()) or exists(select 1 from public.realm_members m join public.realm_rooms r on r.id=m.room where m.uid=auth.uid() and m.character_id=realm_character_world_allowed.character_id and m.room=world_id and r.persistent and r.touched>clock_timestamp()-interval '45 seconds')$$;
revoke all on function public.realm_create_character_room(text,boolean,uuid,uuid),public.realm_join_character_room(text,text,uuid,uuid) from public,anon;
grant execute on function public.realm_create_character_room(text,boolean,uuid,uuid),public.realm_join_character_room(text,text,uuid,uuid) to authenticated;
commit;
