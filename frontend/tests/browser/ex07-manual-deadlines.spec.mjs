import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const T0=Date.now();
function istHour(ahead){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',
    hourCycle:'h23'}).formatToParts(new Date(T0+ahead*3600000));
  const v=k=>parts.find(x=>x.type===k)?.value;
  return v('year')+'-'+v('month')+'-'+v('day')+'T'+v('hour')+':00';
}
const actualBase={status:'blocked',projected_target_units:10,projected_capacity_units:6,
  shortfall_units:4,original_target_unhandled_units:0,known_blockers:['capacity'],
  constraints:[{id:'capacity',status:'blocked',explanation:'Capacity shortfall',provenance:'user-reported'}],
  time_budget:{time_slack_hours:1,available_hours:2,required_hours:1}};
const assessment={status:'blocked',baseline:actualBase,packages:[],excluded_changes:[],
  message:'Capacity insufficient',unit:'handling_unit'};
const bareForecast={status:'unavailable',hours:[],notice:'Upstream Open-Meteo unavailable'};
async function setup(page){
  await page.route('**/api/health',r=>r.fulfill({status:200,
    json:{ok:true,version:'P0',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,
    json:{sources:[],input_categories:[],operational_rules:[]}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:bareForecast}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,
    json:{status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'Unavailable'}}));
  await page.route('**/api/evaluate',r=>r.fulfill({status:200,json:assessment}));
}
async function prepare(page){
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill(istHour(9));
  await page.locator('#saveDeadline').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#quantity').fill('10');await page.locator('#capacity').fill('6');
  await page.locator('#duration').fill('1');await page.locator('#readiness').selectOption('yes');
  await page.locator('#confirmInputs').check();await page.locator('#saveResources').click();
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#runAssessment').click();
  await expect(page.locator('#resultTitle')).toHaveText('API VERIFIED · BLOCKED');
  await page.locator('#navDesktop [data-nav="4"]').click();
}
function reply(hour,status='blocked',slack=2.25){
  return {changes:{changed_fields:['deadline'],status_before:'blocked',status_after:status},
    interpretation:'Comparison of user-declared assumptions; not a forecast.',
    before:{status:'blocked',baseline:actualBase},
    after:{status,baseline:{
      status,time_budget:{candidate_deadline:hour+':00+05:30',time_slack_hours:slack},
      constraints:status==='feasible'?[{id:'capacity',status:'pass'}]:
        [{id:'capacity',status:'blocked'}]
    }}};
}
test('manual deadline fallback works with no weather and does not imply forecast attestation',async({page})=>{
  await setup(page);const requests=[];
  await page.route('**/api/compare',r=>{
    const request=r.request().postDataJSON();requests.push(request);
    const hour=request.after.deadline.slice(0,16),i=requests.length;
    return r.fulfill({status:200,json:reply(hour,i===2?'feasible':'blocked',i*2.25)});
  });
  await prepare(page);
  await expect(page.locator('#runMultiDeadline')).toBeDisabled();
  await expect(page.locator('#compareManualDeadlines')).toBeEnabled();
  for(let i=1;i<=3;i++)await page.locator('#manualDeadline'+i).fill(istHour(i+4));
  await page.locator('#compareManualDeadlines').click();
  const output=page.locator('#manualDeadlineResults');
  await expect(output.locator('tbody tr')).toHaveCount(3);
  await expect(output).toContainText('FEASIBLE');
  await expect(output).toContainText('Farmer-selected time only · no forecast attestation');
  await expect(page.locator('#manualDeadlineStatus')).toContainText('3/3');
  expect(requests).toHaveLength(3);
  expect(requests.every(x=>x.before.target_units===10&&x.before.capacity_units===6&&
    x.after.capacity_units===6&&x.after.deadline.endsWith('+05:30'))).toBe(true);
});
test('only server-verified manual results are embedded in original evidence JSON export',async({page})=>{
  await setup(page);
  await page.route('**/api/compare',r=>{
    const request=r.request().postDataJSON(),hour=request.after.deadline.slice(0,16);
    return hour===istHour(6)?r.fulfill({status:503,json:{detail:'Backend temporarily unavailable'}}):
      r.fulfill({status:200,json:reply(hour)});
  });
  await prepare(page);
  await page.locator('#manualDeadline1').fill(istHour(5));
  await page.locator('#manualDeadline2').fill(istHour(6));
  await page.locator('#compareManualDeadlines').click();
  await expect(page.locator('#manualDeadlineStatus')).toContainText('1/2');
  await expect(page.locator('#manualDeadlineResults')).toContainText('Backend temporarily unavailable');
  await page.locator('#navDesktop [data-nav="5"]').click();
  const p=page.waitForEvent('download');
  await page.locator('#downloadEvidence').click();const file=await p;
  const data=JSON.parse(await readFile(await file.path(),'utf8'));
  expect(data.user_selected_manual_deadlines).toHaveLength(1);
  expect(data.user_selected_manual_deadlines[0].candidate_hour_ist).toBe(istHour(5));
  expect(data.user_selected_manual_deadlines[0].source_type).toContain('user-declared');
  expect(data.source_attested_model_deadlines).toEqual([]);
});
test('duplicate or past times are rejected, and changed farmer inputs invalidate all old manual results',async({page})=>{
  await setup(page);let calls=0;
  await page.route('**/api/compare',r=>{
    calls++;const hour=r.request().postDataJSON().after.deadline.slice(0,16);
    return r.fulfill({status:200,json:reply(hour)});
  });
  await prepare(page);
  await page.locator('#manualDeadline1').fill(istHour(5));
  await page.locator('#manualDeadline2').fill(istHour(5));
  await page.locator('#compareManualDeadlines').click();
  await expect(page.locator('#manualDeadlineStatus')).toContainText('distinct');
  expect(calls).toBe(0);
  await page.locator('#manualDeadline2').fill(istHour(-2));
  await page.locator('#compareManualDeadlines').click();
  await expect(page.locator('#manualDeadlineStatus')).toContainText('future time');
  expect(calls).toBe(0);
  await page.locator('#manualDeadline2').fill('');
  await page.locator('#compareManualDeadlines').click();
  await expect(page.locator('#manualDeadlineStatus')).toContainText('1/1');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#capacity').fill('8');
  await page.locator('#navDesktop [data-nav="4"]').click();
  await expect(page.locator('#manualDeadlineResults tbody tr')).toHaveCount(0);
  await expect(page.locator('#compareManualDeadlines')).toBeDisabled();
});
