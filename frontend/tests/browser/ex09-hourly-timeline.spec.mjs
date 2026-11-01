import {expect,test} from '@playwright/test';

// HTTP interceptions below are browser-test fixtures; production uses real FastAPI.
function istHour(hoursAhead){
  const parts=new Intl.DateTimeFormat('en-GB',{
    timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(Date.now()+hoursAhead*3_600_000));
  const at=k=>parts.find(item=>item.type===k)?.value;
  return [at('year'),at('month'),at('day')].join('-')+'T'+at('hour')+':00';
}
function forecast(){
  return {status:'retrieved_live',retrieved_at_utc:new Date().toISOString(),
    forecast_age_hours:0,attribution:'Open-Meteo (test-only isolated response)',
    validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
    hours:Array.from({length:40},(_,i)=>({
      time:istHour(i+3),
      precipitation_mm:i===12?null:i===0?0:0.25+i,
      precipitation_probability_pct:i===14?null:10+i
    }))
  };
}
async function setSources(page,weather){
  await page.route('**/api/health',r=>r.fulfill({status:200,
    json:{ok:true,version:'P0',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,
    json:{sources:[],input_categories:['forecast'],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:weather}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,
    json:{status:'unavailable',days:[],source:'NASA POWER (US government)',notice:'Unavailable'}}));
}
test('full table lists every returned source-native model hour, beyond first 24 bars',async({page})=>{
  const real=forecast();await setSources(page,real);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const table=page.locator('#hourlyEvidenceTable');
  await expect(table.locator('tbody tr')).toHaveCount(40);
  await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(24);
  await expect(page.locator('#hourlyEvidenceStatus')).toContainText('Displaying 40 of 40');
  await expect(table).toContainText(real.hours[39].time.replace('T',' '));
  await expect(table).toContainText('Unavailable');
  await expect(table).toContainText('0 mm');
  await expect(page.locator('#hourlyEvidencePanel')).toContainText('not observed rain');
});
test('date filter returns just source hours on that IST date, without changing evidence',async({page})=>{
  const real=forecast();await setSources(page,real);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const date=real.hours[0].time.slice(0,10);
  await page.locator('#hourlyEvidenceDate').selectOption(date);
  const count=real.hours.filter(h=>h.time.startsWith(date)).length;
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(count);
  await expect(page.locator('#hourlyEvidenceStatus')).toContainText('Displaying '+count+' of 40');
  await page.locator('#hourlyEvidenceDate').selectOption('all');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(40);
});
test('an authentic future model hour only fills proposed deadline input pending confirmation',async({page})=>{
  const real=forecast();await setSources(page,real);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  const action=page.locator('#hourlyEvidenceTable button.hourly-evidence-action').nth(5);
  await expect(action).toBeEnabled();await action.click();
  await expect(page.locator('#deadlineInput')).toHaveValue(real.hours[5].time);
  await expect(page.locator('#deadlineNotice')).toContainText('Click Save candidate deadline');
  await expect(page.locator('#deadlineOriginPreview')).toContainText('Not a safe-rain threshold');
});
test('missing provider and unsupported cities never display the source table',async({page})=>{
  await setSources(page,{status:'unavailable',hours:[],notice:'Provider unavailable'});
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
  await expect(page.locator('#hourlyEvidenceStatus')).toContainText('No eligible current model forecast');
  await expect(page.locator('#hourlyEvidenceDate')).toBeDisabled();
});
test('changing place removes previously validated Jalna model hours',async({page})=>{
  await setSources(page,forecast());
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(40);
  page.on('dialog',d=>d.accept());
  await page.locator('#locationButton').click();
  await page.locator('#stateSelect').selectOption('Gujarat');
  await page.locator('#otherCity').fill('Surat');
  await page.locator('#confirmPlace').click();
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
  await expect(page.locator('#hourlyEvidenceStatus')).toContainText('outside the Jalna pilot');
});
test('old model cache cannot provide past/expired time choices',async({page})=>{
  const old=forecast();
  old.status='cached_recent';
  old.retrieved_at_utc=new Date(Date.now()-4*3600000).toISOString();
  await setSources(page,old);
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
  await expect(page.locator('#hourlyEvidenceStatus')).toContainText('No eligible current model forecast');
});
