"""Jalna agriculture context: official historical district soil + live model-grid readings.

ICAR-CRIDA figures are from the 2011 Jalna district contingency plan, NOT
current measurements or parcel-specific soil classes. Open-Meteo provides a
separate weather model, NOT a weather station or an actual soil probe.
None of these readings enter the resource-feasibility engine.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from math import isfinite
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

LAT, LON = 19.84, 75.89
TZ = "Asia/Kolkata"
BASE = "https://api.open-meteo.com/v1/forecast"
DOCS = "https://open-meteo.com/en/docs"
SOIL_SOURCE = (
    "https://www.icar-crida.res.in/CP-2012/statewiseplans/"
    "Maharastra%28Pdf%29/MAU%2C%20Parbhani/"
    "Maharashtra%2033-Jalna-31-12-2011.pdf"
)
FRESH_MINUTES = 30
CURRENT_FIELDS = (
    "temperature_2m", "relative_humidity_2m", "wind_speed_10m",
    "soil_temperature_0cm", "soil_moisture_0_to_1cm",
)
UNITS = {
    "temperature_2m": "°C",
    "relative_humidity_2m": "%",
    "wind_speed_10m": "km/h",
    "soil_temperature_0cm": "°C",
    "soil_moisture_0_to_1cm": "m³/m³",
}
_CACHE: dict | None = None


class JalnaContextError(ValueError):
    pass


def soil_reference() -> dict:
    """Historical district profile, never interpreted as the selected farm's soil."""
    return {
        "status": "historical_reference",
        "data_kind": "historical_district_soil_classification",
        "location": "Jalna district, Maharashtra, India",
        "reference_year": 2011,
        "source": "ICAR-CRIDA Jalna Agriculture Contingency Plan, §1.4 (NBSS & LUP)",
        "source_url": SOIL_SOURCE,
        "area_unit": "thousand hectares",
        "classes": [
            {"id": "deep_black", "label": "Deep black soils",
             "reported_area_thousand_ha": 85.16, "reported_percent": 13.37},
            {"id": "medium_deep", "label": "Medium-deep soils",
             "reported_area_thousand_ha": 136.0, "reported_percent": 21.36},
            {"id": "shallow", "label": "Shallow soils",
             "reported_area_thousand_ha": 415.61, "reported_percent": 65.27},
        ],
        "soil_type_for_individual_field": None,
        "soil_ph_for_individual_field": None,
        "soil_npk_for_individual_field": None,
        "soil_moisture_measurement_for_field": None,
        "disclosure": (
            "These 2011 district categories are not an identification or test of "
            "a farmer's plot. The original soil-class areas sum to 636.77 "
            "thousand ha while its separate geographical-area table reports "
            "772.6 thousand ha; reported percentages must not be reinterpreted "
            "as a current whole-district area share. Ask for a local soil test."
        ),
    }


def build_url() -> str:
    return BASE + "?" + urlencode({
        "latitude": LAT, "longitude": LON,
        "current": ",".join(CURRENT_FIELDS),
        "timezone": TZ, "forecast_days": 1,
    })


def _number(value: object, name: str, low: float, high: float) -> float | None:
    if value is None:
        return None
    if type(value) not in (int, float) or not isfinite(value) or not low <= value <= high:
        raise JalnaContextError(f"Invalid model value: {name}")
    return float(value)


