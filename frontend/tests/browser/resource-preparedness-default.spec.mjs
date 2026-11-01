import {test,expect} from '@playwright/test';

// Isolated HTTP fixtures are only used in these tests; production always calls FastAPI.
function futureIST(hoursAhead=6){
  const d=new Date(Date.now()+hoursAhead*3_600_000);
  const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',
    month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
  const v=type=>p.find(part=>part.type===type)?.value;
  return v('year')+'-'+v('month')+'-'+v('day')+'T'+v('hour')+':00';
}
async function gotoResources(page,mobile=false){
  await page.locator((mobile?'#navMobile':'#navDesktop')+' [data-nav="2"]').click();
  await expect(page.locator('section[data-page="2"]')).toHaveClass(/active/);
}
async function enterDeclaration(page){
  await page.locator('#quantity').fill('80');
  await page.locator('#capacity').fill('60');
  await page.locator('#duration').fill('2');
  await page.locator('#readiness').selectOption('yes');
  await page.locator('#confirmInputs').check();
  await page.locator('#saveResources').click();
}
async function saveDeadline(page){
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill(futureIST());
  await page.locator('#saveDeadline').click();
}
test('farm resources initially displays one editable unknown alternative, not a confirmed resource',async({page})=>{
  await page.goto('/');
  await gotoResources(page);
  const row=page.locator('#changeEditor .change-row');
  await expect(row).toHaveCount(1);
  await expect(row.locator('[data-x="type"]')).toHaveValue('add_capacity');
  await expect(row.locator('[data-x="amount"]')).toHaveValue('');
  await expect(row.locator('[data-x="rid"]')).toHaveValue('');
  await expect(row.locator('[data-x="availability"]')).toHaveValue('unknown');
  await expect(page.locator('#resourceCheckBadge')).toHaveText('0/6');
  await expect(page.locator('#resourceCoverageValue')).toHaveText('Enter quantities');
  await expect(page.locator('#resourceGapValue')).toHaveText('Enter quantities');
  await expect(page.locator('#checkSiteValue')).toHaveText('Unknown');
  await expect(page.locator('#resourceTreeAssess')).toHaveText('Complete your declaration');
});
test('only measured form completeness and arithmetic capacity indicators appear',async({page})=>{
  await page.goto('/');
  await gotoResources(page);
  await enterDeclaration(page);
  await expect(page.locator('#resourceCheckBadge')).toHaveText('5/6');
  await expect(page.locator('#resourceCoverageValue')).toHaveText('75%');
  await expect(page.locator('#resourceGapValue')).toHaveText('20 units');
  await saveDeadline(page);
  await gotoResources(page);
  await expect(page.locator('#resourceCheckBadge')).toHaveText('6/6');
  await expect(page.locator('#resourceTreeAssess')).toHaveText('Ready for FastAPI evaluation');
  await expect(page.locator('.resource-evidence')).toContainText('Not independently verified');
  await expect(page.locator('.resource-method')).toContainText('not success probabilities');
  await page.locator('#capacity').fill('120');
  await expect(page.locator('#resourceCoverageValue')).toHaveText('100%');
  await expect(page.locator('#resourceGapValue')).toHaveText('0 units');
  await page.locator('#quantity').fill('0');
  await expect(page.locator('#resourceCoverageValue')).toHaveText('Enter quantities'); // ratio to zero target undefined
  await expect(page.locator('#resourceGapValue')).toHaveText('0 units');
});
test('empty starter option is omitted from actual server assessment, not rejected or counted',async({page})=>{
  let posted=null;
  await page.route('**/api/evaluate',async route=>{
    posted=route.request().postDataJSON();
    await route.fulfill({json:{
      status:'blocked',unit:'handling_unit',message:'Insufficient declared capacity',
      baseline:{status:'blocked',projected_target_units:80,projected_capacity_units:60,
        shortfall_units:20,time_budget:{time_slack_hours:4},
        constraints:[{id:'capacity',status:'blocked',explanation:'Shortfall of 20 units',provenance:'USER_REPORTED'}]},
      packages:[],excluded_changes:[]
    }});
  });
  await page.goto('/');
  await saveDeadline(page);
  await gotoResources(page);
  await enterDeclaration(page);
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#runAssessment').click();
  await expect.poll(()=>posted?.changes).toEqual([]);
  await expect(page.locator('#resultTitle')).toContainText('BLOCKED');
});
test('removing the starter is respected on refresh and Add an option still works',async({page})=>{
  await page.goto('/');
  await gotoResources(page);
  await page.locator('.remove-change').click();
  await expect(page.locator('#changeEditor .change-row')).toHaveCount(0);
  await page.reload();
  await gotoResources(page);
  await expect(page.locator('#changeEditor .change-row')).toHaveCount(0);
  await page.locator('#addChange').click();
  await expect(page.locator('#changeEditor .change-row')).toHaveCount(1);
});
test('mobile preparedness tree has usable actions and no horizontal scrolling',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await gotoResources(page,true);
  await expect(page.locator('.resource-tree-node')).toHaveCount(4);
  await page.locator('[data-resource-focus="deadlineInput"]').click();
  await expect(page.locator('section[data-page="1"]')).toHaveClass(/active/);
  await expect(page.locator('#deadlineInput')).toBeFocused();
  await gotoResources(page,true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
