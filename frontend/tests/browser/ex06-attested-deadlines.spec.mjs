import {expect,test} from '@playwright/test';
import {readFile} from 'node:fs/promises';

// Synthetic HTTP fixtures are confined to this browser test. The runtime
// has no substitute forecast, decision engine, or fictitious field readings.
function istHour(ahead) {
  const date=new Date(Date.now()+ahead*3600000);
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',
    year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',
    hourCycle:'h23'}).formatToParts(date);
  const get=key=>parts.find(p=>p.type===key)?.value;
  return [get('year'),get('month'),get('day')].join('-')+'T'+get('hour')+':00';
}
const hours=()=>Array.from({length:5},(_,i)=>({
  time:istHour(i+4),precipitation_mm:i===1?null:i+0.5,
  precipitation_probability_pct:30+i*5
}));
const forecast=()=>({status:'retrieved_live',retrieved_at_utc:new Date().toISOString(),
  forecast_age_hours:0,attribution:'Open-Meteo public model forecast',
  validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
  hours:hours()});
const baseline={status:'blocked',projected_capacity_units:6,projected_target_units:10,
  shortfall_units:4,original_target_unhandled_units:0,
  time_budget:{available_hours:5,required_hours:1,time_slack_hours:4,candidate_deadline:null},
  constraints:[{id:'capacity',status:'blocked',explanation:'Server-reported shortfall',provenance:'declared'}],
  known_blockers:['capacity']};
const evaluation={status:'blocked',baseline,packages:[],excluded_changes:[],
  message:'Resource capacity blocked',unit:'handling_unit'};
async function setup(page,options={}){
  await page.route('**/api/health',r=>r.fulfill({status:200,json:{ok:true,version:'P0',disclaimer:'Not field validated'}}));
  await page.route('**/api/sources',r=>r.fulfill({status:200,json:{sources:[],input_categories:[],operational_rules:[]}}));
  await page.route('**/api/government-climate*',r=>r.fulfill({status:200,json:{
    status:'unavailable',source:'NASA POWER (US government)',days:[],notice:'No response'}}));
  await page.route('**/api/forecast*',r=>r.fulfill({status:200,json:options.noWeather?
    {status:'unavailable',hours:[],notice:'Model down'}:forecast()}));
  await page.route('**/api/evaluate',r=>r.fulfill({status:200,json:evaluation}));
}
async function assessed(page){
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill(istHour(8));
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
function replyFor(hour,offset=0){
  const serverStatus=offset===0?'blocked':'feasible';
  const backend={
    status:serverStatus,
    time_budget:{time_slack_hours:offset===0?0.5:3.25,
      candidate_deadline:hour+':00+05:30'},
    constraints:offset===0?[{id:'capacity',status:'blocked'}]:[
      {id:'capacity',status:'pass'},{id:'timing',status:'pass'}]
  };
  return {before:{status:'blocked',baseline},after:{status:serverStatus,baseline:backend},
    forecast_selection:{selected_hour_local:hour,candidate_deadline:hour+':00+05:30',
      forecast_status:'retrieved_live',attribution:'Open-Meteo public model forecast',
      retrieved_at_utc:new Date().toISOString(),
      precipitation_mm:offset===0?null:2.5,precipitation_probability_pct:35}};
}
test('three distinct selected model hours are independently sent to FastAPI and backend statuses are preserved',async({page})=>{
  await setup(page);const requests=[];
  await page.route('**/api/replan',r=>{
    const request=r.request().postDataJSON();requests.push(request);
    const n=hours().findIndex(h=>h.time===request.selected_hour_local);
    return r.fulfill({status:200,json:replyFor(request.selected_hour_local,n)});
  });
  await assessed(page);
  for(const n of [1,2,3])await page.locator('#multiCandidate'+n).selectOption(istHour(n+3));
  await page.locator('#runMultiDeadline').click();
  const result=page.locator('#multiDeadlineResults');
  await expect(result.locator('tbody tr')).toHaveCount(3);
  await expect(result).toContainText('BLOCKED');
  await expect(result).toContainText('FEASIBLE');
  await expect(result).toContainText('3.25');
  await expect(page.locator('#multiDeadlineStatus')).toContainText('3/3');
  expect(requests).toHaveLength(3);
  expect(requests.every(r=>r.before.target_units===10&&r.before.capacity_units===6&&
    r.after.capacity_units===6&&r.before.now===r.after.now)).toBe(true);
});
test('CSV includes only verified server results, not provider failures',async({page})=>{
  await setup(page);
  await page.route('**/api/replan',r=>{
    const body=r.request().postDataJSON();
    return body.selected_hour_local===istHour(5)?
      r.fulfill({status:409,json:{detail:'Fresh source unavailable'}}):
      r.fulfill({status:200,json:replyFor(body.selected_hour_local,0)});
  });
  await assessed(page);
  await page.locator('#multiCandidate1').selectOption(istHour(4));
  await page.locator('#multiCandidate2').selectOption(istHour(5));
  await page.locator('#runMultiDeadline').click();
  await expect(page.locator('#multiDeadlineStatus')).toContainText('1/2');
  await expect(page.locator('#multiDeadlineResults')).toContainText('Fresh source unavailable');
  const p=page.waitForEvent('download');
  await page.locator('#exportMultiDeadline').click();const download=await p;
  const csv=await readFile(await download.path(),'utf8');
  expect(csv).toContain('hour_ist,backend_status,time_slack_hours');
  expect(csv).toContain(istHour(4));
  expect(csv).not.toContain(istHour(5));
  expect(csv).toContain('Open-Meteo');
});
test('duplicate deadlines, unavailable models and changes to farmer inputs fail closed',async({page})=>{
  await setup(page);
  let posts=0;
  await page.route('**/api/replan',r=>{posts++;return r.fulfill({status:200,
    json:replyFor(r.request().postDataJSON().selected_hour_local,0)});});
  await assessed(page);
  await page.locator('#multiCandidate1').selectOption(istHour(4));
  await page.locator('#multiCandidate2').selectOption(istHour(4));
  await page.locator('#runMultiDeadline').click();
  await expect(page.locator('#multiDeadlineStatus')).toContainText('distinct');
  expect(posts).toBe(0);
  await page.locator('#multiCandidate2').selectOption('');
  await page.locator('#runMultiDeadline').click();
  await expect(page.locator('#exportMultiDeadline')).toBeEnabled();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#capacity').fill('7');
  await page.locator('#navDesktop [data-nav="4"]').click();
  await expect(page.locator('#multiDeadlineResults tbody tr')).toHaveCount(0);
  await expect(page.locator('#exportMultiDeadline')).toBeDisabled();
  await expect(page.locator('#runMultiDeadline')).toBeDisabled();
});
test('unavailable model offers no selectable candidate or fabricated fallback',async({page})=>{
  await setup(page,{noWeather:true});
  await assessed(page);
  await expect(page.locator('#runMultiDeadline')).toBeDisabled();
  await expect(page.locator('#multiDeadlineStatus')).toContainText('No current future model hours');
  await expect(page.locator('#multiDeadlineResults tbody tr')).toHaveCount(0);
});
