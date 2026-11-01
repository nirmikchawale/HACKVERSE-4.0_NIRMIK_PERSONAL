"""A-04 deterministic deadline comparisons (synthetic abstract TEST data only).

Forecast summaries below are local stubs for testing logic, not weather evidence.
"""
from copy import deepcopy
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient

from test_engine import fixture, keysets
from unlockplan.engine import InputError, evaluate
from unlockplan.planning import compare_plans, replan_from_forecast
from unlockplan.api import app


def _feasible():
    case = fixture()
    case['capacity_units'] = case['target_units']
    case['changes'] = []
    return case


def _weather(now, precipitation=None):
    return {
        'status': 'retrieved_live', 'retrieved_at_utc': now.isoformat(),
        'validated': {'timezone': 'Asia/Kolkata'},
        'hours': [{'time': '2026-11-01T09:00', 'precipitation_mm': precipitation,
                   'precipitation_probability_pct': 35}],
        'request_url': 'https://api.open-meteo.com/v1/forecast?test-fixture-only',
        'attribution': 'Open-Meteo model source (synthetic test fixture)',
    }


def test_time_budget_available_hours_and_positive_slack():
    result = evaluate(_feasible())
    budget = result['baseline']['time_budget']
    assert result['status'] == 'feasible'
    assert budget['available_hours'] == 4
    assert budget['required_hours'] == 2
    assert budget['time_slack_hours'] == 2
    assert budget['candidate_deadline'] == '2026-11-01T12:00:00+05:30'
    assert 'not a forecasted rain onset' in budget['basis']
    assert 'time slack +2.00 h' in next(c['explanation'] for c in result['baseline']['constraints'] if c['id']=='timing')


def test_earlier_deadline_creates_negative_slack_and_known_blocker():
    case = _feasible()
    case['deadline'] = '2026-11-01T09:00:00+05:30'
    result = evaluate(case)
    assert result['status'] == 'blocked'
    assert result['baseline']['time_budget']['available_hours'] == 1
    assert result['baseline']['time_budget']['time_slack_hours'] == -1
    assert result['baseline']['known_blockers'] == ['timing']
    assert result['packages'] == []


def test_missing_deadline_remains_unknown_not_zero():
    case = _feasible()
    case['deadline'] = None
    budget = evaluate(case)['baseline']['time_budget']
    assert budget['available_hours'] is None
    assert budget['time_slack_hours'] is None
    assert budget['required_hours'] == 2
    assert evaluate(case)['status'] == 'unknown'


def test_past_deadline_is_blocked_not_elevated_to_safety_warning():
    case = _feasible()
    case['deadline'] = '2026-11-01T07:00:00+05:30'
    assert evaluate(case)['baseline']['time_budget']['time_slack_hours'] == -3
    assert evaluate(case)['status'] == 'blocked'


def test_timezone_offsets_compare_absolute_instants():
    case = _feasible()
    case['deadline'] = '2026-11-01T06:30:00+00:00'  # Same instant as 12:00 IST.
    result = evaluate(case)
    assert result['baseline']['time_budget']['available_hours'] == 4
    assert result['baseline']['time_budget']['time_slack_hours'] == 2
    original = _feasible()
    assert 'deadline' not in compare_plans(original, case)['changes']['changed_fields']


def test_comparison_feasible_to_blocked_due_only_to_selected_deadline():
    before, after = _feasible(), _feasible()
    after['deadline'] = '2026-11-01T09:00:00+05:30'
    comparison = compare_plans(before, after)
    changes = comparison['changes']
    assert changes['changed_fields'] == ['deadline']
    assert changes['status_before'] == 'feasible'
    assert changes['status_after'] == 'blocked'
    assert changes['time_slack_delta_hours'] == -3
    assert changes['new_blockers'] == ['timing']
    assert changes['resolved_blockers'] == []
    assert 'agricultural safety' in comparison['interpretation']
    assert after['deadline'] == '2026-11-01T09:00:00+05:30'


def test_comparison_blocked_to_feasible_when_capacity_declared_changed():
    before, after = fixture(), fixture()
    after['capacity_units'] = 10
    comparison = compare_plans(before, after)
    changes = comparison['changes']
    assert changes['changed_fields'] == ['capacity_units']
    assert changes['status_before'] == 'blocked'
    assert changes['status_after'] == 'feasible'
    assert changes['resolved_blockers'] == ['capacity']
    assert {frozenset(p) for p in changes['packages_before']} == {frozenset(['A']),frozenset(['B','C'])}
    assert changes['packages_after'] == []


def test_comparison_handles_unknown_to_blocked_and_null_slack():
    before, after = _feasible(), _feasible()
    before['deadline'] = None
    after['deadline'] = '2026-11-01T09:00:00+05:30'
    changes = compare_plans(before, after)['changes']
    assert changes['status_before'] == 'unknown'
    assert changes['status_after'] == 'blocked'
    assert changes['new_blockers'] == ['timing']
    assert changes['resolved_unknowns'] == ['timing']
    assert changes['time_slack_delta_hours'] is None


