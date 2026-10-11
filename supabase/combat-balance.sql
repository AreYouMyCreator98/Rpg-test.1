-- Update only the relevant expressions, retaining installed trading/security patches.
begin;
do $$
declare f record; source text;
begin
 for f in select oid from pg_proc where pronamespace='public'::regnamespace and proname in ('realm_award_experience','realm_character_command','realm_character_import') loop
 source:=pg_get_functiondef(f.oid);
 source:=replace(source,'required:=45+(level_no-1)*25+greatest(0,level_no-20)^2*5;','required:=2*(45+(level_no-1)*25+greatest(0,level_no-20)^2*5);');
 source:=replace(source,'''skillPoints'',level_no-1-jsonb_array_length','''skillPoints'',(level_no-1)*3-jsonb_array_length');
 source:=replace(source,'jsonb_array_length(skills)>=level_no-1','jsonb_array_length(skills)>=(level_no-1)*3');
 source:=replace(source,'jsonb_array_length(p->''skills'')>(p->>''level'')::integer-1','jsonb_array_length(p->''skills'')>((p->>''level'')::integer-1)*3');
 execute source;
 end loop;
end$$;
commit;
