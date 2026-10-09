"""Stage the static game with one cache identity per GitHub deployment.
No application compilation or package installation. Direct file hosting still works.
"""
import os
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
FILES = ['index.html', 'ui.css', 'ui.js', 'frontier.js', 'living-world.js',
         'multiplayer.js', 'multiplayer-config.js', 'supabase-rooms.js']
TOKEN = 'realm-release-20261010-2'
release = os.environ.get('GITHUB_SHA', TOKEN)
if not re.fullmatch(r'[a-zA-Z0-9-]+', release):
    raise ValueError('Invalid release identifier')
output = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '_site')
output.mkdir(parents=True, exist_ok=True)
for name in FILES:
    (output / name).write_text((ROOT / name).read_text().replace(TOKEN, release))
print(f'Staged {len(FILES)} static files with release identity {release}')
