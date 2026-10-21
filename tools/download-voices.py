"""Download only the completed, explicitly generated speech jobs in jobs.json."""
import concurrent.futures
import json
from pathlib import Path
import urllib.request

root = Path(__file__).resolve().parents[1] / 'prototype/assets/voices'
data = json.loads((root / 'jobs.json').read_text(encoding='utf-8'))

def download(item):
    path = root / (item['key'] + '.mp3')
    if not path.exists():
        urllib.request.urlretrieve(item['url'], path)
    return item['key'], path.stat().st_size

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    sizes = list(pool.map(download, data['clips']))
assert all(size > 1000 for _, size in sizes), 'empty audio download'
manifest = {'provider': 'ElevenLabs via Higgsfield', 'model': 'text2speech_v2', 'variant': 'elevenlabs',
            'clips': {c['key']: {'file': c['key'] + '.mp3', 'who': c['who']} for c in data['clips']}}
(root / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Downloaded {len(sizes)} audio clips, {sum(s for _, s in sizes):,} bytes')
