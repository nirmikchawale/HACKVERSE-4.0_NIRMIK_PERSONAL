"""Validate Tanisha's immutable handoff data; never execute its capture tool in CI."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path

BUNDLE = Path(__file__).resolve().parents[2] / "contrib" / "tanishacoding"

def load(name: str):
    return json.loads((BUNDLE / "data" / name).read_text(encoding="utf-8"))

def test_original_manifest_sha256():
    lines = (BUNDLE / "MANIFEST.sha256").read_text(encoding="utf-8").splitlines()
    assert len(lines) == 7
    seen = set()
    for line in lines:
        digest, rel = line.split("  ", 1)
        path = Path(rel)
        assert not path.is_absolute() and ".." not in path.parts
        assert str(path) not in seen
        seen.add(str(path))
        assert hashlib.sha256((BUNDLE / path).read_bytes()).hexdigest() == digest

def test_india_reference_contains_28_states_and_8_uts():
    data = load("india_states_uts.json")
    assert data["states_count"] == len(data["states"]) == 28
    assert data["union_territories_count"] == len(data["union_territories"]) == 8
    assert len(set(data["states"] + data["union_territories"])) == 36
    assert "Maharashtra" in data["states"]

def test_location_and_api_contracts_retain_scope_guard():
    contract = load("p0_data_contract.json")
    assert contract["location"]["other_indian_locations_supported_by_engine"] is False
    paths = {(item["method"],item["path"]) for item in contract["routes"]}
    assert paths == {("GET","/api/health"),("GET","/api/sources"),("GET","/api/forecast"),("POST","/api/evaluate"),("POST","/api/compare"),("POST","/api/replan")}
    assert contract["location"]["timezone"] == "Asia/Kolkata"

def test_historical_soil_cannot_be_construed_as_live_measurement():
    soil = load("jalna_historical_agronomy.json")
    assert soil["status"] == "historical_context_not_current"
    assert soil["quality_audit"]["verified_current_farm_soil"] is False
    assert soil["source"]["document_year_indicated"] == 2011
    assert sum(a["area_1000_ha"] for a in soil["district_soil_categories_historical"]) == 636.77
    assert abs(sum(a["table_percent"] for a in soil["district_soil_categories_historical"])-100) < 0.01
    assert soil["quality_audit"]["district_geographical_area_1000_ha_as_reported_in_document"] != 636.77

def test_catalog_explicitly_tracks_unavailable_sources():
    catalog = load("source_catalog.json")
    assert len({s["id"] for s in catalog["sources"]}) == len(catalog["sources"])
    assert next(s for s in catalog["sources"] if s["id"]=="isric_soilgrids")["status"].startswith("REST_API_REPORTED_PAUSED")
    assert catalog["sources"][0]["kind"] == "forecast_model"
