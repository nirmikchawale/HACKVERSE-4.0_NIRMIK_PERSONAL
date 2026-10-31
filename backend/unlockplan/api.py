from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict
from typing import Any
from pathlib import Path
from datetime import datetime, timezone
from .engine import evaluate, InputError
from .planning import compare_plans, replan_from_forecast, parse_selected_hour_local
from .weather import get_forecast, CACHE_FILE, read_cache
from .sources import REGISTRY,RULES
from .govclimate import get_government_climate

class CompareRequest(BaseModel):
    """Full, separately user-declared before/after plans (engine validates contents)."""
    model_config = ConfigDict(extra='forbid')
    before: dict[str, Any]
    after: dict[str, Any]


class ReplanRequest(CompareRequest):
    """Candidate local hour must come from the server-provided weather timeline."""
    selected_hour_local: str


ROOT=Path(__file__).resolve().parents[1]
app=FastAPI(title='UnlockPlan P0',version='0.1.0',description='Source-labeled conditional planning demonstrator; NOT agricultural field advice.')

@app.get('/api/health')
def health():
    return {'ok':True,'version':'P0','forecast_validated_cache_present':read_cache(CACHE_FILE) is not None,
            'disclaimer':'Not field validated; no guaranteed resource access or crop protection.'}

@app.post('/api/evaluate')
def evaluate_endpoint(case:dict):
    try:return evaluate(case)
    except InputError as exc:raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.post('/api/compare')
def compare_endpoint(payload:CompareRequest):
    try:
        return compare_plans(payload.before, payload.after)
    except InputError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.post('/api/replan')
def replan_endpoint(payload:ReplanRequest):
    # Reject invalid inputs *before* triggering a weather fetch.
    # 422 is for malformed plans/hours; 409 is for unavailable current evidence.
    try:
        parse_selected_hour_local(payload.selected_hour_local)
        from .engine import validate
        validate(payload.before)
        validate(payload.after)
    except InputError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc
    # Only a server-retrieved forecast is eligible to bind an hourly deadline.
    # Unavailable or stale weather never yields a forecast-attributed plan.
    forecast_result=get_forecast(refresh=False)
    if forecast_result.get('status') not in {'retrieved_live','cached_recent'}:
        raise HTTPException(status_code=409,detail='Current authentic forecast unavailable. Use manual /api/compare.')
    try:
        return replan_from_forecast(payload.before,payload.after,
                                    payload.selected_hour_local,forecast_result,
                                    datetime.now(timezone.utc))
    except InputError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.get('/api/forecast')
def forecast(refresh:bool=False):
    return get_forecast(refresh=refresh)

@app.get('/api/government-climate')
def government_climate(refresh: bool = False):
    return get_government_climate(refresh=refresh)

@app.get('/api/sources')
def sources():return {'sources':REGISTRY,'operational_rules':RULES,
                      'input_categories':['forecast','historical guidance','user-reported','configured assumption','simulated','unknown']}

@app.get('/')
def home():return FileResponse(ROOT/'static'/'index.html')

app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
