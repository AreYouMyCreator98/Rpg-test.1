"""Generate trusted SQL from the reviewed catalog; never accept browser catalog writes."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'supabase/game-catalog.json').read_text())
encoded=json.dumps(catalog,separators=(',',':')).replace("'","''")
sql="begin;\ninsert into public.realm_game_catalog values(true,'"+encoded+"'::jsonb) on conflict(id) do update set data=excluded.data;\n"
sql+="""insert into public.realm_item_catalog(id,kind,base,rank,sell)
select key,value->>'type',value->>'base',(value->>'rank')::integer,
case when value->>'type'='quest' then 0 else 4+(value->>'rank')::integer*10 end
from public.realm_game_catalog cross join lateral jsonb_each(data->'items')
on conflict(id) do nothing;
commit;
"""
(root/'supabase/game-catalog-seed.sql').write_text(sql)
print('Generated trusted catalog seed:',len(catalog['enemies']),'encounters')
