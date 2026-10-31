"""Phase A-02 regressions for identified backend correctness defects.
All values are synthetic software-test inputs, never farm observations.
"""
import pytest
from unlockplan.engine import InputError, evaluate
from test_engine import fixture, keysets


def test_aggregate_float_overflow_never_creates_feasible_package():
    case = fixture()
    case['target_units'] = 1.7e308
    case['capacity_units'] = 0
    case['changes'] = [dict(case['changes'][0], id='A', value=1e308),
                       dict(case['changes'][1], id='B', value=1e308)]
    result = evaluate(case)
    assert result['status'] == 'blocked'
    assert result['packages'] == []  # 1e308 + 1e308 must never count as infinity.


def test_whitespace_cannot_reuse_baseline_resource():
    case = fixture()
    case['baseline_resource_ids'] = ['cover-a']
    case['changes'] = [dict(case['changes'][0], resource_id=' cover-a ')]
    result = evaluate(case)
    assert result['packages'] == []
    assert {entry['id'] for entry in result['excluded_changes']} == {'A'}


def test_whitespace_cannot_double_count_same_optional_resource():
    case = fixture()
    case['changes'] = [dict(case['changes'][1], id='B', resource_id='cover-b'),
                       dict(case['changes'][1], id='E', resource_id=' cover-b ')]
    assert evaluate(case)['packages'] == []


def test_resource_and_change_ids_are_canonical_for_uniqueness():
    case = fixture()
    case['baseline_resource_ids'] = ['cover-a', ' cover-a ']
    with pytest.raises(InputError, match='unique'):
        evaluate(case)
    case = fixture()
    case['changes'] = [dict(case['changes'][0], id=' A '),
                       dict(case['changes'][1], id='A')]
    with pytest.raises(InputError, match='unique'):
        evaluate(case)


def test_known_blocker_is_visible_when_another_prerequisite_is_unknown():
    case = fixture()
    case['readiness'] = 'unknown'
    result = evaluate(case)
    assert result['status'] == 'unknown'  # Preserve the original conservative status.
    assert result['baseline']['known_blockers'] == ['capacity']
    assert 'Confirmed blockers: capacity' in result['message']
    assert result['packages'] == []


def test_pure_unknown_not_mislabeled_as_blocked():
    case = fixture()
    case['capacity_units'] = case['target_units']
    case['readiness'] = 'unknown'
    case['changes'] = []
    result = evaluate(case)
    assert result['status'] == 'unknown'
    assert result['baseline']['known_blockers'] == []
    assert 'Confirmed blockers:' not in result['message']
