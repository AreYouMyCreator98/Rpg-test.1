-- Future characters start in the Unmarked Graves. No existing rows are changed.
begin;
alter table public.realm_characters alter column solo_world set default '{"position":{"x":50,"z":151},"living":{"prologue":{"version":1,"stage":0,"read":false,"killed":[]}}}'::jsonb;
commit;
