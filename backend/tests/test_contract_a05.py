"""A-05: six-route FastAPI contract and error-boundary regressions.

All case values and forecast responses in this module are synthetic TEST fixtures.
They are not live model data, farmer records, or field advice.
"""
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from test_engine import fixture
from test_weather import synthetic_response
from unlockplan.api import app
from unlockplan.weather import get_forecast


client = TestClient(app)
IST = ZoneInfo('Asia/Kolkata')


def ready_case():
    data = fixture()
    data['capacity_units'] = data['target_units']
    data['changes'] = []
    return data


def current_case_and_forecast():
    now = datetime.now(timezone.utc)
    local = now.astimezone(IST)
    chosen = (local + timedelta(hours=4)).replace(minute=0, second=0, microsecond=0)
    case = ready_case()
    case['now'] = now.isoformat()
    case['deadline'] = (now + timedelta(hours=12)).isoformat()
    hour = chosen.strftime('%Y-%m-%dT%H:%M')
    weather = {
        'status': 'cached_recent',
        'retrieved_at_utc': now.isoformat(),
        'validated': {'timezone': 'Asia/Kolkata'},
        'hours': [{'time': hour, 'precipitation_mm': None, 'precipitation_probability_pct': 35}],
        'request_url': 'https://api.open-meteo.com/v1/forecast?synthetic-tests-only',
        'attribution': 'Synthetic test fixture, not a real forecast',
    }
    return case, weather, hour


def test_openapi_six_core_paths_and_typed_comparison_request():
    schema = client.get('/openapi.json')
    assert schema.status_code == 200
    paths = schema.json()['paths']
    for path, method in {
        '/api/health':'get', '/api/forecast':'get', '/api/sources':'get',
        '/api/evaluate':'post', '/api/compare':'post', '/api/replan':'post',
    }.items():
        assert method in paths[path], (path, method)
        assert '200' in paths[path][method]['responses']
    models = schema.json()['components']['schemas']
    assert set(models['CompareRequest']['required']) == {'before', 'after'}
    assert set(models['ReplanRequest']['required']) == {'before', 'after', 'selected_hour_local'}
    assert models['CompareRequest']['additionalProperties'] is False


def test_health_is_not_a_claim_of_live_agricultural_validation():
    result = client.get('/api/health')
    assert result.status_code == 200
    body = result.json()
    assert body['ok'] is True
    assert type(body['forecast_validated_cache_present']) is bool
    assert 'Not field validated' in body['disclaimer']


def test_sources_preserve_provenance_and_assumption_categories():
    response = client.get('/api/sources')
    assert response.status_code == 200
    sources = response.json()
    assert sources['sources'] and sources['operational_rules']
    assert 'user-reported' in sources['input_categories']
    assert 'unknown' in sources['input_categories']
    assert all('url' in source and 'limitations' in source for source in sources['sources'])


def test_forecast_endpoint_preserves_nullable_hourly_values(monkeypatch, tmp_path):
    import unlockplan.api as api
    moment = datetime(2026, 10, 31, 14, tzinfo=timezone.utc)
    sample = synthetic_response()
    sample['hourly']['precipitation'][1] = None
    output = get_forecast(refresh=True, cache_path=tmp_path/'case.json', fetcher=lambda url:sample, now=moment)
    monkeypatch.setattr(api, 'get_forecast', lambda refresh=False:output)
    response = client.get('/api/forecast')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'retrieved_live'  # Mocked endpoint response, NOT a real-network claim.
    assert data['validated']['hours'] == 48
    assert data['hours'][1]['precipitation_mm'] is None
    assert data['hours'][1]['precipitation_probability_pct'] == 20
    assert data['validated']['timezone'] == 'Asia/Kolkata'
    assert data['retrieved_at_utc'] == moment.isoformat()
    assert data['request_url'].startswith('https://api.open-meteo.com/')
    assert data['attribution']


def test_forecast_endpoint_unavailable_has_empty_hours(monkeypatch):
    import unlockplan.api as api
    monkeypatch.setattr(api, 'get_forecast', lambda refresh=False:{
        'status':'unavailable', 'hours':[], 'error':'synthetic network failure',
        'source':'Open-Meteo public model forecast', 'notice':'Weather unavailable',
    })
    result = client.get('/api/forecast')
    assert result.status_code == 200
    assert result.json()['status'] == 'unavailable'
    assert result.json()['hours'] == []
    assert 'validated' not in result.json()


def test_evaluate_response_shape_and_package_invariants():
    response = client.post('/api/evaluate', json=fixture())
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'blocked'
    assert data['unit'] == 'handling_unit'
    assert data['baseline']['shortfall_units'] == 4
    assert {tuple(p['change_ids']) for p in data['packages']} == {('A',), ('B', 'C')}
    assert data['baseline']['time_budget']['time_slack_hours'] == 2
    assert all(c['provenance'] for c in data['baseline']['constraints'])


@pytest.mark.parametrize('field, invalid', [
    ('readiness', []),
    ('readiness', {}),
])
def test_evaluate_rejects_unhashable_readiness_as_422(field,invalid):
    case = fixture()
    case[field] = invalid
    response = client.post('/api/evaluate', json=case)
    assert response.status_code == 422
    assert 'readiness' in str(response.json()['detail'])


