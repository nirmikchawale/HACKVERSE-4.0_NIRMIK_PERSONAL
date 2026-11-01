import {test,expect} from '@playwright/test';

// Fixtures are isolated browser interception only. Runtime never substitutes model readings.
const istHour=hours=>{
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
   year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
   .formatToParts(new Date(Date.now()+hours*3600000));
 const get=t=>parts.find(p=>p.type===t)?.value;
 return get('year')+'-'+get('month')+'-'+get('day')+'T'+get('hour')+':00';
};
const forecast=()=>({
 status:'retrieved_live',retrieved_at_utc:new Date().toISOString(),
 forecast_age_hours:0,attribution:'Open-Meteo test-only source',
 validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
 hours:Array.from({length:40},(_,i)=>({
  time:istHour(i+3),
  precipitation_mm:i===7?null:i===0?0:(i+1)/4,
  precipitation_probability_pct:i===12?null:10+i
 }))
});
async function visit(page,source=forecast()){
 await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'test',disclaimer:'Not field validated'}}));
 await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[],input_categories:['forecast'],operational_rules:[]}}));
 await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:source}));
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
  status:'unavailable',days:[],source:'NASA POWER (US government)',notice:'Unavailable'}}));
 await page.goto('/');
 const nav=(page.viewportSize()?.width||1365)<=740?'#navMobile':'#navDesktop';
 await page.locator(nav+' [data-nav="1"]').click();
}
test('WXR-04 equal-width, compact paired cards contain only actionable forecast and planning UI',async({page})=>{
 await page.setViewportSize({width:1460,height:920});
 await visit(page);
 const box=page.locator('.wx-workspace-compact');
 await expect(box.locator('.forecast-panel')).toBeVisible();
 await expect(box.locator('.deadline-card')).toBeVisible();
 const a=await box.locator('.forecast-panel').boundingBox();
 const b=await box.locator('.deadline-card').boundingBox();
 expect(Math.abs(a.width-b.width)).toBeLessThan(3);
 expect(Math.abs(a.height-b.height)).toBeLessThan(3);
 expect(a.height).toBeLessThan(570);
 await expect(box.locator('.live-provenance')).toHaveCount(0);
 await expect(box.locator('.source-strip')).toHaveCount(0);
 await expect(box.locator('.network-evidence')).toHaveCount(0);
 await expect(box.locator('.wx-guide-steps')).toHaveCount(0);
 await expect(box.locator('.wx-explorer-summary')).toHaveCount(0);
 await expect(box.locator('#deadlineGuideSave')).toHaveCount(0);
 await expect(box.locator('#saveDeadline')).toHaveCount(1);
 await expect(box.locator('#deadlineGuideContinue')).toHaveCount(1);
 await expect(page.locator('#weatherNetworkDetails')).toBeAttached();
 await expect(page.locator('#weatherNetworkDetails summary')).toContainText('Inspect network receipts');
});
test('WXR-04 horizon and date controls change actual available model-hour visualization',async({page})=>{
 await visit(page);
 const horizons=page.locator('#forecastWindowSummary .wx-horizon-button');
 await expect(horizons).toHaveCount(3);
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(24);
 await horizons.nth(0).click();
 await expect(page.locator('[data-horizon="6"]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(6);
 await page.locator('[data-horizon="12"]').click();
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(12);
 await page.locator('[data-horizon="24"]').click();
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(24);
 await expect(page.locator('#forecastExploreNext')).toBeEnabled();
 await page.locator('#forecastExploreNext').click();
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(16);
 await page.locator('#forecastExploreMetric').selectOption('precipitation_probability_pct');
 await expect(page.locator('#weatherChart .bar-value').first()).toContainText('%');
 await page.locator('#forecastExplorePrev').click();
 await expect(page.locator('#weatherChart .bar-missing')).toHaveCount(1);
});
test('WXR-04 sole resource navigation is active before any deadline is selected',async({page})=>{
 await visit(page);
 const btn=page.locator('#deadlineGuideContinue');
 await expect(btn).toBeEnabled();
 await expect(page.locator('#deadlineInput')).toHaveValue('');
 await expect(page.locator('#saveDeadline')).toBeDisabled();
 await btn.focus();
 await page.keyboard.press('Enter');
 await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
 await expect(page.locator('#quantity')).toHaveValue('');
 await expect(page.locator('#resourceCheckBadge')).toHaveText('0/6');
});
test('WXR-04 next model hour and explicit one-save workflow work without automatic deadline claims',async({page})=>{
 await visit(page);
 const cont=page.locator('#deadlineGuideContinue');
 await expect(cont).toBeEnabled();
 await expect(page.locator('#saveDeadline')).toBeDisabled();
 await page.locator('#deadlineGuideNextHour').click();
 await expect(page.locator('#deadlineInput')).not.toHaveValue('');
 await expect(page.locator('#deadlinePlanningGuide')).toContainText('Candidate time remaining');
 await expect(page.locator('#saveDeadline')).toBeEnabled();
 await expect(cont).toBeEnabled();
 await page.locator('#saveDeadline').click();
 await expect(page.locator('#deadlineNotice')).toContainText('saved');
 await expect(cont).toBeEnabled();
 await expect(page.locator('#saveDeadline')).toBeDisabled();
 await cont.click();
 await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
});
test('WXR-04 manual selection remains available without source, with stale and empty controls truthful',async({page})=>{
 await visit(page,{status:'unavailable',hours:[],notice:'Provider unreachable'});
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
 await expect(page.locator('#forecastWindowSummary')).toHaveCount(0);
 await expect(page.locator('#clearForecast')).toBeEnabled();
 await expect(page.locator('#deadlineGuideNextHour')).toBeDisabled();
 await expect(page.locator('#saveDeadline')).toBeDisabled();
 await page.locator('#deadlineInput').fill('2099-01-01T12:00');
 await expect(page.locator('#saveDeadline')).toBeEnabled();
 await page.locator('#saveDeadline').click();
 await expect(page.locator('#deadlineGuideContinue')).toBeEnabled();
 await page.locator('#clearForecast').click();
 await expect(page.locator('#clearForecast')).toBeDisabled();
});
test('WXR-04 source badge opens verified quality and optional receipt never crowds either card',async({page})=>{
 await visit(page);
 await expect(page.locator('#forecastQualityMetrics .source-qc-item')).toHaveCount(8);
 await page.locator('#forecastSourceChip').click();
 await expect(page.locator('#forecastQualityMetrics .source-qc-item').first()).toBeFocused();
 await page.locator('#weatherNetworkDetails summary').click();
 await expect(page.locator('#weatherNetworkDetails')).toHaveAttribute('open','');
 await expect(page.locator('#networkEvidenceStatus')).toContainText('Last Open-Meteo receipt');
 await expect(page.locator('.wx-workspace-compact #networkEvidenceStatus')).toHaveCount(0);
});
test('WXR-04 model and deadline panels stay scroll-contained and translated on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await visit(page);
 await expect(page.locator('.wx-workspace-compact .forecast-panel')).toBeVisible();
 await expect(page.locator('.wx-workspace-compact .deadline-card')).toBeVisible();
 const overflow=await page.locator('body').evaluate(el=>el.scrollWidth);
 expect(overflow).toBeLessThanOrEqual(390);
 const panel=await page.locator('#weatherChart').boundingBox();
 expect(panel.width).toBeLessThan(390);
 await page.locator('#language').selectOption('mr');
 await expect(page.locator('#forecastExploreMetric').locator('option').first()).toContainText('पाऊस');
 await expect(page.locator('#deadlineGuideNextHour')).toContainText('मॉडेल');
 await page.locator('#language').selectOption('hi');
 await expect(page.locator('#forecastExploreDay').locator('option').first()).toContainText('सभी');
 await page.locator('#themeButton').click();
 await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
});