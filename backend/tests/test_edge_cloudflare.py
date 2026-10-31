"""Cloudflare adapter tests use synthetic fixtures only inside the test suite."""
import asyncio
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient

import unlockplan.edge as edge
from unlockplan.weather import LAT, LON, TIMEZONE
from unlockplan.api import app as vercel_app

NOW = datetime(2026, 11, 1, 9, 0, tzinfo=timezone.utc)


def forecast_fixture():
    start=datetime(2026, 11, 1, 0, 0)
    return {
        "timezone": TIMEZONE, "utc_offset_seconds": 19800,
        "latitude": LAT, "longitude": LON,
        "hourly_units": {"time":"iso8601","precipitation":"mm","precipitation_probability":"%"},
        "hourly": {
            "time": [(start+timedelta(hours=i)).isoformat(timespec="minutes") for i in range(72)],
            "precipitation": [0.0]*72,
            "precipitation_probability": [0.0]*72,
        },
    }


def test_cloudflare_routes_reuse_exact_engine_contract():
    case={"now":"2026-11-01T09:00:00+00:00","deadline":"2099-01-01T12:00:00+05:30",
          "target_units":10,"capacity_units":6,"required_hours":1,"readiness":"yes",
          "unit":"handling_unit","completed":False,"baseline_resource_ids":[],"changes":[]}
    candidate=TestClient(edge.app)
    baseline=TestClient(vercel_app)
    left=candidate.post("/api/evaluate",json=case)
    right=baseline.post("/api/evaluate",json=case)
    assert left.status_code==right.status_code==200
    assert left.json()==right.json()
    cmp={"before":case,"after":{**case,"capacity_units":10}}
    assert candidate.post("/api/compare",json=cmp).json()==baseline.post("/api/compare",json=cmp).json()
    assert candidate.post("/api/evaluate",json={**case,"target_units":-1}).status_code==422
    assert candidate.post("/api/replan",json={**cmp,"selected_hour_local":"not-a-time"}).status_code==422
    sources=candidate.get("/api/sources")
    assert sources.status_code==200
    assert "nasa_power_agroclimate" in [x["id"] for x in sources.json()["sources"]]


def test_real_provider_schema_is_preserved(monkeypatch):
    edge._forecast_cache=None
    async def fake(url,**_):
        assert url.startswith("https://api.open-meteo.com/")
        return forecast_fixture()
    monkeypatch.setattr(edge,"_request_json",fake)
    got=asyncio.run(edge.edge_forecast(now=NOW))
    assert got["status"]=="retrieved_live"
    assert got["validated"]["timezone"]=="Asia/Kolkata"
    assert len(got["hours"])==72
    second=asyncio.run(edge.edge_forecast(now=NOW+timedelta(minutes=5)))
    assert second["status"]=="cached_recent"
    assert second["retrieved_at_utc"]==got["retrieved_at_utc"]


def test_invalid_weather_fails_closed(monkeypatch):
    edge._forecast_cache=None
    async def bad(url,**_):
        return {"hours": [1,2,3]}
    monkeypatch.setattr(edge,"_request_json",bad)
    got=asyncio.run(edge.edge_forecast(now=NOW))
    assert got["status"]=="unavailable" and got["hours"]==[]


def test_nasa_missing_sentinel_and_failure(monkeypatch):
    edge._nasa_cache=None
    async def fake(url,**_):
        assert url.startswith("https://power.larc.nasa.gov/")
        return {"properties":{"parameter":{
          "PRECTOTCORR":{"20261020":-999,"20261021":3.5},
          "T2M":{"20261020":24.1,"20261021":25.3},
        }}}
    monkeypatch.setattr(edge,"_request_json",fake)
    got=asyncio.run(edge.edge_government_climate(now=NOW))
    assert got["status"]=="retrieved_live"
    assert got["days"][0]["precipitation_mm_day"] is None
    assert got["days"][1]["precipitation_mm_day"]==3.5
    assert got["data_kind"]=="government_gridded_historical"
    edge._nasa_cache=None
    async def fail(url,**_): raise TimeoutError("No provider reply")
    monkeypatch.setattr(edge,"_request_json",fail)
    missing=asyncio.run(edge.edge_government_climate(now=NOW))
    assert missing["status"]=="unavailable" and missing["days"]==[]


def test_worker_contract_does_not_use_tempfile_or_sync_provider():
    from pathlib import Path
    code=Path(edge.__file__).read_text()
    assert "urlopen(" not in code
    assert "write_text(" not in code
    assert 'AsyncClient(' in code
