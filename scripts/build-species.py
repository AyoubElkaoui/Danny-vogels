# Bouwt public/species.json uit de IOC Multilingual list + iNaturalist-populariteit.
# Gebruik: python3 scripts/build-species.py <ioc.xlsx> <map-met-inat-json>
import json, sys, glob, os, re, openpyxl

ioc, inatdir, out = sys.argv[1], sys.argv[2], sys.argv[3]
wb = openpyxl.load_workbook(ioc, read_only=True)
rows = list(wb['List'].iter_rows(values_only=True))
hdr = rows[0]
ci = {h: i for i, h in enumerate(hdr)}
SCI, NL, EN, FAM = ci[[h for h in hdr if h and str(h).startswith('IOC')][0]], ci['Dutch'], ci['English'], ci['Family']

def ranks(prefix):
    r, n = {}, 0
    for f in sorted(glob.glob(os.path.join(inatdir, f'{prefix}_*.json'))):
        for x in json.load(open(f))['results']:
            t = x['taxon']; n += 1
            r.setdefault(t['name'], (n, t.get('default_photo')))
    return r, n

nl, nn = ranks('inat_nl'); eu, ne = ranks('inat_eu'); wo, nw = ranks('inat_world')

def norm(r, n, sci):
    return (1 - (r[sci][0] - 1) / n) if sci in r else 0

def photo(p):
    if not p: return ''
    u = p.get('medium_url') or p.get('url') or ''
    m = re.match(r'https://inaturalist-open-data\.s3\.amazonaws\.com/photos/(\d+)/\w+\.(\w+)', u)
    if m: return f'o{m.group(1)}.{m.group(2)}'
    m = re.match(r'https://static\.inaturalist\.org/photos/(\d+)/\w+\.(\w+)', u)
    if m: return f's{m.group(1)}.{m.group(2)}'
    return ''

fams, famidx, out_s = [], {}, []
for r in rows[1:]:
    sci = r[SCI]
    if not sci: continue
    fam = r[FAM] or ''
    if fam not in famidx: famidx[fam] = len(fams); fams.append(fam)
    score = 0.55 * norm(nl, nn, sci) + 0.3 * norm(eu, ne, sci) + 0.15 * norm(wo, nw, sci)
    if sci in nl: score += 0.25  # komt in NL voor
    p = ''
    for src in (nl, eu, wo):
        if sci in src: p = photo(src[sci][1]); break
    out_s.append([r[NL] or r[EN], r[EN] or '', sci, famidx[fam], round(score * 100), p])

json.dump({'v': 'IOC 15.2', 'f': fams, 's': out_s}, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
print(len(out_s), 'soorten,', sum(1 for s in out_s if s[4]), 'met score,', sum(1 for s in out_s if s[5]), 'met foto,', sum(1 for s in out_s if not s[0] or s[0]==s[1]), 'zonder NL-naam')
