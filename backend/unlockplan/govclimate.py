"""NASA POWER: independently sourced historical agroclimate evidence for Jalna.

This is a US-government gridded data product, NOT a live station observation,
a future forecast, a farmer soil measurement, or an agronomic safety rule.
No demonstration numbers are served. API failure returns unavailable.
"""
from __future__ import annotations

import json
import math
from datetime import date, datetime, timedelta, timezone
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

BASE = "https://power.larc.nasa.gov/api/temporal/daily/point"
DOCS = "https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
LAT, LON = 19.84, 75.89
_CACHE = {"url": None, "at": None, "response": None}
_LOCK = Lock()
_CACHE_SECONDS = 1800


class GovernmentClimateError(ValueError):
    pass


def date_window(now: datetime) -> tuple[date, date]:
    """Conservative historical window; recent NASA data can lag several days."""
    if now.tzinfo is None or now.utcoffset() is None:
        raise GovernmentClimateError("Timezone-aware UTC time is required.")
    end = now.astimezone(timezone.utc).date() - timedelta(days=5)
    return end - timedelta(days=19), end


def build_url(now: datetime) -> str:
    start, end = date_window(now)
    params = {
        "parameters": "PRECTOTCORR,T2M",
        "community": "AG",
        "latitude": LAT,
        "longitude": LON,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "format": "JSON",
    }
    return BASE + "?" + urlencode(params)


def _reading(value: object, *, rainfall: bool) -> float | None:
    # NASA POWER documents -999 as missing. Missing is NOT zero.
    if value == -999 and type(value) in (float, int):
        return None
    if type(value) not in (int, float) or not math.isfinite(value):
        raise GovernmentClimateError("Invalid numeric response from NASA POWER.")
    if rainfall and value < 0:
        raise GovernmentClimateError("Negative nonmissing NASA rainfall.")
    return float(value)


def validate_daily(payload: object, start: date, end: date) -> list[dict]:
    if not isinstance(payload, dict):
        raise GovernmentClimateError("NASA daily response must be a JSON object.")
    values = payload.get("properties", {}).get("parameter") if isinstance(payload.get("properties"), dict) else None
    if not isinstance(values, dict):
        raise GovernmentClimateError("Missing NASA parameter records.")
    precipitation, temperature = values.get("PRECTOTCORR"), values.get("T2M")
    if not isinstance(precipitation, dict) or not isinstance(temperature, dict):
        raise GovernmentClimateError("Missing NASA rainfall or temperature series.")
    dates = sorted(set(precipitation).union(temperature))
    if len(dates) > 40:
        raise GovernmentClimateError("NASA daily response exceeds bounded window.")
    rows = []
    for key in dates:
        if not isinstance(key, str) or len(key) != 8 or not key.isdigit():
            raise GovernmentClimateError("Invalid NASA date key.")
        try:
            day = datetime.strptime(key, "%Y%m%d").date()
        except ValueError:
            raise GovernmentClimateError("Invalid NASA calendar date.") from None
        if not start <= day <= end:
            raise GovernmentClimateError("NASA data outside requested calendar period.")
        rain = _reading(precipitation[key], rainfall=True) if key in precipitation else None
        temp = _reading(temperature[key], rainfall=False) if key in temperature else None
        # Do not publish zero-filled or entirely absent days.
        if rain is not None or temp is not None:
            rows.append({"date": day.isoformat(), "precipitation_mm_day": rain,
                         "temperature_c": temp})
    if not rows:
        raise GovernmentClimateError("NASA returned no usable daily observations.")
    return rows


def get_government_climate(*, refresh: bool = False, fetcher=None,
                           now: datetime | None = None) -> dict:
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    start, end = date_window(now)
    url = build_url(now)
    if fetcher is None and not refresh:
        with _LOCK:
            cached = _CACHE["response"]
            stamp = _CACHE["at"]
            if cached is not None and _CACHE["url"] == url and stamp is not None:
                age = (now - stamp).total_seconds()
                if 0 <= age <= _CACHE_SECONDS:
                    return {**cached, "status": "cached_recent"}
    try:
        if fetcher is not None:
            raw = fetcher(url)
        else:
            request = Request(url, headers={
                "User-Agent": "AgriForesight-educational-climate-evidence/1.0",
                "Accept": "application/json",
            })
            with urlopen(request, timeout=12) as response:
                content = response.read(262145)
                if len(content) > 262144:
                    raise GovernmentClimateError("NASA response exceeds size limit.")
                raw = json.loads(content)
        rows = validate_daily(raw, start, end)
        result = {
            "status": "retrieved_live",
            "data_kind": "government_gridded_historical",
            "source": "NASA POWER (US government)",
            "source_url": DOCS,
            "request_url": url,
            "retrieved_at_utc": now.isoformat(),
            "location": "Jalna district approximate reference, Maharashtra, India",
            "latitude_reference": LAT,
            "longitude_reference": LON,
            "date_start": start.isoformat(),
            "date_end": end.isoformat(),
            "latest_data_date": rows[-1]["date"],
            "units": {"precipitation": "mm/day", "temperature": "degrees C"},
            "days": rows,
            "notice": ("Historical NASA POWER gridded satellite/reanalysis information, "
                       "typically delayed; not station rain, an operational forecast, "
                       "farm-specific soil data, or a crop-safety threshold."),
        }
        if fetcher is None:
            with _LOCK:
                _CACHE.update({"url": url, "at": now, "response": result})
        return result
    except (HTTPError, URLError, OSError, ValueError, TypeError, KeyError,
            TimeoutError, json.JSONDecodeError) as exc:
        return {
            "status": "unavailable",
            "data_kind": "government_gridded_historical",
            "source": "NASA POWER (US government)",
            "source_url": DOCS,
            "request_url": url,
            "location": "Jalna district approximate reference, Maharashtra, India",
            "days": [],
            "notice": ("NASA government historical data could not be verified now. "
                       "No substitute or invented data is displayed."),
            "error_type": type(exc).__name__,
        }
