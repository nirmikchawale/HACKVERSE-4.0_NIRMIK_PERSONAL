"""Network-only weather release gate; never accepts synthetic fixture input.

A successful run retains the authentic raw response plus a small, hash-linked
metadata summary as a GitHub Actions artifact. This is model output, not advice.
"""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from unlockplan.weather import get_forecast, CACHE_FILE, validate_forecast, read_cache, build_url


def main():
    result = get_forecast(refresh=True)  # production urllib fetch; NO fetcher injection
    print('Forecast state:', result['status'])
    print('Source URL:', result.get('request_url'))
    print('Attribution:', result.get('attribution'))
    if result['status'] != 'retrieved_live':
        print('BLOCKED: no genuine new network response:', result.get('error'))
        raise SystemExit(2)
    record = read_cache(CACHE_FILE)
    if not record or record.get('verified_source') != 'network_response' or record['request_url'] != build_url():
        print('BLOCKED: no verifiable newly retrieved network response cache')
        raise SystemExit(3)
    meta = validate_forecast(record['raw'])
    # forecast_days=3 must represent three local days, 72 hourly entries.
    if meta['hours'] != 72:
        print('BLOCKED: 3-day forecast returned unexpected hourly row count:', meta['hours'])
        raise SystemExit(4)
    outdir = Path(os.environ.get('UNLOCKPLAN_WEATHER_EVIDENCE_DIR','weather-evidence'))
    outdir.mkdir(parents=True, exist_ok=True)
    raw_file = outdir / 'open_meteo_authentic_response.json'
    raw_bytes = json.dumps(record, ensure_ascii=False, indent=2).encode('utf-8')
    raw_file.write_bytes(raw_bytes)
    report = {
        'actual_network_request': True, 'fetch_method': 'Python urllib.request.urlopen',
        'github_sha': os.environ.get('GITHUB_SHA'),
        'retrieved_at_utc': record['retrieved_at_utc'],
        'request_url': record['request_url'],
        'model_output_not_field_reading': True,
        'attribution': record['attribution'],
        'validated': meta,
        'raw_response_sha256': hashlib.sha256(raw_bytes).hexdigest(),
        'first_sample': {
            'timestamp': record['raw']['hourly']['time'][0],
            'precipitation_mm': record['raw']['hourly']['precipitation'][0],
            'precipitation_probability_pct': record['raw']['hourly']['precipitation_probability'][0],
        },
    }
    (outdir / 'live_forecast_evidence.json').write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('PASS: authentic HTTPS response, location, timezone, units, timestamps, arrays and freshness')
    print('Retrieved UTC:', report['retrieved_at_utc'], '| Hours:', meta['hours'], '| Grid cell:',
          meta['model_grid_latitude'], meta['model_grid_longitude'])
    print('Units:', meta['units'], '| Missing precipitation:', meta['missing_precipitation'],
          '| Missing probability:', meta['missing_probability'])
    print('Raw response SHA256:', report['raw_response_sha256'])
    print('NOTE: This is a model forecast, never a field observation or operation threshold.')


if __name__ == '__main__':
    main()
