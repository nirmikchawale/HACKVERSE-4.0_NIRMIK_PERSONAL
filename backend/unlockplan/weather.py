"""Open-Meteo adapter: only authentic validated network responses enter the real cache.
Forecast amounts are model outputs, never observations or agronomic thresholds.
"""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo
from math import isfinite

LAT,LON=19.84,75.89
TIMEZONE='Asia/Kolkata'
BASE='https://api.open-meteo.com/v1/forecast'
ATTRIBUTION='Weather data by Open-Meteo.com (CC BY 4.0); model forecasts, not field measurements.'
CACHE_FILE=Path(__file__).resolve().parents[1]/'cache'/'real_open_meteo_cache.json'
STALE_AFTER_HOURS=2

class WeatherSchemaError(ValueError):pass

def build_url()->str:
    return BASE+'?'+urlencode({'latitude':LAT,'longitude':LON,'hourly':'precipitation,precipitation_probability',
                               'timezone':TIMEZONE,'forecast_days':3})

def validate_forecast(payload:dict)->dict:
    if not isinstance(payload,dict):raise WeatherSchemaError('Forecast must be an object.')
    if payload.get('timezone')!=TIMEZONE or payload.get('utc_offset_seconds')!=19800:
        raise WeatherSchemaError('Unexpected timezone or offset.')
    units=payload.get('hourly_units')
    if not isinstance(units,dict) or units.get('precipitation')!='mm' or units.get('precipitation_probability')!='%':
        raise WeatherSchemaError('Unexpected weather units.')
    h=payload.get('hourly')
    if not isinstance(h,dict):raise WeatherSchemaError('Missing hourly data.')
    times=h.get('time');prec=h.get('precipitation');prob=h.get('precipitation_probability')
    if not all(isinstance(a,list) for a in [times,prec,prob]) or not 24<=len(times)<=384 or len(times)!=len(prec) or len(times)!=len(prob):
        raise WeatherSchemaError('Hourly array lengths are incompatible.')
    parsed=[]
    for i,t in enumerate(times):
        try:
            dt=datetime.fromisoformat(t)
            if dt.tzinfo is not None:raise ValueError('explicit offset unexpected')
            local=dt.replace(tzinfo=ZoneInfo(TIMEZONE))
        except (ValueError,TypeError) as exc:
            raise WeatherSchemaError(f'Invalid local forecast timestamp at {i}: {exc}') from None
        parsed.append(local)
        if i and (parsed[i]-parsed[i-1])!=timedelta(hours=1):
            raise WeatherSchemaError('Forecast timestamps must be strictly hourly and ordered.')
    for vals,name,maximum in [(prec,'precipitation',None),(prob,'precipitation_probability',100)]:
        for item in vals:
            if item is None:continue
            if isinstance(item,bool) or not isinstance(item,(int,float)) or not isfinite(item) or item<0 or (maximum is not None and item>maximum):
                raise WeatherSchemaError(f'Invalid {name} value.')
    if all(v is None for v in prec) and all(v is None for v in prob):
        raise WeatherSchemaError('All requested weather observations are null.')
    return {'hours':len(times),'missing_precipitation':sum(x is None for x in prec),
            'missing_probability':sum(x is None for x in prob),'first_hour':times[0],
            'last_hour':times[-1], 'timezone':TIMEZONE,'units':units,
            'positive_precipitation_hours':sum(isinstance(x,(int,float)) and x>0 for x in prec)}

def public_summary(record:dict,status:str,error:str|None=None)->dict:
    payload=record['raw']; val=validate_forecast(payload)
    return {'status':status,'error':error,'source':'Open-Meteo public model forecast',
            'latitude_reference':LAT,'longitude_reference':LON,'location_label':'Jalna district approximate reference (not farm-level)',
            'retrieved_at_utc':record['retrieved_at_utc'],'request_url':record['request_url'],
            'attribution':ATTRIBUTION,'validated':val,
            'hours':[{'time':time,'precipitation_mm':mm,'precipitation_probability_pct':pct}
                 for time,mm,pct in zip(payload['hourly']['time'],payload['hourly']['precipitation'],payload['hourly']['precipitation_probability'])],
            'notice':('No positive modeled hourly precipitation in the forecast window; this does not imply field readiness.'
                      if val['positive_precipitation_hours']==0 and val['missing_precipitation']==0
                      else 'Forecast is uncertain and not a field measurement or validated operation threshold.')}

def read_cache(cache_path:Path=CACHE_FILE)->dict|None:
    if not cache_path.is_file():return None
    try:
        record=json.loads(cache_path.read_text(encoding='utf-8'))
        if record.get('verified_source')!='network_response' or record.get('request_url')!=build_url():
            raise ValueError('Cache source marker or original URL invalid.')
        validate_forecast(record['raw'])
        retrieved=datetime.fromisoformat(record['retrieved_at_utc'])
        if retrieved.tzinfo is None:raise ValueError('Timezone missing')
        return record
    except (KeyError,ValueError,TypeError,WeatherSchemaError,json.JSONDecodeError):
        return None

def age_hours(record:dict,now:datetime)->float:
    dt=datetime.fromisoformat(record['retrieved_at_utc'])
    return (now-dt).total_seconds()/3600

def get_forecast(refresh:bool=False,cache_path:Path=CACHE_FILE,fetcher=None,now:datetime|None=None)->dict:
    now=now or datetime.now(timezone.utc)
    cached=read_cache(cache_path)
    if cached and not refresh and 0<=age_hours(cached,now)<=STALE_AFTER_HOURS:
        return public_summary(cached,'cached_recent')
    url=build_url()
    try:
        if fetcher:
            raw=fetcher(url)
        else:
            req=Request(url,headers={'User-Agent':'UnlockPlan-educational-prototype/0.1','Accept':'application/json'})
            with urlopen(req,timeout=9) as response:raw=json.load(response)
        validated=validate_forecast(raw)
        first=datetime.fromisoformat(validated['first_hour']).replace(tzinfo=ZoneInfo(TIMEZONE))
        last=datetime.fromisoformat(validated['last_hour']).replace(tzinfo=ZoneInfo(TIMEZONE))
        if not first-timedelta(hours=24)<=now.astimezone(ZoneInfo(TIMEZONE))<=last+timedelta(hours=1):
            raise WeatherSchemaError('Forecast time range does not cover the current reference period.')
        record={'raw':raw,'request_url':url,'retrieved_at_utc':now.isoformat(),
                'attribution':ATTRIBUTION,'requested_timezone':TIMEZONE,'verified_source':'network_response'}
        cache_path.parent.mkdir(parents=True,exist_ok=True)
        # Only an actual successful fetch response may populate the production cache.
        tmp=cache_path.with_suffix('.tmp')
        tmp.write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
        tmp.replace(cache_path)
        return public_summary(record,'retrieved_live')
    except (HTTPError,URLError,OSError,ValueError,TypeError,KeyError,TimeoutError) as exc:
        error=f'Public forecast fetch or schema validation failed: {type(exc).__name__}: {str(exc)[:160]}'
        if cached:
            status='cached_recent' if 0<=age_hours(cached,now)<=STALE_AFTER_HOURS else 'stale_cache'
            return public_summary(cached,status,error)
        return {'status':'unavailable','error':error,'source':'Open-Meteo public model forecast',
                'request_url':url,'attribution':ATTRIBUTION,'location_label':'Jalna district approximate reference (not farm-level)',
                'hours':[],'notice':'Weather unavailable: resource-only sandbox is not live climate advice.'}
