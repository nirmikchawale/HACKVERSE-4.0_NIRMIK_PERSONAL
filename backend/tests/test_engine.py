import copy
from datetime import datetime, timedelta, timezone
import pytest
from unlockplan.engine import evaluate, InputError, check, validate

NOW='2026-11-01T08:00:00+05:30'; DEADLINE='2026-11-01T12:00:00+05:30'

def fixture():
 return {'target_units':10, 'capacity_units':6, 'unit':'handling_unit', 'required_hours':2,
         'readiness':'yes','now':NOW,'deadline':DEADLINE, 'completed':False,
         'changes':[
           {'id':'A','type':'add_capacity','value':4,'unit':'handling_unit','resource_id':'cover-a','availability':'available','confirmation_state':'confirmed','cost':None},
           {'id':'B','type':'add_capacity','value':2,'unit':'handling_unit','resource_id':'cover-b','availability':'available','confirmation_state':'confirmed','cost':None},
           {'id':'C','type':'reduce_target','value':2,'unit':'handling_unit','resource_id':None,'availability':'available','confirmation_state':'confirmed','cost':None},
           {'id':'D','type':'add_capacity','value':4,'unit':'handling_unit','resource_id':'cover-d','availability':'available','confirmation_state':'requested','cost':None},
         ]}

def keysets(r): return {frozenset(p['change_ids']) for p in r['packages']}

def test_inclusion_minimal_fixture():
 r=evaluate(fixture())
 assert keysets(r)=={frozenset(['A']),frozenset(['B','C'])}
 assert r['status']=='blocked' and r['baseline']['shortfall_units']==4
 assert {c['id'] for c in r['excluded_changes']}=={'D'}
 assert next(p for p in r['packages'] if set(p['change_ids'])=={'B','C'})['projected']['original_target_unhandled_units']==2

def test_remove_any_member_is_infeasible():
 f=fixture(); c=validate(f)
 for p in evaluate(f)['packages']:
  for removed in p['change_ids']:
   reduced=tuple(x for x in c['changes'] if x['id'] in p['change_ids'] and x['id']!=removed)
   assert check(c,reduced)['status']!='feasible'

def test_no_solution():
 f=fixture();f['changes']=[];assert evaluate(f)['packages']==[]
 assert 'No inclusion-minimal' in evaluate(f)['message']

def test_unknown_readiness_never_passes():
 f=fixture();f['readiness']='unknown';r=evaluate(f)
 assert r['status']=='unknown' and not r['packages']
 assert any(c['id']=='readiness' and c['status']=='unknown' for c in r['baseline']['constraints'])

def test_requested_capacity_never_counted():
 f=fixture();f['changes']=[f['changes'][-1]]
 assert evaluate(f)['packages']==[]

def test_duplicate_resource_prevents_double_count():
 f=fixture();f['changes']=[f['changes'][1],dict(f['changes'][1],id='E',resource_id='cover-b')]
 assert evaluate(f)['packages']==[]

def test_incompatible_unit_rejected():
 f=fixture();f['changes'][0]['unit']='kg'
 with pytest.raises(InputError,match='incompatible unit'):evaluate(f)

def test_earlier_deadline_recalculates():
 f=fixture();f['capacity_units']=10;f['changes']=[]
 assert evaluate(f)['status']=='feasible'
 f['deadline']='2026-11-01T09:00:00+05:30'
 assert evaluate(f)['status']=='blocked'
 assert any(c['id']=='timing' and c['status']=='blocked' for c in evaluate(f)['baseline']['constraints'])

def test_missing_deadline_unknown():
 f=fixture();f['deadline']=None
 assert evaluate(f)['status']=='unknown' and not evaluate(f)['packages']

def test_completed_never_undone():
 f=fixture();f['completed']=True
 r=evaluate(f);assert r['status']=='completed' and r['packages']==[]

def test_negative_nan_bool_rejected():
 for val in [-1,float('nan'),float('inf'),True,'5']:
  f=fixture();f['capacity_units']=val
  with pytest.raises(InputError): evaluate(f)

def test_explanations_trace_to_constraints():
 r=evaluate(fixture())
 assert {c['id'] for c in r['baseline']['constraints']}=={'capacity','readiness','timing'}
 assert all(c['explanation'] and c['provenance'] for c in r['baseline']['constraints'])

def test_no_unconfirmed_unknown_as_zero():
 f=fixture();f['changes'][0]['confirmation_state']='unknown'
 assert keysets(evaluate(f))=={frozenset(['B','C'])}

def test_reduction_cannot_exceed_target():
 f=fixture();f['changes'][2]['value']=12
 assert keysets(evaluate(f))=={frozenset(['A'])}

def test_conflicting_capacity_resources_may_not_stack():
 f=fixture();f['target_units']=10;f['capacity_units']=6
 f['changes']=[dict(f['changes'][1],id='B'),dict(f['changes'][1],id='X')]
 assert evaluate(f)['packages']==[]


def test_baseline_resource_not_double_counted():
 f=fixture();f['baseline_resource_ids']=['cover-a'];r=evaluate(f)
 assert {p['change_ids'][0] for p in r['packages'] if len(p['change_ids'])==1}==set()
 assert keysets(r)=={frozenset(['B','C'])}
 assert any(x['id']=='A' for x in r['excluded_changes'])

def test_duplicate_baseline_identifiers_rejected():
 f=fixture();f['baseline_resource_ids']=['cover-a','cover-a']
 with pytest.raises(InputError,match='unique'):evaluate(f)
