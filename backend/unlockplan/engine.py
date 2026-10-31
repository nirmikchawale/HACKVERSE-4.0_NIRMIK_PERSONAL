"""UnlockPlan P0: source-agnostic, deterministic resource feasibility.
No agronomic efficacy or climate thresholds are represented in this module.
"""
from __future__ import annotations
from datetime import datetime
from itertools import combinations
from math import isfinite
from typing import Any

UNIT = 'handling_unit'  # artificial, demonstrative only
ALLOWED_KINDS = {'add_capacity', 'reduce_target'}
ALLOWED_AVAILABILITY = {'available', 'unavailable', 'unknown'}
ALLOWED_CONFIRMATION = {'confirmed', 'requested', 'unknown'}
ALLOWED_READINESS = {'yes', 'no', 'unknown'}
MAX_CHANGES = 10

class InputError(ValueError):
    pass


def number(value: Any, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not isfinite(value) or value < 0:
        raise InputError(f'{field} must be a finite nonnegative number.')
    return float(value)


def parse_time(value: Any, field: str) -> datetime | None:
    if value is None or value == '':
        return None
    if not isinstance(value, str):
        raise InputError(f'{field} must be an ISO 8601 datetime with timezone.')
    try:
        dt = datetime.fromisoformat(value.replace('Z', '+00:00'))
    except ValueError:
        raise InputError(f'{field} must be an ISO 8601 datetime with timezone.') from None
    if dt.tzinfo is None or dt.utcoffset() is None:
        raise InputError(f'{field} requires a timezone offset.')
    return dt


def validate(case: dict) -> dict:
    if not isinstance(case, dict):
        raise InputError('Case must be an object.')
    if case.get('unit', UNIT) != UNIT:
        raise InputError('Only abstract handling_unit is supported; no real agricultural unit conversion.')
    target = number(case.get('target_units'), 'target_units')
    capacity = number(case.get('capacity_units'), 'capacity_units')
    duration = number(case.get('required_hours'), 'required_hours')
    readiness = case.get('readiness', 'unknown')
    if not isinstance(readiness, str) or readiness not in ALLOWED_READINESS:
        raise InputError('readiness must be yes, no or unknown.')
    if type(case.get('completed', False)) is not bool:
        raise InputError('completed must be a boolean.')
    now = parse_time(case.get('now'), 'now')
    deadline = parse_time(case.get('deadline'), 'deadline')
    if now is None:
        raise InputError('now must be supplied; the engine does not invent evaluation time.')
    baseline_resources = case.get('baseline_resource_ids', [])
    if not isinstance(baseline_resources, list) or any(not isinstance(x, str) or not x.strip() for x in baseline_resources):
        raise InputError('baseline_resource_ids must contain unique nonempty resource IDs.')
    baseline_resources = [x.strip() for x in baseline_resources]
    if len(baseline_resources) != len(set(baseline_resources)):
        raise InputError('baseline_resource_ids must contain unique nonempty resource IDs.')
    changes = case.get('changes', [])
    if not isinstance(changes, list) or len(changes) > MAX_CHANGES:
        raise InputError(f'changes must be a list of at most {MAX_CHANGES}.')
    validated = []
    seen_ids = set()
    for i, raw in enumerate(changes):
        if not isinstance(raw, dict):
            raise InputError(f'changes[{i}] must be an object.')
        cid = raw.get('id')
        if not isinstance(cid, str) or not cid.strip():
            raise InputError('Change IDs must be nonempty and unique.')
        cid = cid.strip()
        if cid in seen_ids:
            raise InputError('Change IDs must be nonempty and unique.')
        seen_ids.add(cid)
        kind = raw.get('type')
        if not isinstance(kind, str) or kind not in ALLOWED_KINDS:
            raise InputError(f'{cid}: unsupported change type.')
        if raw.get('unit') != UNIT:
            raise InputError(f'{cid}: incompatible unit (expected {UNIT}).')
        value = number(raw.get('value'), f'{cid}.value')
        if value == 0:
            raise InputError(f'{cid}.value must be greater than 0.')
        availability = raw.get('availability')
        confirmation = raw.get('confirmation_state')
        if not isinstance(availability, str) or availability not in ALLOWED_AVAILABILITY:
            raise InputError(f'{cid}: unknown availability state.')
        if not isinstance(confirmation, str) or confirmation not in ALLOWED_CONFIRMATION:
            raise InputError(f'{cid}: unknown confirmation state.')
        resource = raw.get('resource_id')
        if resource is not None:
            if not isinstance(resource, str) or not resource.strip():
                raise InputError(f'{cid}.resource_id must be a string or null.')
            resource = resource.strip()
        cost = raw.get('cost')
        if cost is not None:
            cost = number(cost, f'{cid}.cost')
        validated.append({'id': cid, 'type': kind, 'value': value, 'unit': UNIT,
                          'availability': availability, 'confirmation_state': confirmation,
                          'resource_id': resource, 'cost': cost})
    return {'target_units':target, 'capacity_units':capacity, 'required_hours':duration,
            'readiness':readiness, 'now':now, 'deadline':deadline,
            'completed':case.get('completed', False), 'changes':validated, 'unit': UNIT,
            'baseline_resource_ids':set(baseline_resources)}


def check(case: dict, selected: tuple[dict,...]=()) -> dict | None:
    resources = [x.get('resource_id') for x in selected if x.get('resource_id')]
    if len(resources) != len(set(resources)) or set(resources).intersection(case['baseline_resource_ids']):
        return None  # no double-booking of a single resource
    capacity = case['capacity_units'] + sum(x['value'] for x in selected if x['type']=='add_capacity')
    reduction = sum(x['value'] for x in selected if x['type']=='reduce_target')
    # Individual finite inputs may still overflow when added together.
    # Never report an infinite projected resource or target as feasible.
    if not isfinite(capacity) or not isfinite(reduction):
        return None
    if reduction > case['target_units']:
        return None  # cannot shrink the target below zero
    target = case['target_units'] - reduction
    constraints = []
    readiness = case['readiness']
    constraints.append({'id':'readiness','status':'pass' if readiness=='yes' else ('unknown' if readiness=='unknown' else 'blocked'),
                        'explanation':{'yes':'User reports the location is ready; this is not safety certification.',
                                       'no':'User reports the proposed handling location is not ready.',
                                       'unknown':'Handling-location readiness has not been confirmed.'}[readiness],
                        'provenance':'user-reported'})
    cap_pass = capacity >= target
    constraints.append({'id':'capacity','status':'pass' if cap_pass else 'blocked',
                        'explanation':f'Declared target {target:g} {UNIT}s; projected capacity {capacity:g} {UNIT}s; shortfall {max(0,target-capacity):g}.',
                        'provenance':'user-reported + configured assumption'})
    available_hours = None
    time_slack_hours = None
    if case['deadline'] is None:
        time_status='unknown'
        time_exp='No user-selected preparation deadline provided; time slack is unknown.'
    else:
        available_hours=(case['deadline']-case['now']).total_seconds()/3600
        time_slack_hours=available_hours-case['required_hours']
        time_status='pass' if time_slack_hours>=0 else 'blocked'
        time_exp=(f'Time until candidate deadline {available_hours:.2f} h; '
                  f'user-configured task duration {case["required_hours"]:g} h; '
                  f'time slack {time_slack_hours:+.2f} h. '
                  'This is a user-selected deadline, not a certified rain onset or safe operating threshold.')
    constraints.append({'id':'timing','status':time_status,'explanation':time_exp,'provenance':'user-reported + configured assumption'})
    known_blockers = [c['id'] for c in constraints if c['status']=='blocked']
    status = 'unknown' if any(c['status']=='unknown' for c in constraints) else (
             'blocked' if any(c['status']=='blocked' for c in constraints) else 'feasible')
    return {'status':status, 'constraints':constraints,'known_blockers':known_blockers,
            'time_budget':{'candidate_deadline':case['deadline'].isoformat() if case['deadline'] else None,
                           'evaluated_at':case['now'].isoformat(),
                           'available_hours':available_hours,
                           'required_hours':case['required_hours'],
                           'time_slack_hours':time_slack_hours,
                           'basis':'user-selected candidate deadline; not a forecasted rain onset or safety certification'},
            'projected_capacity_units':capacity,
            'projected_target_units':target,'original_target_unhandled_units':reduction,
            'shortfall_units':max(0,target-capacity)}


def evaluate(raw: dict) -> dict:
    case=validate(raw)
    baseline=check(case)
    assert baseline is not None
    if case['completed']:
        return {'status':'completed', 'baseline':baseline, 'packages':[],
                'excluded_changes':[], 'message':'The action is declared completed. The engine will not reverse a completed action.',
                'meaning':'resource-feasibility only; no agricultural safety certification', 'unit':UNIT}
    eligible=[]; excluded=[]
    for c in case['changes']:
        if c.get('resource_id') in case['baseline_resource_ids']:
            excluded.append({'id':c['id'],'reason':'Duplicate baseline resource cannot be counted twice.',
                             'availability':c['availability'],'confirmation_state':c['confirmation_state']})
        elif c['availability']=='available' and c['confirmation_state']=='confirmed':
            eligible.append(c)
        else:
            excluded.append({'id':c['id'],'reason':'Not counted: availability and confirmation must both be explicitly confirmed (requested ≠ confirmed).',
                             'availability':c['availability'],'confirmation_state':c['confirmation_state']})
    packages=[]
    if baseline['status']!='feasible':
        for size in range(1,len(eligible)+1):
            for group in combinations(eligible,size):
                ids=frozenset(c['id'] for c in group)
                if any(frozenset(p['change_ids']).issubset(ids) for p in packages):
                    continue
                result=check(case,group)
                if result is None or result['status']!='feasible':
                    continue
                packages.append({'change_ids':[c['id'] for c in group],
                                 'projected':result,
                                 'warning':'Conditional: selected, permitted changes must actually be completed; availability/confirmation is not completion.',
                                 'objective_changed':result['original_target_unhandled_units']>0})
    if baseline['status']=='feasible':
        message='Already feasible under declared assumptions; no additional change is needed.'
    elif baseline['status']=='unknown':
        message='One or more prerequisites are unknown; the plan cannot be called feasible.'
        if baseline['known_blockers']:
            message += ' Confirmed blockers: '+', '.join(baseline['known_blockers'])+'.'
    elif not packages:
        message='No inclusion-minimal feasible package exists among confirmed permissible changes.'
    else:
        message='Inclusion-minimal conditional packages found. Minimal does not mean cheapest or most effective.'
    return {'status':baseline['status'],'baseline':baseline,'packages':packages,
            'excluded_changes':excluded,'message':message,'meaning':'resource-feasibility only; no agricultural safety certification',
            'unit':UNIT,'method':'enumerate eligible subsets; prune supersets of feasible sets'}