def validate_current(payload: object, now: datetime | None = None) -> dict:
    """Validate actual provider JSON; missing measurements remain null."""
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    if not isinstance(payload, dict):
        raise JalnaContextError("Open-Meteo response is not an object")
    if payload.get("timezone") != TZ or payload.get("utc_offset_seconds") != 19800:
        raise JalnaContextError("Unexpected timezone/offset")
    lat, lon = payload.get("latitude"), payload.get("longitude")
    if (type(lat) not in (float, int) or type(lon) not in (float, int)
            or not isfinite(lat) or not isfinite(lon)
            or abs(lat - LAT) > .5 or abs(lon - LON) > .5):
        raise JalnaContextError("Provider grid not near Jalna")
    values, units = payload.get("current"), payload.get("current_units")
    if not isinstance(values, dict) or not isinstance(units, dict):
        raise JalnaContextError("Missing current model fields or units")
    try:
        stamp = datetime.fromisoformat(values["time"])
        if stamp.tzinfo is not None:
            raise ValueError("Unexpected explicit timestamp offset")
        stamp = stamp.replace(tzinfo=ZoneInfo(TZ)).astimezone(timezone.utc)
    except (KeyError, TypeError, ValueError) as exc:
        raise JalnaContextError("Invalid current model time") from exc
    age = (now - stamp).total_seconds()
    if not -3600 <= age <= 21600:
        raise JalnaContextError("Model current time is too far from now")
    limits = {
        "temperature_2m": (-80, 70),
        "relative_humidity_2m": (0, 100),
        "wind_speed_10m": (0, 300),
        "soil_temperature_0cm": (-80, 90),
        "soil_moisture_0_to_1cm": (0, 1),
    }
    cleaned: dict[str, float | None] = {}
    for field in CURRENT_FIELDS:
        if field not in values:
            cleaned[field] = None
            continue
        if units.get(field) != UNITS[field]:
            raise JalnaContextError(f"Unexpected unit for {field}")
        cleaned[field] = _number(values[field], field, *limits[field])
    if not any(value is not None for value in cleaned.values()):
        raise JalnaContextError("No valid current model values returned")
    return {
        "valid_time_local": values["time"],
        "model_grid_latitude": lat,
        "model_grid_longitude": lon,
        "values": cleaned,
        "units": dict(UNITS),
        "missing_fields": [key for key, val in cleaned.items() if val is None],
    }


def context_result(current: dict | None, *, status: str,
                   retrieved_at_utc: str | None = None) -> dict:
    return {
        "location": "Jalna city approximate reference, Maharashtra, India",
        "reference_coordinates": {"latitude": LAT, "longitude": LON},
        "soil": soil_reference(),
        "conditions": {
            "status": status,
            "data_kind": "model_grid_current_conditions",
            "source": "Open-Meteo forecast API (weather model, not a station/soil sensor)",
            "source_url": DOCS,
            "request_url": build_url(),
            "retrieved_at_utc": retrieved_at_utc,
            "model": current,
            "notice": (
                "Model-grid estimates, not observed field temperature, "
                "soil moisture, soil type, pH or nutrient tests. "
                "No agronomic threshold or cotton-safety claim is derived."
            ) if current else (
                "Current model values unavailable. No substitute numbers "
                "or field measurements are supplied."
            ),
        },
        "decision_integration": "context_only_not_used_by_feasibility_engine",
    }


def get_jalna_context(*, refresh: bool = False, fetcher=None,
                      now: datetime | None = None) -> dict:
    global _CACHE
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    cached = _CACHE if fetcher is None else None
    if cached and not refresh and 0 <= (now - cached["at"]).total_seconds() <= FRESH_MINUTES * 60:
        return context_result(cached["model"], status="cached_recent",
                              retrieved_at_utc=cached["at"].isoformat())
    try:
        if fetcher is not None:
            payload = fetcher(build_url())
        else:
            request = Request(build_url(), headers={
                "Accept": "application/json", "Accept-Encoding": "identity",
                "User-Agent": "AgriForesight-JalnaContext/1.0",
            })
            with urlopen(request, timeout=9) as response:
                body = response.read(49153)
                if len(body) > 49152:
                    raise JalnaContextError("Open-Meteo response exceeds limit")
                payload = json.loads(body)
        model = validate_current(payload, now)
        if fetcher is None:
            _CACHE = {"model": model, "at": now}
        return context_result(model, status="retrieved_live",
                              retrieved_at_utc=now.isoformat())
    except (HTTPError, URLError, OSError, TimeoutError, TypeError, ValueError,
            KeyError, json.JSONDecodeError):
        if cached and 0 <= (now - cached["at"]).total_seconds() <= FRESH_MINUTES * 60:
            return context_result(cached["model"], status="cached_recent",
                                  retrieved_at_utc=cached["at"].isoformat())
        return context_result(None, status="unavailable")
