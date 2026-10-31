"""Cloudflare-compatible FastAPI routes using the unchanged UnlockPlan engine.

The original Vercel API and synchronous provider adapters remain untouched.
Edge outbound HTTP is asynchronous. Isolate-memory caches are best-effort only;
no test fixture or substitute observation is ever served to a farmer.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict

from .engine import InputError, evaluate, validate
from .planning import compare_plans, parse_selected_hour_local, replan_from_forecast
from .sources import REGISTRY, RULES
from .weather import (
    ATTRIBUTION, LAT as WEATHER_LAT, LON as WEATHER_LON,
    STALE_AFTER_HOURS, TIMEZONE, WeatherSchemaError,
    build_url as weather_url, public_summary, validate_forecast,
)
from .govclimate import (
    DOCS as NASA_DOCS, LAT as NASA_LAT, LON as NASA_LON,
    build_url as nasa_url, date_window, validate_daily,
)

# Correctness does not depend on these per-isolate caches surviving requests.
_forecast_cache: dict[str, Any] | None = None
_nasa_cache: dict[str, Any] | None = None
_MAX_FORECAST_BODY = 131072
_MAX_NASA_BODY = 262144
_NASA_TTL_SECONDS = 1800


async def _request_json(url: str, *, limit: int, timeout: float) -> Any:
    """Only documented HTTPS provider URLs; no caller-supplied fetch targets."""
    if not (url.startswith("https://api.open-meteo.com/v1/forecast?")
            or url.startswith("https://power.larc.nasa.gov/api/temporal/daily/point?")):
        raise ValueError("External climate source is not approved.")
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=False) as client:
        response = await client.get(url, headers={
            "User-Agent": "AgriForesight-official-evidence/1.0",
            "Accept": "application/json",
        })
        response.raise_for_status()
        if len(response.content) > limit:
            raise ValueError("Official climate response exceeds size limit.")
        return response.json()


async def edge_forecast(*, refresh: bool = False,
                        now: datetime | None = None) -> dict[str, Any]:
    global _forecast_cache
    now = now or datetime.now(timezone.utc)
    if now.tzinfo is None or now.utcoffset() is None:
        raise ValueError("Timezone-aware forecast clock required.")
    now = now.astimezone(timezone.utc)
    url = weather_url()
    existing = _forecast_cache
    if existing and existing.get("request_url") == url:
        from .weather import age_hours
        age = age_hours(existing, now)
        if not refresh and 0 <= age <= STALE_AFTER_HOURS:
            return public_summary(existing, "cached_recent", now=now)
    try:
        raw = await _request_json(url, limit=_MAX_FORECAST_BODY, timeout=9)
        verified = validate_forecast(raw)
        from zoneinfo import ZoneInfo
        first = datetime.fromisoformat(verified["first_hour"]).replace(tzinfo=ZoneInfo(TIMEZONE))
        last = datetime.fromisoformat(verified["last_hour"]).replace(tzinfo=ZoneInfo(TIMEZONE))
        if not first - timedelta(hours=24) <= now.astimezone(ZoneInfo(TIMEZONE)) <= last + timedelta(hours=1):
            raise WeatherSchemaError("Forecast period does not cover the current reference time.")
        record = {
            "raw": raw, "request_url": url, "retrieved_at_utc": now.isoformat(),
            "attribution": ATTRIBUTION, "requested_timezone": TIMEZONE,
            "verified_source": "network_response",
        }
        _forecast_cache = record
        return public_summary(record, "retrieved_live", now=now)
    except (httpx.HTTPError, ValueError, TypeError, KeyError, OSError, TimeoutError) as exc:
        # Never return a stale record under the recent/live status.
        if existing and existing.get("request_url") == url:
            from .weather import age_hours
            age = age_hours(existing, now)
            if 0 <= age <= STALE_AFTER_HOURS:
                return public_summary(existing, "cached_recent",
                                      error="Provider refresh failed; prior verified model retained.",
                                      now=now)
        return {
            "status": "unavailable", "error": type(exc).__name__,
            "source": "Open-Meteo public model forecast", "request_url": url,
            "attribution": ATTRIBUTION, "hours": [],
            "location_label": "Jalna district approximate reference (not farm-level)",
            "notice": "Model forecast unavailable; no invented forecast hours are displayed.",
        }


async def edge_government_climate(*, refresh: bool = False,
                                  now: datetime | None = None) -> dict[str, Any]:
    global _nasa_cache
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    start, end = date_window(now)
    url = nasa_url(now)
    existing = _nasa_cache
    if existing and existing["url"] == url:
        age = (now - existing["at"]).total_seconds()
        if not refresh and 0 <= age <= _NASA_TTL_SECONDS:
            return {**existing["payload"], "status": "cached_recent"}
    try:
        raw = await _request_json(url, limit=_MAX_NASA_BODY, timeout=12)
        rows = validate_daily(raw, start, end)
        result = {
            "status": "retrieved_live", "data_kind": "government_gridded_historical",
            "source": "NASA POWER (US government)", "source_url": NASA_DOCS,
            "request_url": url, "retrieved_at_utc": now.isoformat(),
            "location": "Jalna district approximate reference, Maharashtra, India",
            "latitude_reference": NASA_LAT, "longitude_reference": NASA_LON,
            "date_start": start.isoformat(), "date_end": end.isoformat(),
            "latest_data_date": rows[-1]["date"],
            "units": {"precipitation": "mm/day", "temperature": "degrees C"},
            "days": rows,
            "notice": ("Historical NASA POWER gridded satellite/reanalysis information, "
                       "typically delayed; not station rain, an operational forecast, "
                       "farm-specific soil data, or a crop-safety threshold."),
        }
        _nasa_cache = {"url": url, "at": now, "payload": result}
        return result
    except (httpx.HTTPError, ValueError, TypeError, KeyError, OSError, TimeoutError) as exc:
        # If source cannot be freshly checked, only label validated records as cached.
        if existing and existing["url"] == url:
            age = (now - existing["at"]).total_seconds()
            if 0 <= age <= _NASA_TTL_SECONDS:
                return {**existing["payload"], "status": "cached_recent",
                        "notice": existing["payload"]["notice"] +
                        " Latest refresh failed; cached historical data shown."}
        return {
            "status": "unavailable", "data_kind": "government_gridded_historical",
            "source": "NASA POWER (US government)", "source_url": NASA_DOCS,
            "request_url": url, "location": "Jalna district approximate reference, Maharashtra, India",
            "days": [], "error_type": type(exc).__name__,
            "notice": "Official historical source unavailable. No replacement values are supplied.",
        }


class CompareRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    before: dict[str, Any]
    after: dict[str, Any]


class ReplanRequest(CompareRequest):
    selected_hour_local: str


app = FastAPI(
    title="Agri Foresight — Cloudflare candidate", version="0.2.0",
    description="Conditional resource feasibility and real source-labeled climate evidence. Not field safety advice.",
)


@app.get("/api/health")
async def health():
    return {
        "ok": True, "version": "P0",
        "forecast_validated_cache_present": _forecast_cache is not None,
        "disclaimer": "Not field validated; no guaranteed resource access or crop protection.",
    }


@app.post("/api/evaluate")
async def evaluate_endpoint(case: dict):
    try:
        return evaluate(case)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/compare")
async def compare_endpoint(payload: CompareRequest):
    try:
        return compare_plans(payload.before, payload.after)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.post("/api/replan")
async def replan_endpoint(payload: ReplanRequest):
    try:
        parse_selected_hour_local(payload.selected_hour_local)
        validate(payload.before)
        validate(payload.after)
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    model = await edge_forecast()
    if model.get("status") not in ("retrieved_live", "cached_recent"):
        raise HTTPException(
            status_code=409,
            detail="Current authentic forecast unavailable. Use manual /api/compare.",
        )
    try:
        return replan_from_forecast(
            payload.before, payload.after, payload.selected_hour_local,
            model, datetime.now(timezone.utc),
        )
    except InputError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/forecast")
async def forecast(refresh: bool = False):
    return await edge_forecast(refresh=refresh)


@app.get("/api/government-climate")
async def government_climate(refresh: bool = False):
    return await edge_government_climate(refresh=refresh)


@app.get("/api/sources")
async def sources():
    return {
        "sources": REGISTRY, "operational_rules": RULES,
        "input_categories": [
            "forecast", "historical guidance", "user-reported",
            "configured assumption", "simulated", "unknown",
        ],
    }
