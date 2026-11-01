"""Regression tests for authentic climate history and example-only feasibility catalog."""
from datetime import datetime, timezone, timedelta

from unlockplan.govclimate import date_window, get_government_climate
from unlockplan.scenarios import EXAMPLES, get_scenarios


NOW = datetime(2026, 11, 1, 2, 0, tzinfo=timezone.utc)


def test_catalog_has_exactly_twenty_engine_calculated_examples():
    payload = get_scenarios(NOW)
    assert payload["count"] == len(payload["records"]) == len(EXAMPLES) == 20
    assert payload["data_kind"] == "illustrative_planning_cases"
    assert "not government observations" in payload["notice"].lower()
    assert len({item["id"] for item in payload["records"]}) == 20
    assert all(item["input_kind"] == "configured_example_not_farm_observation" for item in payload["records"])
    assert all(item["result"]["unit"] == "handling_unit" for item in payload["records"])
    assert all(len(item["result"]["baseline"]["constraints"]) == 3 for item in payload["records"])
    status_set = {item["result"]["status"] for item in payload["records"]}
    assert {"feasible", "blocked", "unknown"} <= status_set
    # A requested-only resource must never count as confirmed.
    requested = next(item for item in payload["records"] if item["id"] == "JAL-EX-05")
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
