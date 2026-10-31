#!/usr/bin/env python3
"""Capture an authentic current UnlockPlan backend forecast for manual QA.
Never supplies synthetic forecasts. Does not run automatically.
"""
import argparse, json, urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

parser = argparse.ArgumentParser()
parser.add_argument('--base-url', default='http://127.0.0.1:8000')
parser.add_argument('--out', default='qa-forecast.json')
args=parser.parse_args()
url = args.base_url.rstrip('/') + '/api/forecast?refresh=true'
parts=urlparse(url)
if parts.scheme not in {'https','http'} or (parts.scheme == 'http' and parts.hostname not in {'localhost','127.0.0.1'}):
    parser.error('Only HTTPS servers or local HTTP origins are supported.')
with urllib.request.urlopen(urllib.request.Request(url, headers={'Accept':'application/json'}),timeout=18) as r:
    if r.status != 200:
        raise SystemExit('Forecast API HTTP status '+str(r.status))
    data=json.load(r)
if data.get('status') not in {'retrieved_live','cached_recent'}:
    raise SystemExit('Not a current validated forecast: '+str(data.get('status')))
if not data.get('attribution') or not data.get('retrieved_at_utc') or not isinstance(data.get('hours'),list):
    raise SystemExit('Missing required metadata')
units=data.get('validated',{}).get('units',{})
if units.get('precipitation')!='mm' or units.get('precipitation_probability')!='%':
    raise SystemExit('Unsupported forecast units')
for h in data['hours']:
    if not isinstance(h,dict) or not isinstance(h.get('time'),str):
        raise SystemExit('Malformed forecast hour')
    v=h.get('precipitation_mm'); p=h.get('precipitation_probability_pct')
    if v is not None and (not isinstance(v,(int,float)) or isinstance(v,bool) or not 0 <= v < float('inf')):
        raise SystemExit('Invalid precipitation value')
    if p is not None and (not isinstance(p,(int,float)) or isinstance(p,bool) or not 0 <= p <=100):
        raise SystemExit('Invalid precipitation probability')
record={'capture_type':'QA_ONLY_NOT_LIVE_DASHBOARD_DATA','captured_at_utc':datetime.now(timezone.utc).isoformat(),'backend_origin':args.base_url,'forecast':data}
Path(args.out).write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Saved verified-source, timestamped forecast QA snapshot to',args.out)
