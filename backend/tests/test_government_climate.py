"""Synthetic schema fixtures in tests only; no generated farm or weather data in production."""
from datetime import datetime, timezone

from fastapi.testclient import TestClient

from unlockplan.api import app
from unlockplan.govclimate import (
    GovernmentClimateError, build_url, date_window, get_government_climate,
    validate_daily,
)

NOW = datetime(2026, 11, 1, 12, 0, tzinfo=timezone.utc)


def provider_fixture():
    return {"properties": {"parameter": {
        "PRECTOTCORR": {"20261024": 4.25, "20261025": -999, "20261026": 0},
        "T2M": {"20261024": 25.5, "20261025": 26.1, "20261026": -999},
    }}}


def test_daily_window_and_government_source():
    start, end = date_window(NOW)
    assert start.isoformat() == "2026-10-08"
    assert end.isoformat() == "2026-10-27"
    url = build_url(NOW)
    assert url.startswith("https://power.larc.nasa.gov/api/temporal/daily/point?")
    assert "community=AG" in url and "PRECTOTCORR%2CT2M" in url
    assert "latitude=19.84" in url and "longitude=75.89" in url


def test_missing_stays_missing_and_no_fake_forecast():
    result = get_government_climate(fetcher=lambda url: provider_fixture(), now=NOW)
    assert result["status"] == "retrieved_live"
    assert result["data_kind"] == "government_gridded_historical"
    assert len(result["days"]) == 3
    assert result["days"][1]["precipitation_mm_day"] is None
    assert result["days"][2]["precipitation_mm_day"] == 0
    assert result["days"][2]["temperature_c"] is None
    assert "forecast" in result["notice"] and "crop-safety" in result["notice"]
    assert result["latest_data_date"] == "2026-10-26"


def test_bogus_and_empty_are_rejected():
    start, end = date_window(NOW)
    for bogus in ({}, {"properties": {"parameter": {
        "PRECTOTCORR": {"20261024": -3}, "T2M": {"20261024": 20},
    }}}, {"properties": {"parameter": {
        "PRECTOTCORR": {"20261024": -999}, "T2M": {"20261024": -999},
    }}}):
        try:
            validate_daily(bogus, start, end)
        except GovernmentClimateError:
            pass
        else:
            raise AssertionError("Invalid/unavailable government payload accepted")


def test_fetch_failure_returns_unavailable_not_sample_weather():
    def fail(_):
        raise TimeoutError("provider timeout")
    result = get_government_climate(fetcher=fail, now=NOW)
    assert result["status"] == "unavailable"
    assert result["days"] == []
    assert "could not be verified" in result["notice"]


def test_real_route_exists_and_no_test_fixtures_are_served(monkeypatch):
    import unlockplan.api as module
    monkeypatch.setattr(module, "get_government_climate", lambda refresh=False: {
        "status": "unavailable", "days": [], "source": "NASA POWER (US government)",
        "notice": "NASA upstream unavailable"
    })
    response = TestClient(app).get("/api/government-climate")
    assert response.status_code == 200
    assert response.json()["days"] == []
    assert response.json()["status"] == "unavailable"
