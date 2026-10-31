from __future__ import annotations
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from datetime import datetime, timezone
from .engine import evaluate, InputError
from .planning import compare_plans, replan_from_forecast
from .weather import get_forecast, CACHE_FILE, read_cache
from .sources import REGISTRY,RULES

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
def compare_endpoint(payload:dict):
    try:
        return compare_plans(payload.get('before'), payload.get('after'))
    except InputError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.post('/api/replan')
def replan_endpoint(payload:dict):
    # Only a server-retrieved forecast is eligible to bind an hourly deadline.
    # Unavailable or stale weather never yields a forecast-attributed plan.
    forecast_result=get_forecast(refresh=False)
    if forecast_result.get('status') not in {'retrieved_live','cached_recent'}:
        raise HTTPException(status_code=409,detail='Current authentic forecast unavailable. Use manual /api/compare.')
    try:
        return replan_from_forecast(payload.get('before'),payload.get('after'),
                                    payload.get('selected_hour_local'),forecast_result,
                                    datetime.now(timezone.utc))
    except InputError as exc:
        raise HTTPException(status_code=422,detail=str(exc)) from exc

@app.get('/api/forecast')
def forecast(refresh:bool=False):
    return get_forecast(refresh=refresh)

@app.get('/api/sources')
def sources():return {'sources':REGISTRY,'operational_rules':RULES,
                      'input_categories':['forecast','historical guidance','user-reported','configured assumption','simulated','unknown']}

@app.get('/')
def home():return FileResponse(ROOT/'static'/'index.html')

app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
