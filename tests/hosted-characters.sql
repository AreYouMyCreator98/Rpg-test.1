-- Transactional hosted-schema checks. All fixtures and temporary helpers roll back.
begin;
create temporary table realm_test_fixture(owner_id uuid,other_id uuid,character_id uuid,session_id uuid,request_id uuid);
insert into realm_test_fixture values(gen_random_uuid(),gen_random_uuid(),null,gen_random_uuid(),gen_random_uuid());
insert into auth.users(id) select owner_id from realm_test_fixture union all select other_id from realm_test_fixture;
grant select,update on realm_test_fixture to authenticated;
create function pg_temp.realm_assert(ok boolean,message text) returns void language plpgsql as $$begin if ok is distinct from true then raise exception 'FAILED: %',message;end if;end$$;
create function pg_temp.realm_denied(command text,expected text) returns void language plpgsql as $$
begin
 begin execute command;exception when others then if position(expected in sqlerrm)>0 then return;else raise;end if;end;
 raise exception 'FAILED: unauthorized command succeeded';
end$$;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','is_anonymous',false)::text,true) from realm_test_fixture;
set local role authenticated;
update realm_test_fixture set character_id=(public.realm_character_create('Hosted rollback test',1)).id;
select pg_temp.realm_assert((select count(*)=1 from public.realm_characters),'owner character visible');
select public.realm_character_acquire(character_id,1,session_id) from realm_test_fixture;
select pg_temp.realm_assert((public.realm_character_command(character_id,1,session_id,request_id,'buy','{"id":"w1"}')).progression->>'coins'='15','server price applied') from realm_test_fixture;
select pg_temp.realm_assert((public.realm_character_command(character_id,1,session_id,request_id,'buy','{"id":"w1"}')).revision=2,'retry does not charge twice') from realm_test_fixture;
select pg_temp.realm_denied(format('select public.realm_character_command(%L,2,%L,%L,''buy'',''{"id":"w2"}'')',character_id,session_id,gen_random_uuid()),'Insufficient') from realm_test_fixture;
select pg_temp.realm_denied(format('select public.realm_character_acquire(%L,2,%L)',character_id,gen_random_uuid()),'already active') from realm_test_fixture;
select pg_temp.realm_denied('update public.realm_characters set progression=''{}''','permission denied');
select pg_temp.realm_denied('delete from public.realm_character_commands','permission denied');
select pg_temp.realm_assert((select count(*)=1 from public.realm_character_revisions),'backup recorded');
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated','is_anonymous',false)::text,true) from realm_test_fixture;
select pg_temp.realm_assert((select count(*)=0 from public.realm_characters),'other owner cannot read character');
select pg_temp.realm_assert((select count(*)=0 from public.realm_character_revisions),'other owner cannot read backup');
select pg_temp.realm_assert((select count(*)=0 from public.realm_character_commands),'other owner cannot read ledger');
select pg_temp.realm_denied(format('select public.realm_character_command(%L,2,%L,%L,''buy'',''{"id":"potion"}'')',character_id,session_id,gen_random_uuid()),'not found') from realm_test_fixture;
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated','is_anonymous',true)::text,true) from realm_test_fixture;
select pg_temp.realm_denied('select public.realm_character_create(''Anonymous'',1)','email account');
rollback;
select 'PASS hosted owner isolation, protected economy, replay rejection, exclusive lease, backups and anonymous rejection; fixtures rolled back' as result;
