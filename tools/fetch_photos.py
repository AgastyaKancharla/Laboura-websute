# Downloads Pexels photos listed in tools/photos.json into img/cand/<role>-<id>.webp (max 1000px, webp q74).
import json, io, os, sys, urllib.request
from PIL import Image
os.makedirs('img/cand', exist_ok=True)
ids = json.load(open('tools/photos.json'))
bad = []
for role, lst in ids.items():
    for pid in lst:
        out = f'img/cand/{role}-{pid}.webp'
        if os.path.exists(out): continue
        url = f'https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1400'
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 laboura-site-build'})
            data = urllib.request.urlopen(req, timeout=60).read()
            im = Image.open(io.BytesIO(data)).convert('RGB')
            im.thumbnail((1000, 1000), Image.LANCZOS)
            im.save(out, 'WEBP', quality=74, method=6)
            print('ok', out, im.size, os.path.getsize(out))
        except Exception as e:
            bad.append((role, pid, str(e))); print('FAIL', role, pid, e)
print('failed', len(bad))
