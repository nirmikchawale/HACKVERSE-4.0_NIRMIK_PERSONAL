import {test, expect} from '@playwright/test';

function istHour(offsetHours) {
 const d=new Date(Date.now()+offsetHours*3600000);
 const parts=new Intl.DateTimeFormat('en-GB',{
   timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
   hour:'2-digit',minute:'2-digit',hourCycle:'h23'
 }).formatToParts(d);
 const get=(name)=>parts.find(p=>p.type===name)?.value;
 return [get('year'),get('month'),get('day')].join('-')+'T'+[get('hour'),get('minute')].join(':');
}
function sampleCase(hours=26, capacity=6) {
 return {
  target_units:10,capacity_units:capacity,required_hours:2,unit:'handling_unit',
  now:new Date().toISOString(),deadline:istHour(hours)+':00+05:30',
  readiness:'yes',completed:false,baseline_resource_ids:[],changes:[
    {id:'A',type:'add_capacity',value:4,unit:'handling_unit',
     resource_id:'integration-test-resource',availability:'available',confirmation_state:'confirmed',cost:null}
  ],
 };
}
test('six FastAPI routes use the real Python backend, not mocked browser fixtures',async({request})=>{
 const health=await request.get('/api/health');
 expect(health.status()).toBe(200);
 expect((await health.json()).ok).toBe(true);
 const sources=await request.get('/api/sources');
 expect(sources.status()).toBe(200);
 expect((await sources.json()).sources.length).toBeGreaterThanOrEqual(3);
 const forecast=await request.get('/api/forecast');
 expect(forecast.status()).toBe(200);
 const weather=await forecast.json();
 expect(['retrieved_live','cached_recent','stale_cache','unavailable']).toContain(weather.status);
 expect(weather.attribution).toContain('Open-Meteo');
 if(weather.status==='unavailable') expect(weather.hours).toEqual([]);
 const before=sampleCase();
 const evalRes=await request.post('/api/evaluate',{data:before});
 expect(evalRes.status()).toBe(200);
 const evaluation=await evalRes.json();
 expect(evaluation.status).toBe('blocked');
 expect(evaluation.packages.map(p=>p.change_ids)).toEqual([['A']]);
 const after={...before,capacity_units:10,changes:[]};
 const compare=await request.post('/api/compare',{data:{before,after}});
 expect(compare.status()).toBe(200);
 const comparison=await compare.json();
 expect(comparison.changes.status_before).toBe('blocked');
 expect(comparison.changes.status_after).toBe('feasible');
 const timeCandidates=(weather.hours||[]).filter(h=>h.time>istHour(1));
 const chosen=timeCandidates[0]?.time ?? istHour(26);
 const replan=await request.post('/api/replan',{data:{before,after,selected_hour_local:chosen}});
 if(['retrieved_live','cached_recent'].includes(weather.status) && timeCandidates.length){
   expect(replan.status()).toBe(200);
   const v=await replan.json();
   expect(v.forecast_selection.selected_hour_local).toBe(chosen);
   expect(v.forecast_selection.attribution).toContain('Open-Meteo');
 } else {
   expect([409,422]).toContain(replan.status());
 }
});
test('actual browser form evaluates and compares with Python, with no synthetic UI data',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#api-health')).toContainText('Python API connected');
 await expect(page.locator('#source-registry')).toContainText('evidence records');
 await expect(page.locator('#forecast-status')).not.toHaveText('API not connected');
 await expect(page.locator('#target')).toHaveValue('');
 await page.locator('#target').fill('10');
 await page.locator('#capacity').fill('6');
 await page.locator('#hours').fill('2');
 await page.locator('#deadline').fill(istHour(26));
 await page.locator('#readiness').selectOption('yes');
 await page.locator('#input-confirm').check();
 await page.locator('#add-option').click();
 const option=page.locator('.option-card').first();
 await option.locator('.opt-amount').fill('4');
 await option.locator('.opt-resource').fill('new-cover-resource');
 await option.locator('.opt-availability').selectOption('available');
 await option.locator('.opt-confirmation').selectOption('confirmed');
 await page.locator('#evaluate').click();
 await expect(page.locator('#result-status')).toHaveText('BLOCKED');
 await expect(page.locator('.package-card')).toHaveCount(1);
 await page.locator('#capacity').fill('10');
 await expect(page.locator('#result-status')).toHaveText('Not evaluated');
 await page.locator('#evaluate').click();
 await expect(page.locator('#result-status')).toHaveText('FEASIBLE');
 await expect(page.locator('#comparison-content')).toContainText('BLOCKED → FEASIBLE');
 await expect(page.locator('#comparison-content')).toContainText('capacity_units');
});
