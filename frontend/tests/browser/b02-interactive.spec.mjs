import {expect,test} from '@playwright/test';
const hour='2099-01-01T09:00';
const forecast={status:'retrieved_live',hours:[{time:hour,precipitation_mm:2.1,precipitation_probability_pct:60}],retrieved_at_utc:new Date().toISOString(),forecast_age_hours:0,validated:{timezone:'Asia/Kolkata',units:{time:'iso8601',precipitation:'mm',precipitation_probability:'%'}},attribution:'Open-Meteo.com CC BY 4.0'};
const base={status:'blocked',constraints:[{id:'capacity',status:'blocked',explanation:'Shortfall 4',provenance:'user-reported'}],known_blockers:['capacity'],time_budget:{candidate_deadline:'2099-01-01T12:00:00+05:30',evaluated_at:new Date().toISOString(),available_hours:4,required_hours:1,time_slack_hours:3,basis:'user deadline'},projected_capacity_units:6,projected_target_units:10,original_target_unhandled_units:0,shortfall_units:4};
const projected={...base,status:'feasible',constraints:base.constraints.map(c=>({...c,status:'pass'})),known_blockers:[],projected_capacity_units:10,shortfall_units:0};
const evalResp={status:'blocked',message:'Capacity insufficient',meaning:'resource feasibility only',unit:'handling_unit',baseline:base,packages:[{change_ids:['option-1'],projected,warning:'Projected only',objective_changed:false}],excluded_changes:[]};
async function stub(page,weather=forecast){
 await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'P0',forecast_validated_cache_present:false,disclaimer:'Not field validated'}}));
 await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[{id:'weather',title:'Open-Meteo',url:'https://open-meteo.com/',short_supported_statement:'Model data',limitations:'No guarantees'}],operational_rules:[],input_categories:['user-reported']}}));
 await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:weather}));
}
async function prepare(page){
 await page.locator('#navDesktop [data-nav="1"]').click();
 await page.locator('#deadlineInput').fill('2099-01-01T12:00');
 await page.locator('#saveDeadline').click();
 await page.locator('#navDesktop [data-nav="2"]').click();
 await page.locator('#quantity').fill('10');await page.locator('#capacity').fill('6');
 await page.locator('#duration').fill('1');await page.locator('#readiness').selectOption('yes');
 await page.locator('#confirmInputs').check();await page.locator('#saveResources').click();
}
test('sourced hourly model forecast is selectable but no rain-onset guarantee',async({page})=>{
 await stub(page);await page.goto('/');
 await expect(page.locator('#forecastSourceChip')).toHaveText('LIVE MODEL FORECAST');
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(1);
 await page.locator('#navDesktop [data-nav="1"]').click();
 await page.locator('#weatherChart .hour-bar').click();
 await expect(page.locator('#deadlineInput')).toHaveValue(hour);
 await expect(page.locator('#deadlineNotice')).toContainText('model hour');
});
test('unavailable weather shows no invented selectable hours',async({page})=>{
 await stub(page,{status:'unavailable',hours:[],notice:'Source unreachable'});await page.goto('/');
 await expect(page.locator('#forecastSourceChip')).toHaveText('UNAVAILABLE');
 await expect(page.locator('#weatherChart .hour-bar')).toHaveCount(0);
});
test('failed server evaluation does not emit fake feasible result',async({page})=>{
 await stub(page,{status:'unavailable',hours:[]});
 await page.route('**/api/evaluate',r=>r.fulfill({status:503,json:{detail:'Engine unavailable'}}));
 await page.goto('/');await prepare(page);await page.locator('#navDesktop [data-nav="3"]').click();await page.locator('#runAssessment').click();
 await expect(page.locator('#resultTitle')).toHaveText('Not evaluated');
 await expect(page.locator('#resourceNotice')).toContainText('Engine unavailable');
});
test('server evaluation and comparison use declared resources, not local arithmetic',async({page})=>{
 await stub(page);let posted,compared;
 await page.route('**/api/evaluate',r=>{posted=r.request().postDataJSON();return r.fulfill({status:200,json:evalResp});});
 await page.route('**/api/compare',r=>{compared=r.request().postDataJSON();return r.fulfill({status:200,json:{before:evalResp,after:{...evalResp,status:'feasible',baseline:projected},changes:{changed_fields:['capacity_units'],status_before:'blocked',status_after:'feasible',time_slack_delta_hours:0},interpretation:'User-conditional change only'}});});
 await page.goto('/');await prepare(page);await page.locator('#addChange').click();
 await page.locator('#changeEditor [data-x=amount]').fill('4');
 await page.locator('#changeEditor [data-x=rid]').fill('worker-extra');
 await page.locator('#changeEditor [data-x=availability]').selectOption('confirmed');
 await page.locator('#navDesktop [data-nav="3"]').click();await page.locator('#runAssessment').click();
 await expect(page.locator('#resultTitle')).toHaveText('API VERIFIED · BLOCKED');
 await expect(page.locator('#packageList .package-card')).toHaveCount(1);
 expect(posted.target_units).toBe(10);expect(posted.changes[0].confirmation_state).toBe('confirmed');
 await page.locator('#navDesktop [data-nav="4"]').click();await page.locator('#packageList .package-card').click();await page.locator('#compareApi').click();
 await expect(page.locator('#comparePanel')).toContainText('Backend comparison');
 expect(compared.after.capacity_units).toBe(10);
});
