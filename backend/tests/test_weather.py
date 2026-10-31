import copy,json
from datetime import datetime,timezone,timedelta
from urllib.error import URLError
from unlockplan.weather import get_forecast,validate_forecast,WeatherSchemaError,read_cache,build_url

def synthetic_response(now=None,rain=True):
 """Synthetic test fixture ONLY — must NEVER be shipped as live cache."""
 now=now or datetime(2026,10,31,0,0)
 return {'latitude':19.84,'longitude':75.89,'timezone':'Asia/Kolkata','utc_offset_seconds':19800,
         'hourly_units':{'time':'iso8601','precipitation':'mm','precipitation_probability':'%'},
         'hourly':{'time':[(now+timedelta(hours=i)).strftime('%Y-%m-%dT%H:%M') for i in range(48)],
                   'precipitation':[0.4 if rain and i==4 else 0 for i in range(48)],
                   'precipitation_probability':[20 for _ in range(48)]}}

def test_url():
 url=build_url(); assert 'precipitation_probability' in url and 'Asia%2FKolkata' in url and '19.84' in url

def test_synthetic_validation_and_persistence(tmp_path):
 p=tmp_path/'raw.json'; now=datetime(2026,10,31,14,0,tzinfo=timezone.utc)
 def fetcher(url):return synthetic_response()
 resp=get_forecast(refresh=True,cache_path=p,fetcher=fetcher,now=now)
 assert resp['status']=='retrieved_live' and resp['validated']['hours']==48
 assert p.exists() and read_cache(p)['verified_source']=='network_response'
 assert read_cache(p)['request_url']==build_url()
 cached=get_forecast(cache_path=p,fetcher=lambda url:1/0,now=now+timedelta(minutes=5))
 assert cached['status']=='cached_recent'

def test_fetch_failure_never_saves_fabricated_cache(tmp_path):
 p=tmp_path/'missing.json'
 r=get_forecast(refresh=True,cache_path=p,fetcher=lambda url:(_ for _ in ()).throw(URLError('no network')))
 assert r['status']=='unavailable' and not p.exists() and r['hours']==[]

def test_expired_cache_marked_stale(tmp_path):
 p=tmp_path/'real.json';old=datetime(2026,10,31,0,0,tzinfo=timezone.utc)
 get_forecast(refresh=True,cache_path=p,fetcher=lambda url:synthetic_response(),now=old)
 later=old+timedelta(hours=4)
 r=get_forecast(refresh=True,cache_path=p,fetcher=lambda url:(_ for _ in ()).throw(URLError('offline')),now=later)
 assert r['status']=='stale_cache' and r['error']

def test_no_rain_no_warning(tmp_path):
 r=get_forecast(refresh=True,cache_path=tmp_path/'real.json',fetcher=lambda url:synthetic_response(rain=False))
 assert r['validated']['positive_precipitation_hours']==0
 assert 'No positive modeled' in r['notice']

def test_wrong_units_and_offset_rejected():
 p=synthetic_response();p['hourly_units']['precipitation']='inch'
 try:validate_forecast(p);assert False
 except WeatherSchemaError:pass
 p=synthetic_response();p['utc_offset_seconds']=0
 try:validate_forecast(p);assert False
 except WeatherSchemaError:pass

def test_null_not_zero():
 p=synthetic_response();p['hourly']['precipitation'][0]=None
 assert validate_forecast(p)['missing_precipitation']==1

def test_nonmonotonic_timestamp_rejected():
 p=synthetic_response();p['hourly']['time'][3]=p['hourly']['time'][2]
 try:validate_forecast(p);assert False
 except WeatherSchemaError:pass
