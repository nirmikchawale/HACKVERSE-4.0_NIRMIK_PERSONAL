"""A-03 edge cases. All forecast payloads in these tests are synthetic fixtures only."""
from datetime import datetime, timedelta, timezone
import json
from urllib.error import URLError
import pytest
from test_weather import synthetic_response
from unlockplan.weather import (
    CACHE_FILE, LAT, LON, TIMEZONE, WeatherSchemaError, get_forecast,
    read_cache, validate_forecast, build_url,
)


def test_model_grid_coordinates_are_validated_and_disclosed(tmp_path):
    raw=synthetic_response()
    raw['latitude']=LAT+0.05
    raw['longitude']=LON-0.04
    result=get_forecast(refresh=True,cache_path=tmp_path/'model.json',
                        fetcher=lambda url:raw, now=datetime(2026,10,31,14,tzinfo=timezone.utc))
    assert result['status']=='retrieved_live'
    assert result['validated']['model_grid_latitude']==raw['latitude']
    assert result['validated']['model_grid_longitude']==raw['longitude']
    assert result['latitude_reference']==LAT and result['longitude_reference']==LON
    assert result['validated']['timezone']==TIMEZONE
    assert result['forecast_age_hours']==0


@pytest.mark.parametrize('key,value', [
    ('latitude', None), ('longitude', None),
    ('latitude', LAT+1.5), ('longitude', LON+1.5),
    ('latitude', True), ('longitude', float('nan')),
])
def test_wrong_grid_coordinates_rejected(key,value):
    raw=synthetic_response()
    raw[key]=value
    with pytest.raises(WeatherSchemaError,match='grid cell'):
        validate_forecast(raw)


def test_wrong_time_unit_rejected():
    raw=synthetic_response()
    raw['hourly_units']['time']='unixtime'
    with pytest.raises(WeatherSchemaError,match='units'):
        validate_forecast(raw)


@pytest.mark.parametrize('field,value', [
    ('precipitation',-0.1),('precipitation',float('inf')),
    ('precipitation_probability',101),('precipitation_probability',-2),
])
def test_forecast_invalid_values_rejected(field,value):
    raw=synthetic_response()
    raw['hourly'][field][1]=value
    with pytest.raises(WeatherSchemaError,match='Invalid'):
        validate_forecast(raw)


def test_malformed_hourly_lengths_rejected():
    raw=synthetic_response()
    raw['hourly']['precipitation_probability'].pop()
    with pytest.raises(WeatherSchemaError,match='lengths'):
        validate_forecast(raw)


def test_wrong_location_failure_has_no_live_cache(tmp_path):
    raw=synthetic_response()
    raw['latitude']=30.0
    cache=tmp_path/'not-real.json'
    r=get_forecast(refresh=True,cache_path=cache,fetcher=lambda url:raw,
                   now=datetime(2026,10,31,14,tzinfo=timezone.utc))
    assert r['status']=='unavailable' and r['hours']==[]
    assert not cache.exists()


def test_stale_cached_response_stays_stale_on_network_error(tmp_path):
    cache=tmp_path/'real.json'
    start=datetime(2026,10,31,14,tzinfo=timezone.utc)
    get_forecast(refresh=True,cache_path=cache,
                 fetcher=lambda url:synthetic_response(),now=start)
    result=get_forecast(refresh=True,cache_path=cache,
        fetcher=lambda url:(_ for _ in ()).throw(URLError('network offline')),
        now=start+timedelta(hours=3))
    assert result['status']=='stale_cache'
    assert result['forecast_age_hours']==3
    assert result['error'] and result['retrieved_at_utc']==start.isoformat()


def test_only_utc_cache_timestamp_allowed(tmp_path):
    cache=tmp_path/'real.json'
    now=datetime(2026,10,31,14,tzinfo=timezone.utc)
    get_forecast(refresh=True,cache_path=cache,
                 fetcher=lambda url:synthetic_response(),now=now)
    record=json.loads(cache.read_text())
    record['retrieved_at_utc']='2026-10-31T19:30:00+05:30'
    cache.write_text(json.dumps(record))
    assert read_cache(cache) is None


def test_cache_in_temp_not_source_tree():
    assert 'backend/cache' not in str(CACHE_FILE).replace('\\','/')
    assert CACHE_FILE.name=='real_open_meteo_cache.json'
