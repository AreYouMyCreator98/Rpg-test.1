"""Validate and copy static files verbatim; both local and Pages bytes stay identical.
Before a runtime release, rotate the shared ?v= identity in HTML and module URLs.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = ['resource-visuals.js', 'world-resources.js', 'combat-balance.js', 'world-weather.js', 'settlement-life.js', 'stronghold-art.js', 'boss-arenas.js', 'village-art.js', 'cinematic.js', 'hero-detail.js', 'assets/models/goblin_scout_lod.glb', 'assets/models/goblin_scout.glb', 'river-details.js', 'environment-life.js', 'graphics.js', 'terrain-stream.js', 'emerald-landscape.js', 'emerald-vale.js', 'assets/environment/emerald-library.glb', 'environment-art.js', 'account-storage.js', 'scout-model.js', 'assets/goblin-scout.gltf', 'gathering.js', 'gathering-rules.js', 'scene-batch.js', 'homestead.js', 'building-rules.js', 'prologue.js', 'accounts.js', 'supabase/game-catalog.json', 'expansion-data.js', 'expansion-models.js', 'expansion-world.js', 'companions.js', 'progression.js', 'adventure-motion.js', 'index.html', 'visual-world.js', 'ui.css', 'ui.js', 'frontier.js', 'living-world.js',
         'multiplayer.js', 'multiplayer-config.js', 'supabase-rooms.js']
html = (ROOT / 'index.html').read_text()
match = re.search(r'ui\.css\?v=([a-zA-Z0-9-]+)', html)
if not match:
    raise ValueError('The interface stylesheet needs a release identity')
release = match.group(1)
output = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
output.mkdir(parents=True, exist_ok=True)
for name in FILES:
    source = (ROOT / name).read_text() if not name.endswith('.glb') else ''
    for url in re.findall(r"(?:from\s+|import\()\s*['\"]\./([^'\"]+)['\"]", source):
        if url.split('?')[0] not in FILES or not url.endswith('?v=' + release):
            raise ValueError(f'{name}: unversioned or inconsistent dependency {url}')
    (output / name).parent.mkdir(parents=True, exist_ok=True)
    (output / name).write_bytes((ROOT / name).read_bytes())
if f"release='{release}'" not in (ROOT / 'frontier.js').read_text():
    raise ValueError('Legacy recovery must use the current release identity')
print(f'Validated {len(FILES)} static files with release identity {release}')