@pytest.mark.parametrize('field, invalid', [
    ('type', []),
    ('availability', {}),
    ('confirmation_state', []),
])
def test_evaluate_rejects_unhashable_change_enums_as_422(field, invalid):
    case = fixture()
    case['changes'][0][field] = invalid
    response = client.post('/api/evaluate', json=case)
    assert response.status_code == 422
    assert response.json()['detail']


def test_evaluate_unknown_and_completed_are_distinct_states():
    case = ready_case()
    case['readiness'] = 'unknown'
    r = client.post('/api/evaluate', json=case)
    assert r.status_code == 200 and r.json()['status'] == 'unknown'
    case['completed'] = True
    r = client.post('/api/evaluate', json=case)
    assert r.status_code == 200 and r.json()['status'] == 'completed'
    assert r.json()['packages'] == []


def test_compare_contract_and_no_forecast_causality_claim():
    before, after = ready_case(), ready_case()
    after['deadline'] = '2026-11-01T09:00:00+05:30'
    r = client.post('/api/compare', json={'before':before,'after':after})
    assert r.status_code == 200
    d = r.json()
    assert d['changes']['changed_fields'] == ['deadline']
    assert d['changes']['new_blockers'] == ['timing']
    assert d['changes']['status_before'] == 'feasible'
    assert d['changes']['status_after'] == 'blocked'
    assert d['changes']['time_slack_delta_hours'] == -3
    assert 'do not prove forecast causality' in d['interpretation']


@pytest.mark.parametrize('body', [
    {'before': ready_case()},
    {'after': ready_case()},
    {'before': ready_case(), 'after': []},
    {'before': ready_case(), 'after': ready_case(), 'unexpected':'not_allowed'},
])
def test_compare_rejects_incomplete_or_invalid_contract(body):
    assert client.post('/api/compare', json=body).status_code == 422


def test_replan_rejects_bad_request_before_weather_fetch(monkeypatch):
    import unlockplan.api as api
    def should_not_fetch(refresh=False):
        raise AssertionError('Malformed user input should never cause an external weather call')
    monkeypatch.setattr(api, 'get_forecast', should_not_fetch)
    case, forecast, hour = current_case_and_forecast()
    bad = deepcopy(case)
    bad['readiness'] = []
    for request in [
        {'before':case, 'selected_hour_local':hour},
        {'before':case, 'after':bad, 'selected_hour_local':hour},
        {'before':case, 'after':case, 'selected_hour_local':'invalid-hour'},
    ]:
        r = client.post('/api/replan', json=request)
        assert r.status_code == 422


def test_replan_works_with_recent_server_verified_hour(monkeypatch):
    import unlockplan.api as api
    case, forecast, hour = current_case_and_forecast()
    monkeypatch.setattr(api, 'get_forecast', lambda refresh=False:forecast)
    response = client.post('/api/replan', json={
        'before':case,'after':case,'selected_hour_local':hour,
    })
    assert response.status_code == 200
    body = response.json()
    assert body['forecast_selection']['selected_hour_local'] == hour
    assert body['forecast_selection']['precipitation_mm'] is None
    assert body['forecast_selection']['forecast_status'] == 'cached_recent'
    assert body['changes']['changed_fields'] == ['deadline']
    assert body['changes']['new_blockers'] == []
    assert 'not exact rain onset' in body['forecast_selection']['limitation']


@pytest.mark.parametrize('state', ['unavailable', 'stale_cache'])
def test_replan_requires_recent_forecast_or_returns_409(monkeypatch,state):
    import unlockplan.api as api
    case,forecast,hour = current_case_and_forecast()
    forecast['status']=state
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:forecast)
    r=client.post('/api/replan',json={'before':case,'after':case,'selected_hour_local':hour})
    assert r.status_code==409
    assert '/api/compare' in r.json()['detail']


def test_replan_rejects_past_hour_even_when_present_in_recent_forecast(monkeypatch):
    import unlockplan.api as api
    case, forecast, hour = current_case_and_forecast()
    old = (datetime.now(timezone.utc).astimezone(IST)-timedelta(hours=2)).replace(minute=0,second=0,microsecond=0)
    bad_hour=old.strftime('%Y-%m-%dT%H:%M')
    forecast['hours']=[{'time':bad_hour,'precipitation_mm':0,'precipitation_probability_pct':10}]
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:forecast)
    result=client.post('/api/replan',json={'before':case,'after':case,'selected_hour_local':bad_hour})
    assert result.status_code==422
    assert 'future candidate deadline' in result.json()['detail']


def test_replan_rejects_unlisted_future_hour(monkeypatch):
    import unlockplan.api as api
    case,forecast,hour=current_case_and_forecast()
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:forecast)
    other=(datetime.fromisoformat(hour)+timedelta(hours=1)).strftime('%Y-%m-%dT%H:%M')
    result=client.post('/api/replan',json={'before':case,'after':case,'selected_hour_local':other})
    assert result.status_code==422
    assert 'not present exactly once' in result.json()['detail']
