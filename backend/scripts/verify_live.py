"""Manual external P0 release gate: run only in an internet-connected environment."""
from pathlib import Path
from unlockplan.weather import get_forecast, CACHE_FILE, validate_forecast, read_cache

def main():
    result=get_forecast(refresh=True)
    print('Forecast state:',result['status'])
    print('Source URL:',result.get('request_url'))
    print('Attribution:',result.get('attribution'))
    if result['status']!='retrieved_live':
        print('BLOCKED: no new authenticated network response; error:',result.get('error'))
        raise SystemExit(2)
    record=read_cache(CACHE_FILE)
    if not record or record.get('verified_source')!='network_response':
        print('BLOCKED: missing or invalid actual-response cache')
        raise SystemExit(3)
    meta=validate_forecast(record['raw'])
    print('PASSED real retrieval + schema + cache:',str(CACHE_FILE))
    print('Retrieved UTC:',record['retrieved_at_utc'],'Timezone:',meta['timezone'],'Units:',meta['units'], 'Hours:',meta['hours'])
    print('NOTE: This is a public weather model, not a farm sensor or agronomic validation.')
if __name__=='__main__': main()
