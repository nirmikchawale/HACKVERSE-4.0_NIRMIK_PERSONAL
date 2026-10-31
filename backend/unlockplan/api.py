from __future__ import annotations
from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from .engine import evaluate, InputError
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

@app.get('/api/forecast')
def forecast(refresh:bool=False):
    return get_forecast(refresh=refresh)

@app.get('/api/sources')
def sources():return {'sources':REGISTRY,'operational_rules':RULES,
                      'input_categories':['forecast','historical guidance','user-reported','configured assumption','simulated','unknown']}

@app.get('/')
def home():return FileResponse(ROOT/'static'/'index.html')

app.mount('/static',StaticFiles(directory=ROOT/'static'),name='static')