def test_comparison_preserves_completed_boundary():
    before, after = fixture(), fixture()
    after['completed'] = True
    result = compare_plans(before,after)
    assert result['changes']['status_after'] == 'completed'
    assert result['after']['packages'] == []


def test_comparison_multiple_input_changes_not_falsely_attributed_to_weather():
    before, after = fixture(), fixture()
    after['deadline']='2026-11-01T09:00:00+05:30'
    after['capacity_units']=10
    changed=compare_plans(before,after)['changes']['changed_fields']
    assert changed == ['deadline','capacity_units']


def test_invalid_comparison_input_rejected():
    with pytest.raises(InputError,match='complete planning objects'):
        compare_plans(_feasible(), None)
    with pytest.raises(InputError,match='finite nonnegative'):
        malformed=_feasible()
        malformed['required_hours']=-1
        compare_plans(_feasible(), malformed)


def test_forecast_hour_binding_uses_server_evidence_and_does_not_change_input():
    before, after = _feasible(), _feasible()
    snapshot = deepcopy(after)
    now = datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    result = replan_from_forecast(before, after, '2026-11-01T09:00', _weather(now), now)
    assert result['after']['status'] == 'blocked'
    assert result['changes']['changed_fields'] == ['deadline']
    assert result['forecast_selection']['candidate_deadline'] == '2026-11-01T09:00:00+05:30'
    assert result['forecast_selection']['precipitation_mm'] is None  # Unknown != 0.
    assert result['changes']['time_slack_delta_hours'] == -3
    assert result['forecast_selection']['forecast_status'] == 'retrieved_live'
    assert 'not exact rain onset' in result['forecast_selection']['limitation']
    assert after == snapshot


@pytest.mark.parametrize('status', ['unavailable','stale_cache','unknown'])
def test_forecast_hour_binding_rejects_unreliable_data(status):
    now=datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    weather=_weather(now)
    weather['status']=status
    with pytest.raises(InputError,match='current, authenticated'):
        replan_from_forecast(_feasible(),_feasible(),'2026-11-01T09:00',weather,now)


def test_forecast_hour_binding_rejects_older_than_two_hours():
    now=datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    old=_weather(now-timedelta(hours=3))
    with pytest.raises(InputError,match='no longer recent'):
        replan_from_forecast(_feasible(),_feasible(),'2026-11-01T09:00',old,now)


def test_forecast_hour_binding_rejects_wrong_or_forged_hour():
    now=datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    with pytest.raises(InputError,match='not present exactly once'):
        replan_from_forecast(_feasible(),_feasible(),'2026-11-01T10:00',_weather(now),now)
    with pytest.raises(InputError,match='source-native'):
        replan_from_forecast(_feasible(),_feasible(),'2026-11-01T09:00+05:30',_weather(now),now)


def test_comparison_api_contract_and_input_validation():
    client=TestClient(app)
    before,after=_feasible(),_feasible()
    after['deadline']='2026-11-01T09:00:00+05:30'
    response=client.post('/api/compare',json={'before':before,'after':after})
    assert response.status_code==200
    data=response.json()
    assert data['changes']['new_blockers']==['timing']
    assert data['after']['baseline']['time_budget']['time_slack_hours']==-1
    assert client.post('/api/compare',json={'before':before}).status_code==422


def test_forecast_replan_api_rejects_unavailable_and_accepts_stubbed_recent(monkeypatch):
    import unlockplan.api as api
    client=TestClient(app)
    case=_feasible()
    payload={'before':case,'after':case,'selected_hour_local':'2026-11-01T09:00'}
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:{'status':'unavailable'})
    assert client.post('/api/replan',json=payload).status_code==409
    # A real calendar clock eventually makes the fixed test-only 09:00 hour past.
    # Freeze the API clock solely inside this synthetic test; production stays live.
    fixed_now=datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    class FixedClock(datetime):
        @classmethod
        def now(cls,tz=None):
            return fixed_now.astimezone(tz) if tz is not None else fixed_now.replace(tzinfo=None)
    monkeypatch.setattr(api,'datetime',FixedClock)
    fresh=_weather(fixed_now)  # Synthetic test-only stub.
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:fresh)
    response=client.post('/api/replan',json=payload)
    assert response.status_code==200
    assert response.json()['after']['status']=='blocked'
    assert response.json()['forecast_selection']['forecast_status']=='retrieved_live'


def test_forecast_replan_api_rejects_unlisted_hour(monkeypatch):
    import unlockplan.api as api
    client=TestClient(app)
    case=_feasible()
    # Test the unlisted-hour branch against a fixed pre-deadline clock.
    fixed_now=datetime(2026,10,31,17,30,tzinfo=timezone.utc)
    class FixedClock(datetime):
        @classmethod
        def now(cls,tz=None):
            return fixed_now.astimezone(tz) if tz is not None else fixed_now.replace(tzinfo=None)
    monkeypatch.setattr(api,'datetime',FixedClock)
    monkeypatch.setattr(api,'get_forecast',lambda refresh=False:_weather(fixed_now))
    response=client.post('/api/replan',json={'before':case,'after':case,'selected_hour_local':'2026-11-01T10:00'})
    assert response.status_code==422
    assert 'not present' in response.json()['detail']
