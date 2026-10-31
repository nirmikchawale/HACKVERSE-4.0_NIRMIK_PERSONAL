from fastapi.testclient import TestClient
from unlockplan.api import app
from test_engine import fixture

client=TestClient(app)

def test_health_and_sources():
 assert client.get('/api/health').status_code==200
 r=client.get('/api/sources');assert r.status_code==200
 assert len(r.json()['sources'])>=3 and len(r.json()['operational_rules'])>=4

def test_evaluation_endpoint():
 r=client.post('/api/evaluate',json=fixture())
 assert r.status_code==200
 assert {tuple(p['change_ids']) for p in r.json()['packages']}=={('A',),('B','C')}

def test_invalid_input_http_422():
 case=fixture();case['capacity_units']=-10
 assert client.post('/api/evaluate',json=case).status_code==422

def test_home():
 r=client.get('/'); assert r.status_code==200 and 'text/html' in r.headers.get('content-type','')
