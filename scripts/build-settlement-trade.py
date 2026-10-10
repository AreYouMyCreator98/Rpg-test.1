"""Build a reviewed, transactional migration; never writes to a live database."""
import json, sys
from pathlib import Path
shops=json.loads(Path(sys.argv[1] if len(sys.argv)>1 else 'supabase/settlement-trade.json').read_text())
Path('supabase/settlement-trade.json').write_text(json.dumps(shops,indent=2)+'\n')
old="if action in ('buy','upgrade','sell') then select value into entry from jsonb_array_elements(cat->'npcs') where value->>'id'=case when action='upgrade' or action='buy' and left(item_id,1)='w' then 'smith' else 'merchant' end;if sqrt((px-(entry->>'x')::float8)^2+(pz-(entry->>'z')::float8)^2)>5 then raise exception 'Visit the appropriate shop';end if;end if;"
new="""if action in ('buy','upgrade','sell') then
 if coalesce(body->>'vendor','') not in ('','smith','merchant') then
  if not public.realm_regional_vendor_allowed(body->>'vendor',case when action='upgrade' or action='buy' and left(item_id,1)='w' then 'smith' else 'merchant' end,px,pz) then raise exception 'Visit the appropriate regional shop';end if;
 else
  select value into entry from jsonb_array_elements(cat->'npcs') where value->>'id'=case when action='upgrade' or action='buy' and left(item_id,1)='w' then 'smith' else 'merchant' end;
  if entry is null or sqrt((px-(entry->>'x')::float8)^2+(pz-(entry->>'z')::float8)^2)>5 then raise exception 'Visit the appropriate shop';end if;
 end if;
end if;"""
sql="""-- Run once in Supabase SQL Editor. Atomic and safe to rerun. No character data changes.
begin;
create or replace function public.realm_regional_vendor_allowed(vendor text,kind text,px float8,pz float8) returns boolean
language plpgsql immutable set search_path=pg_catalog,public as $fn$
declare shops jsonb:= $data$"""+json.dumps(shops,separators=(',',':'))+"""$data$::jsonb;s jsonb;a jsonb;b jsonb;i integer;ax float8;az float8;bx float8;bz float8;t float8;begin
 if px is null or pz is null or px::text in ('NaN','Infinity','-Infinity') or pz::text in ('NaN','Infinity','-Infinity') then return false;end if;
 select value into s from jsonb_array_elements(shops) where value->>'id'=vendor and value->>'role'=kind;
 if s is null then return false;end if;
 if jsonb_array_length(s->'points')=1 then a:=s#>'{points,0}';return sqrt((px-(a->>0)::float8)^2+(pz-(a->>1)::float8)^2)<5;end if;
 -- Caravans may detour around trees/housing within the reviewed trade corridor.
 for i in 0..jsonb_array_length(s->'points')-1 loop
 a:=s->'points'->i;b:=s->'points'->((i+1)%jsonb_array_length(s->'points'));
 ax:=(a->>0)::float8;az:=(a->>1)::float8;bx:=(b->>0)::float8;bz:=(b->>1)::float8;
 t:=greatest(0,least(1,((px-ax)*(bx-ax)+(pz-az)*(bz-az))/greatest(.0001,(bx-ax)^2+(bz-az)^2)));
 if sqrt((px-ax-t*(bx-ax))^2+(pz-az-t*(bz-az))^2)<12 then return true;end if;
 end loop;return false;
end;$fn$;
revoke all on function public.realm_regional_vendor_allowed(text,text,float8,float8) from public,anon,authenticated;
do $migration$
declare definition text;begin
 definition:=pg_get_functiondef('public.realm_character_event(uuid,bigint,uuid,uuid,uuid,text,jsonb)'::regprocedure);
 if strpos(definition,'realm_regional_vendor_allowed')=0 then
  if strpos(definition,$old$"""+old+"""$old$)=0 then raise exception 'Unsupported character runtime: migration made no changes';end if;
  definition:=replace(definition,$old$"""+old+"""$old$,$new$"""+new+"""$new$);execute definition;
 end if;
end;$migration$;
create or replace function public.realm_settlement_trade_ready() returns integer language sql stable as $$select 1$$;
revoke all on function public.realm_settlement_trade_ready() from public,anon;
grant execute on function public.realm_settlement_trade_ready() to authenticated;
commit;
"""
Path('supabase/settlement-trade.sql').write_text(sql)
