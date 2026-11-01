import {expect,test} from '@playwright/test';

// Browser-only intercepted upstream fixtures. No production weather is fabricated.
function futureHour(ahead){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
    .formatToParts(new Date(Date.now()+ahead*3600000));
  const value=k=>parts.find(p=>p.type===k)?.value;
  return [value('year'),value('month'),value('day')].join('-')+'T'+value('hour')+':00';
}
const data=()=>({status:'retrieved_live',retrieved_at_utc:new Date().toISOString(),
  forecast_age_hours:0,attribution:'Open-Meteo — isolated browser-test data',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:Array.from({length:40},(_,i)=>({time:futureHour(i+3),
    precipitation_mm:i===7?null:i%4===0?0:1.5+i/10,
    precipitation_probability_pct:i===12?null:10+i}))});
async function setup(page){
  await page.route('**/api/health',r=>r.fulfill({status:200,
    json:{ok:true,version:'WXR-02-test',disclaimer:'No safety certification'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,
    json:{sources:[],input_categories:['forecast'],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:data()}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,
    json:{status:'unavailable',days:[],source:'NASA POWER (US government)',notice:'Unavailable'}}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
}
test('WXR-02 evidence-quality tiles drill into exact missing model values',async({page})=>{
  await setup(page);
  await expect(page.locator('#forecastQualityMetrics button.source-qc-item')).toHaveCount(8);
  const rain=page.locator('#forecastQualityMetrics [data-quality="rainCount"]');
  await rain.click();
  await expect(rain).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#forecastQualityInspector')).toContainText('Affected source hours');
  await page.locator('#forecastQualityInspector .source-qc-drill').click();
  await expect(page.locator('#hourlyEvidenceScope')).toHaveValue('missing-rain');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(1);
  await expect(page.locator('#hourlyEvidenceTable')).toContainText('Unavailable');
  await page.locator('#hourlyEvidenceScope').selectOption('missing-chance');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(1);
  await page.locator('#hourlyEvidenceScope').selectOption('all');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(40);
});
test('WXR-02 future-first model explorer offers metric choice and pagination without inventing rainfall',async({page})=>{
  await setup(page);
  const explorer=page.locator('#weatherChart');
  await expect(explorer.locator('.hour-bar')).toHaveCount(24);
  await expect(page.locator('#forecastExplorePrev')).toBeDisabled();
  await expect(page.locator('#forecastExploreNext')).toBeEnabled();
  await page.locator('#forecastExploreNext').click();
  await expect(explorer.locator('.hour-bar')).toHaveCount(16);
  await expect(page.locator('#forecastExplorePrev')).toBeEnabled();
  await page.locator('#forecastExploreMetric').selectOption('precipitation_probability_pct');
  await expect(explorer.locator('.bar-value').first()).toContainText('%');
  await page.locator('#forecastExplorePrev').click();
  await expect(explorer.locator('.hour-bar')).toHaveCount(24);
  await expect(explorer.locator('.bar-missing')).toHaveCount(1);
  await expect(explorer).toContainText('missing');
  const rows=page.locator('#hourlyEvidenceTable tbody tr');
  await expect(rows).toHaveCount(40);
  await expect(rows.first()).toContainText(futureHour(3).slice(0,10));
});
test('WXR-02 planning action explicitly selects, saves and proceeds to resources',async({page})=>{
  await setup(page);
  const action=page.locator('#hourlyEvidenceTable button.hourly-evidence-action').first();
  await expect(action).toBeEnabled();
  await action.click();
  await expect(page.locator('#deadlineInput')).not.toHaveValue('');
  await expect(page.locator('#deadlinePlanningGuide')).toContainText('Candidate time remaining');
  await expect(page.locator('#deadlineGuideSave')).toBeEnabled();
  await page.locator('#deadlineGuideSave').click();
  await expect(page.locator('#deadlineGuideContinue')).toBeEnabled();
  await page.locator('#deadlineGuideContinue').click();
  await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
});
test('WXR-02 stale forecast offers no automated model choice but allows manual planning',async({page})=>{
  const stale=data();stale.retrieved_at_utc=new Date(Date.now()-4*3600000).toISOString();
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'test',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[],input_categories:[],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:stale}));
  await page.goto('/');await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#deadlineGuideNextHour')).toBeDisabled();
  await expect(page.locator('#forecastQualityInspector')).toContainText('No current validated Jalna model');
  await expect(page.locator('#hourlyEvidenceTable tbody tr')).toHaveCount(0);
  await expect(page.locator('#deadlineInput')).toBeEnabled();
});
