"""Deterministic A-04 before/after feasibility and authenticated forecast-hour selection.

This module never infers rainfall danger thresholds or agricultural safe windows.
Only the backend forecast adapter, never a client-supplied forecast object, may
supply forecast-hour references to `replan_from_forecast`.
"""
from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timedelta, timezone
from math import isfinite
from zoneinfo import ZoneInfo

from .engine import InputError, evaluate, validate

TIMEZONE = ZoneInfo('Asia/Kolkata')
TRACKED_FIELDS = ('now', 'deadline', 'target_units', 'capacity_units', 'required_hours',
                  'readiness', 'completed', 'baseline_resource_ids', 'changes')
TRUSTED_FORECAST_STATES = {'retrieved_live', 'cached_recent'}


def compare_plans(before: dict, after: dict) -> dict:
    """Compare two separately declared planning scenarios without claiming causality."""
    if not isinstance(before, dict) or not isinstance(after, dict):
        raise InputError('before and after must be complete planning objects.')
    baseline_case, revised_case = validate(before), validate(after)
    original, revised = evaluate(before), evaluate(after)

    # Comparison is allowed for a changed resource inventory, duration, or
    # deadline. Distinct changes are reported rather than wrongly attributed
    # to a weather forecast alone.
    changed_fields = [name for name in TRACKED_FIELDS
                      if baseline_case[name] != revised_case[name]]
    bcon = {c['id']: c for c in original['baseline']['constraints']}
    acon = {c['id']: c for c in revised['baseline']['constraints']}
    previously_blocked = {k for k, v in bcon.items() if v['status'] == 'blocked'}
    subsequently_blocked = {k for k, v in acon.items() if v['status'] == 'blocked'}
    previously_unknown = {k for k, v in bcon.items() if v['status'] == 'unknown'}
    subsequently_unknown = {k for k, v in acon.items() if v['status'] == 'unknown'}
    old_slack = original['baseline']['time_budget']['time_slack_hours']
    new_slack = revised['baseline']['time_budget']['time_slack_hours']
    package_ids = lambda result: [p['change_ids'] for p in result['packages']]

    return {
        'before': original,
        'after': revised,
        'changes': {
            'changed_fields': changed_fields,
            'status_before': original['status'],
            'status_after': revised['status'],
            'time_slack_delta_hours': new_slack-old_slack if old_slack is not None and new_slack is not None else None,
            'new_blockers': sorted(subsequently_blocked-previously_blocked),
            'resolved_blockers': sorted(previously_blocked-subsequently_blocked),
            'new_unknowns': sorted(subsequently_unknown-previously_unknown),
            'resolved_unknowns': sorted(previously_unknown-subsequently_unknown),
            'packages_before': package_ids(original),
            'packages_after': package_ids(revised),
        },
        'interpretation': ('Comparison of user-declared constraints and candidate deadlines only; '
                           'changes do not prove forecast causality, agricultural safety, or prevention of crop loss.'),
    }


def parse_selected_hour_local(value: str) -> datetime:
    """Validate only the exact, timezone-free ISO hour format from Open-Meteo."""
    if not isinstance(value, str) or not value:
        raise InputError('selected_hour_local must exactly match a returned forecast hour.')
    try:
        chosen = datetime.fromisoformat(value)
    except ValueError:
        raise InputError('selected_hour_local must be a valid local ISO timestamp.') from None
    if chosen.tzinfo is not None or chosen.strftime('%Y-%m-%dT%H:%M') != value:
        raise InputError('selected_hour_local must be a source-native local hourly timestamp, without an offset.')
    return chosen


def replan_from_forecast(before: dict, after: dict, selected_hour_local: str,
                         forecast_summary: dict, evaluation_now: datetime) -> dict:
    """Bind the revised deadline to an hour returned by the server's forecast adapter.

    No client forecast payload is accepted. A stale/unavailable forecast must
    never be misrepresented as a verified current forecast-hour selection.
    """
    if not isinstance(before, dict) or not isinstance(after, dict):
        raise InputError('before and after must be complete planning objects.')
    if not isinstance(evaluation_now, datetime) or evaluation_now.tzinfo is None or evaluation_now.utcoffset() is None:
        raise InputError('A timezone-aware server evaluation time is required.')
    if not isinstance(forecast_summary, dict) or forecast_summary.get('status') not in TRUSTED_FORECAST_STATES:
        raise InputError('A current, authenticated server-side forecast is required; use manual /api/compare otherwise.')
    retrieved = forecast_summary.get('retrieved_at_utc')
    try:
        retrieval_time = datetime.fromisoformat(retrieved.replace('Z', '+00:00'))
    except (AttributeError, ValueError):
        raise InputError('Forecast retrieval time is missing or invalid.') from None
    if retrieval_time.tzinfo is None or retrieval_time.utcoffset() != timedelta(0):
        raise InputError('Forecast retrieval time must be UTC.')
    age = (evaluation_now.astimezone(timezone.utc)-retrieval_time).total_seconds()/3600
    if not isfinite(age) or age < 0 or age > 2:
        raise InputError('Forecast is no longer recent enough for an attributed forecast-hour selection.')
    chosen = parse_selected_hour_local(selected_hour_local)
    if chosen.replace(tzinfo=TIMEZONE) <= evaluation_now.astimezone(TIMEZONE):
        raise InputError('Selected forecast hour must be a future candidate deadline.')
    if forecast_summary.get('validated', {}).get('timezone') != 'Asia/Kolkata':
        raise InputError('Forecast timezone does not match the Jalna scenario.')
    matching = [h for h in forecast_summary.get('hours', [])
                if isinstance(h, dict) and h.get('time') == selected_hour_local]
    if len(matching) != 1:
        raise InputError('Selected hour is not present exactly once in the recent authenticated forecast.')
    deadline = chosen.replace(tzinfo=TIMEZONE).isoformat()
    revised_case = deepcopy(after)
    revised_case['deadline'] = deadline
    result = compare_plans(before, revised_case)
    hour = matching[0]
    result['forecast_selection'] = {
        'source': 'Open-Meteo model forecast',
        'selected_hour_local': selected_hour_local,
        'candidate_deadline': deadline,
        'retrieved_at_utc': retrieved,
        'forecast_age_hours': age,
        'forecast_status': forecast_summary['status'],
        'precipitation_mm': hour.get('precipitation_mm'),
        'precipitation_probability_pct': hour.get('precipitation_probability_pct'),
        'request_url': forecast_summary.get('request_url'),
        'attribution': forecast_summary.get('attribution'),
        'limitation': 'User-selected forecast hour is a candidate deadline, not exact rain onset or a safe agronomic threshold.',
    }
    return result
