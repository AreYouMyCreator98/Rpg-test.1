"""Supabase Management check; token stays in its scoped HTTPS Authorization header.
Default: test the installed schema in a rollback transaction.
--apply: install the two additive Stage 3 migrations first. Does not enable game accounts.
"""
import argparse
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://api.supabase.com/v1/projects/dvntscsqpzecughxcnhm'


def query(sql):
    token = os.environ.get('SUPABASE_ACCESS_TOKEN')
    if not token:
        raise RuntimeError('SUPABASE_ACCESS_TOKEN is unavailable')
    request = urllib.request.Request(BASE + '/database/query',
        data=json.dumps({'query': sql}).encode(),
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        # Never dump credentials, headers, or database records into logs.
        raise RuntimeError('Hosted database request failed: HTTP ' + str(error.code)) from None


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    if args.apply:
        for name in ['characters-foundation.sql', 'character-commands.sql']:
            query((ROOT / 'supabase' / name).read_text())
            print('Applied ' + name)
    result = query((ROOT / 'tests/hosted-characters.sql').read_text())
    if not any(str(row.get('result', '')).startswith('PASS hosted') for row in result):
        raise RuntimeError('Hosted test did not return its success marker')
    print(result[-1]['result'])
