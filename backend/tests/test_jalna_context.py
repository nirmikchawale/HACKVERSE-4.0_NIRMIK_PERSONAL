"""Jalna context contracts: production values only come from actual provider replies."""
import asyncio
from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from unlockplan import jalna_context as jc
import unlockplan.api as api
import unlockplan.edge as edge


NOW = datetime(2026, 11, 1, 7, 30, tzinfo=timezone.utc)


def fixture(*, missing_soil=False):
    return {
        "latitude": 19.84, "longitude": 75.89,
        "timezone": "Asia/Kolkata", "utc_offset_seconds": 19800,
        "current_units": {
            "time": "iso8601", "interval": "seconds",
            "temperature_2m": "°C", "relative_humidity_2m": "%",
            "wind_speed_10m": "km/h", "soil_temperature_0cm": "°C",
            "soil_moisture_0_to_1cm": "m³/m³",
        },
        "current": {
            "time": "2026-11-01T13:00", "interval": 900,
            "temperature_2m": 29.2, "relative_humidity_2m": 64,
            "wind_speed_10m": 8.2, "soil_temperature_0cm": 33.4,
            "soil_moisture_0_to_1cm": None if missing_soil else 0.19,
        },
    }


def test_fixed_jalna_endpoint_and_source_attribution():
    u = jc.build_url()
    assert u.startswith("https://api.open-meteo.com/v1/forecast?")
    assert "latitude=19.84" in u and "longitude=75.89" in u
    assert "soil_moisture_0_to_1cm" in u
    assert "soil_temperature_0cm" in u
    assert "current=" in u
    ref = jc.soil_reference()
    assert ref["reference_year"] == 2011
    assert [s["reported_percent"] for s in ref["classes"]] == [13.37, 21.36, 65.27]
    assert "icar-crida.res.in" in ref["source_url"]
    assert ref["soil_type_for_individual_field"] is None
    assert ref["soil_npk_for_individual_field"] is None
    assert "636.77" in ref["disclosure"]


def test_current_provider_values_are_validated_and_classification_is_not_inferred():
    r = jc.get_jalna_context(fetcher=lambda url: fixture(), now=NOW)
    assert r["conditions"]["status"] == "retrieved_live"
    assert r["conditions"]["model"]["values"]["soil_moisture_0_to_1cm"] == .19
    assert r["conditions"]["model"]["valid_time_local"] == "2026-11-01T13:00"
    assert r["soil"]["soil_type_for_individual_field"] is None
    assert r["decision_integration"] == "context_only_not_used_by_feasibility_engine"


def test_missing_soil_moisture_is_null_not_dry_ground():
    r = jc.get_jalna_context(fetcher=lambda url: fixture(missing_soil=True), now=NOW)
    m = r["conditions"]["model"]
    assert m["values"]["soil_moisture_0_to_1cm"] is None
    assert "soil_moisture_0_to_1cm" in m["missing_fields"]


def test_bad_source_payloads_fail_closed_without_fake_live_values():
    for change in [
        {"timezone": "UTC"},
        {"latitude": 44.0},
        {"current": {"time": "2026-11-01T13:00", "temperature_2m": -99}},
        {"current": {"time": "2026-01-01T13:00", "temperature_2m": 21}},
    ]:
        raw=fixture()
        raw.update(change)
        got=jc.get_jalna_context(fetcher=lambda url: raw, now=NOW)
        assert got["conditions"]["status"] == "unavailable"
        assert got["conditions"]["model"] is None
        assert len(got["soil"]["classes"]) == 3
    got=jc.get_jalna_context(fetcher=lambda url: (_ for _ in ()).throw(TimeoutError("down")),now=NOW)
    assert got["conditions"]["status"] == "unavailable"


def test_same_native_and_edge_context_schema_and_api(monkeypatch):
    edge._jalna_cache=None
    async def fake(url,**kwargs):
        assert url==jc.build_url()
        return fixture()
    monkeypatch.setattr(edge, "_request_json", fake)
    er=asyncio.run(edge.edge_jalna_context(now=NOW))
    nr=jc.get_jalna_context(fetcher=lambda _: fixture(),now=NOW)
    assert er["soil"]==nr["soil"]
    assert er["conditions"]["model"]==nr["conditions"]["model"]
    again=asyncio.run(edge.edge_jalna_context(now=NOW+timedelta(minutes=3)))
    assert again["conditions"]["status"]=="cached_recent"

    monkeypatch.setattr(api,"get_jalna_context",lambda refresh=False: nr)
    native=TestClient(api.app).get("/api/jalna-agri-context")
    assert native.status_code==200
    assert native.json()["soil"]==nr["soil"]


def test_edge_unavailable_keeps_historical_reference(monkeypatch):
    edge._jalna_cache=None
    async def fail(url,**kwargs):raise TimeoutError("provider unavailable")
    monkeypatch.setattr(edge,"_request_json",fail)
    got=asyncio.run(edge.edge_jalna_context(now=NOW))
    assert got["conditions"]["status"]=="unavailable"
    assert got["conditions"]["model"] is None
    assert got["soil"]["classes"][0]["id"]=="deep_black"
