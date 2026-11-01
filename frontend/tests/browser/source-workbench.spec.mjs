import {test,expect} from '@playwright/test';
// Network fixtures below are isolated test data; production never uses mocked sources.
const health={ok:true,version:'P0',disclaimer:'No field validation.'};
const sources={sources:[{title:'Open-Meteo modeled forecast',url:'https://open-meteo.com/en/docs'}],input_categories:['USER_REPORTED']};
const makeForecast=(stale=false)=>({
 status:'retrieved_live',retrieved_at_utc:new Date(Date.now()-(stale?3*3600000:60000)).toISOString(),
 forecast_age_hours:stale?3:0.016,
 validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
 attribution:'Open-Meteo model',hours:[{time:'2099-01-01T09:00',precipitation_mm:3,precipitation_probability_pct:20},
  {time:'2099-01-01T10:00',precipitation_mm:null,precipitation_probability_pct:40}]
});
const nasa={status:'retrieved_live',source:'NASA POWER (US government)',
 data_kind:'government_gridded_historical',latest_data_date:'2026-10-27',
 retrieved_at_utc:new Date().toISOString(),days:[{date:'2026-10-27',precipitation_mm_day:4,temperature_c:25}]};
async function fixture(page,opts={}){
 await page.addInitScript(()=>localStorage.clear());
 await page.route('**/api/health',r=>r.fulfill({json:opts.failHealth?{ok:false}:health,status:opts.failHealth?503:200}));
 await page.route('**/api/sources',r=>r.fulfill({json:sources}));
 await page.route('**/api/forecast*',r=>r.fulfill({json:opts.stale?makeForecast(true):makeForecast()}));
 await page.route('**/api/government-climate*',r=>r.fulfill({json:opts.nasaUnavailable?{
   status:'unavailable',source:'NASA POWER (US government)',data_kind:'government_gridded_historical',
   days:[],notice:'Source unavailable'}:nasa}));
}
test('source cards are interactive, preserve five independent statuses and show actual metadata',async({page})=>{
 await fixture(page);await page.goto('/');
 const cards=page.locator('#evidenceSourceGrid .source-matrix-card');
 await expect(cards).toHaveCount(5);
 await expect(cards.nth(0)).toContainText('Connected');
 await expect(cards.nth(1)).toContainText('Verified model hours');
 await expect(cards.nth(2)).toContainText('2026-10-27');
 await expect(cards.nth(3)).toContainText('Not connected');
 await expect(cards.nth(4)).toContainText('Not evaluated');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('1/2');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('Modeled rainfall cannot prove observed rain');
 await cards.nth(2).click();
 await expect(cards.nth(2)).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('NASA POWER');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('2026-10-27');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('measurements at the farm');
 await page.locator('#sourceWorkbenchDetail .source-detail-action.primary').click();
 await expect(page.locator('section.section[data-page="1"]')).toHaveClass(/active/);
});
test('filtering is functional and absent IMD data can only be reviewed externally',async({page})=>{
 await fixture(page);await page.goto('/');
 await page.locator('[data-filter="available"]').click();
 await expect(page.locator('#evidenceSourceGrid .source-matrix-card:visible')).toHaveCount(3);
 await page.locator('[data-filter="attention"]').click();
 await expect(page.locator('#evidenceSourceGrid .source-matrix-card:visible')).toHaveCount(2);
 await page.locator('#evidenceSourceGrid [data-source-id="imd"]').click();
 const detail=page.locator('#sourceWorkbenchDetail');
 await expect(detail).toContainText('no validated live IMD feed');
 await expect(detail.locator('a.source-detail-action')).toHaveAttribute('href','https://mausam.imd.gov.in/responsive/districtWiseWarning.php');
 await expect(detail.locator('a.source-detail-action')).toHaveAttribute('target','_blank');
 await expect(detail).not.toContainText('No warning');
 await page.locator('[data-filter="all"]').click();
 await expect(page.locator('#evidenceSourceGrid .source-matrix-card:visible')).toHaveCount(5);
});
test('stale or unavailable sources are never called fresh and the filter follows actual validity',async({page})=>{
 await fixture(page,{stale:true,nasaUnavailable:true});await page.goto('/');
 await expect(page.locator('#evidenceSourceGrid [data-source-id="model"]')).toContainText('Stale · do not use');
 await expect(page.locator('#evidenceSourceGrid [data-source-id="nasa"]')).toContainText('Unavailable / not loaded');
 await page.locator('[data-filter="available"]').click();
 await expect(page.locator('#evidenceSourceGrid .source-matrix-card:visible')).toHaveCount(1);
 await expect(page.locator('#sourceWorkbenchDetail')).not.toContainText('Verified current model');
});
test('real source refresh reuses provider routes and exports a status-only receipt',async({page})=>{
 let modelRefreshes=0,nasaRefreshes=0;
 await fixture(page);await page.route('**/api/forecast?refresh=true',r=>{modelRefreshes++;r.fulfill({json:makeForecast()});});
 await page.route('**/api/government-climate?refresh=true',r=>{nasaRefreshes++;r.fulfill({json:nasa});});
 await page.goto('/');
 await page.locator('#sourceWorkbenchDetail button').filter({hasText:'Refresh Open-Meteo'}).click();
 await expect.poll(()=>modelRefreshes).toBe(1);
 await page.locator('#evidenceSourceGrid [data-source-id="nasa"]').click();
 await page.locator('#sourceWorkbenchDetail button').filter({hasText:'Refresh NASA history'}).click();
 await expect.poll(()=>nasaRefreshes).toBe(1);
 await page.locator('#evidenceSourceGrid [data-source-id="farm"]').click();
 const dl=page.waitForEvent('download');
 await page.locator('#sourceWorkbenchDetail button').filter({hasText:'Download status receipt'}).click();
 const file=await dl;
 expect(file.suggestedFilename()).toContain('farm-status.json');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('not confirm physical equipment availability');
});
test('mobile workbench fits viewport, supports tri-language changes and keyboard selection',async({page})=>{
 await fixture(page);await page.setViewportSize({width:390,height:844});await page.goto('/');
 const cards=page.locator('#evidenceSourceGrid .source-matrix-card');
 await expect(cards).toHaveCount(5);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
 await cards.nth(3).focus();await page.keyboard.press('Enter');
 await expect(cards.nth(3)).toHaveAttribute('aria-pressed','true');
 await page.locator('#language').selectOption('mr');
 await expect(page.locator('#evidenceSourceMatrix')).toContainText('स्वतंत्र स्रोत स्थिती');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('जोडलेले नाही');
 await page.locator('#language').selectOption('hi');
 await expect(page.locator('#evidenceSourceMatrix')).toContainText('स्वतंत्र स्रोत की स्थिति');
 await page.locator('#language').selectOption('en');
 await expect(page.locator('#evidenceSourceGrid .source-matrix-card:visible')).toHaveCount(5);
});
test('validated backend assessment appears only after FastAPI responds and clears on edits',async({page})=>{
 await fixture(page);
 await page.route('**/api/evaluate',r=>r.fulfill({json:{
   status:'blocked',unit:'handling_unit',message:'Declared capacity shortfall',
   baseline:{status:'blocked',shortfall_units:4,projected_target_units:10,projected_capacity_units:6,
     time_budget:{time_slack_hours:1},constraints:[{id:'capacity',status:'blocked',explanation:'4 units short',provenance:'user-reported'}]},
   excluded_changes:[],packages:[]}}));
 await page.goto('/');
 await page.locator('#navDesktop [data-nav="1"]').click();
 await page.locator('#deadlineInput').fill('2099-01-01T12:00');await page.locator('#saveDeadline').click();
 await page.locator('#navDesktop [data-nav="2"]').click();
 await page.locator('#quantity').fill('10');await page.locator('#capacity').fill('6');
 await page.locator('#duration').fill('1');await page.locator('#readiness').selectOption('yes');
 await page.locator('#confirmInputs').check();await page.locator('#saveResources').click();
 await page.locator('#navDesktop [data-nav="3"]').click();await page.locator('#runAssessment').click();
 await page.locator('#navDesktop [data-nav="0"]').click();
 await page.locator('#evidenceSourceGrid [data-source-id="farm"]').click();
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('BLOCKED');
 await expect(page.locator('#sourceWorkbenchDetail')).toContainText('1');
 await page.locator('#navDesktop [data-nav="2"]').click();await page.locator('#capacity').fill('8');
 await page.locator('#navDesktop [data-nav="0"]').click();
 await expect(page.locator('#evidenceSourceGrid [data-source-id="farm"]')).toContainText('Not evaluated');
});
