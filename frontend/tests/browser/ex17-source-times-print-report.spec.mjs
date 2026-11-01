import {expect,test} from '@playwright/test';
// All API payloads here are isolated test fixtures; no production synthetic provider data.
const health={ok:true,version:'P0',disclaimer:'Not field validated.'};
const sources={sources:[],input_categories:['forecast'],operational_rules:[]};
const nasa={status:'retrieved_live',source:'NASA POWER (US government)',
 data_kind:'government_gridded_historical',retrieved_at_utc:new Date().toISOString(),
 latest_data_date:'2026-10-26',notice:'Historical grid, not a future forecast.',
 days:[{date:'2026-10-26',precipitation_mm_day:2,temperature_c:24}]};
const forecast=(age=4)=>({status:'retrieved_live',
 retrieved_at_utc:new Date(Date.now()-age*60000).toISOString(),
 forecast_age_hours:age/60,attribution:'Open-Meteo forecast (test only)',
 validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
 hours:[{time:'2099-01-01T09:00',precipitation_mm:0,precipitation_probability_pct:40}]});
const result={status:'unknown',unit:'handling_unit',message:'Readiness has not been confirmed.',
 baseline:{status:'unknown',projected_target_units:10,projected_capacity_units:6,
 shortfall_units:4,original_target_unhandled_units:0,time_budget:{time_slack_hours:2},
 constraints:[{id:'readiness',status:'unknown',explanation:'Backend says readiness is unknown.',provenance:'user-reported'},
 {id:'capacity',status:'blocked',explanation:'Backend capacity gap is 4.',provenance:'user-reported'}]},
 excluded_changes:[{id:'requested-helper',reason:'Requested is not confirmed.'}],packages:[]};
