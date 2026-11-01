"""Regression tests for authentic climate history and example-only feasibility catalog."""
from datetime import datetime, timezone, timedelta

from unlockplan.govclimate import date_window, get_government_climate
from unlockplan.scenarios import EXAMPLES, get_scenarios


NOW = datetime(2026, 11, 1, 2, 0, tzinfo=timezone.utc)


def test_catalog_has_exactly_one_hundred_engine_calculated_examples():
    payload = get_scenarios(NOW)
    assert payload["count"] == len(payload["records"]) == len(EXAMPLES) * 5 == 100
    assert payload["data_kind"] == "illustrative_planning_cases"
    assert "not government observations" in payload["notice"].lower()
    assert len({item["id"] for item in payload["records"]}) == 100
    assert all(item["input_kind"] == "configured_example_not_farm_observation" for item in payload["records"])
    assert all(item["result"]["unit"] == "handling_unit" for item in payload["records"])
    assert all(len(item["result"]["baseline"]["constraints"]) == 3 for item in payload["records"])
    status_set = {item["result"]["status"] for item in payload["records"]}
    assert {"feasible", "blocked", "unknown"} <= status_set
    # A requested-only resource must never count as confirmed.
    requested = next(item for item in payload["records"] if item["id"] == "JAL-EX-005")
    assert requested["result"]["status"] == "blocked"
    assert not requested["result"]["packages"]
    assert requested["result"]["excluded_changes"]
    # A known shortfall can have an inclusion-minimal confirmed remedy.
    assisted = payload["records"][0]
    assert assisted["result"]["baseline"]["shortfall_units"] == 20
    assert assisted["result"]["packages"][0]["projected"]["shortfall_units"] == 0


def test_scenario_catalog_rejects_naive_evaluation_clock():
    try:
        get_scenarios(datetime(2026, 11, 1))
        assert False, "Naive evaluation time must fail"
    except ValueError:
        pass


def test_government_window_is_twenty_distinct_historical_days():
    start, end = date_window(NOW)
    assert (end - start).days == 19
    assert end == NOW.date() - timedelta(days=5)


def test_nasa_twenty_days_are_source_native_not_generated():
    start, end = date_window(NOW)
    dates = [(start + timedelta(days=i)).strftime("%Y%m%d") for i in range(20)]
    # This is a deterministic TEST FIXTURE, not a live government claim.
    rain = {day: float(i) / 10 for i, day in enumerate(dates)}
    temp = {day: 22.0 + float(i) / 10 for i, day in enumerate(dates)}
    response = get_government_climate(
        now=NOW,
        fetcher=lambda _: {"properties": {"parameter": {
            "PRECTOTCORR": rain, "T2M": temp
        }}},
    )
    assert response["status"] == "retrieved_live"
    assert len(response["days"]) == 20
    assert response["days"][0]["precipitation_mm_day"] == rain[dates[0]]
    assert response["days"][-1]["temperature_c"] == temp[dates[-1]]
    assert response["latest_data_date"] == end.isoformat()


def test_every_seed_exposes_five_named_variants():
    from collections import Counter
    rows = get_scenarios(NOW)["records"]
    assert Counter(row["variant"] for row in rows) == {
        "baseline": 20, "compressed_window": 20, "capacity_resilience": 20,
        "readiness_review": 20, "support_confirmation": 20,
    }
    assert all(sum(row["source_seed"] == f"JAL-SEED-{i:02d}" for row in rows) == 5
               for i in range(1, 21))
    assert all(isinstance(row["result"]["baseline"]["time_budget"]["time_slack_hours"], float)
               for row in rows)


def test_cloudflare_and_original_fastapi_share_scenario_engine():
    from fastapi.testclient import TestClient
    from unlockplan.api import app as normal
    from unlockplan.edge import app as cloudflare
    first = TestClient(normal).get("/api/feasibility-scenarios")
    second = TestClient(cloudflare).get("/api/feasibility-scenarios")
    assert first.status_code == second.status_code == 200
    a, b = first.json(), second.json()
    assert a["count"] == b["count"] == 100
    assert [r["id"] for r in a["records"]] == [r["id"] for r in b["records"]]
    assert [r["result"]["status"] for r in a["records"]] == [r["result"]["status"] for r in b["records"]]