async function setup(page,{f=forecast(),g=nasa,validHealth=health}={}){
 await page.route('**/api/health',r=>r.fulfill({status:200,json:validHealth}));
 await page.route('**/api/sources',r=>r.fulfill({status:200,json:sources}));
 await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:f}));
 await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:g}));
}
test('two useful source cards separate provider retrieval from browser check time',async({page})=>{
 await setup(page);await page.goto('/');
 const grid=page.locator('#sourceActivityRows');
 await expect(grid.locator('.source-activity-item')).toHaveCount(2);
 await expect(grid.locator('.source-activity-item').nth(0)).toContainText('Verified current model source');
 await expect(grid.locator('.source-activity-item').nth(0)).toContainText('minutes old');
 await expect(grid.locator('.source-activity-item').nth(1)).toContainText('2026-10-26');
 await expect(grid).not.toContainText('No verified server assessment');
 await expect(grid).not.toContainText('IMD official warnings');
 await expect(grid.locator('.source-activity-measure')).toHaveCount(2);
 await expect(grid.locator('.source-activity-item[data-source="model"]')).toContainText('1/1');
 const stamp=await page.locator('#sourceActivityChecked').getAttribute('datetime');
 await page.locator('#recheckSourceAges').click();
 const updated=await page.locator('#sourceActivityChecked').getAttribute('datetime');
 expect(Date.parse(updated)).toBeGreaterThanOrEqual(Date.parse(stamp));
 await expect(grid.locator('a[href="https://open-meteo.com/en/docs"]')).toHaveCount(1);
});
test('older-than-2-hours model evidence never appears current in source chronology',async({page})=>{
 await setup(page,{f:forecast(190)});await page.goto('/');
 await expect(page.locator('#sourceActivityRows .source-activity-item').first()).toContainText('Expired forecast');
 await expect(page.locator('#sourceActivityRows')).not.toContainText('Verified current model source');
});
test('source receipt clears on unsupported place and source failure',async({page})=>{
 await setup(page,{g:{status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'NASA down'}});
 await page.goto('/');
 await expect(page.locator('#sourceActivityRows .source-activity-item').nth(1)).toContainText('No verified response');
 page.on('dialog',d=>d.accept());
 await page.locator('#locationButton').click();
 await page.locator('#stateSelect').selectOption('Gujarat');
 await page.locator('#otherCity').fill('Surat');
 await page.locator('#confirmPlace').click();
 await expect(page.locator('#sourceActivityRows')).toContainText('Unsupported location');
 await expect(page.locator('#sourceActivityRows')).not.toContainText('Verified current model source');
});
test('print-only CSS hides interactive dashboard and preserves report',async({page})=>{
 await setup(page);await page.goto('/');
 await page.locator('#navDesktop [data-nav="5"]').click();
 const report=page.locator('#printEvidenceReceipt');
 await expect(report).toContainText('NOT EVALUATED');
 await expect(report).toContainText('No completed FastAPI submission');
 await page.emulateMedia({media:'print'});
 expect(await page.locator('section.section[data-page="5"] .page-head').evaluate(x=>getComputedStyle(x).display)).toBe('none');
 expect(await report.evaluate(x=>getComputedStyle(x).display)).not.toBe('none');
 await page.emulateMedia({media:'screen'});
});
test('report shows exact backend decision and exclusions, then clears when inputs change',async({page})=>{
 await setup(page);await page.route('**/api/evaluate',r=>r.fulfill({status:200,json:result}));
 await page.goto('/');
 await page.locator('#navDesktop [data-nav="1"]').click();
 await page.locator('#deadlineInput').fill('2099-01-01T12:00');
 await page.locator('#saveDeadline').click();
 await page.locator('#navDesktop [data-nav="2"]').click();
 await page.locator('#quantity').fill('10');await page.locator('#capacity').fill('6');
 await page.locator('#duration').fill('1');await page.locator('#readiness').selectOption('unknown');
 await page.locator('#confirmInputs').check();await page.locator('#saveResources').click();
 await page.locator('#navDesktop [data-nav="3"]').click();await page.locator('#runAssessment').click();
 await page.locator('#navDesktop [data-nav="5"]').click();
 const report=page.locator('#printEvidenceReceipt');
 await expect(report).toContainText('FastAPI · UNKNOWN');
 await expect(report).toContainText('Target: 10 handling units');
 await expect(report).toContainText('Backend says readiness is unknown.');
 await expect(report).toContainText('Backend capacity gap is 4.');
 await expect(report).toContainText('requested-helper: Requested is not confirmed.');
 await expect(report).toContainText('2099-01-01T12:00:00+05:30');
 await page.locator('#navDesktop [data-nav="2"]').click();await page.locator('#capacity').fill('8');
 await page.locator('#navDesktop [data-nav="5"]').click();
 await expect(report).toContainText('NOT EVALUATED');
 await expect(report).not.toContainText('Backend capacity gap is 4.');
});
test('print click updates receipt before invoking native printing and retains tri-language presentation',async({page})=>{
 await setup(page);
 await page.addInitScript(()=>{window.print=()=>{window.__auditPrint=document.getElementById('printEvidenceReceipt')?.textContent||'';};});
 await page.goto('/');await page.locator('#navDesktop [data-nav="5"]').click();
 await page.locator('#language').selectOption('mr');
 await expect(page.locator('#printEvidenceReceipt')).toContainText('पुरावा आणि निर्णय नोंद');
 await page.locator('#language').selectOption('hi');
 await expect(page.locator('#printEvidenceReceipt')).toContainText('प्रमाण और निर्णय रिपोर्ट');
 await page.locator('#printSummary').click();
 expect(await page.evaluate(()=>window.__auditPrint)).toContain('NOT EVALUATED');
 await page.locator('#language').selectOption('en');
 await expect(page.locator('#printEvidenceReceipt')).toContainText('Agri Foresight · evidence and decision receipt');
});
test('source activity cards preserve mobile one-column bounds',async({page})=>{
 await setup(page);await page.setViewportSize({width:390,height:844});await page.goto('/');
 const cards=page.locator('#sourceActivityRows .source-activity-item');
 await expect(cards).toHaveCount(2);
 const boxes=await cards.evaluateAll(xs=>xs.map(x=>({l:x.getBoundingClientRect().left,r:x.getBoundingClientRect().right,w:x.getBoundingClientRect().width})));
 expect(boxes.every(x=>x.l>=0&&x.r<=390&&x.w>100)).toBe(true);
});
