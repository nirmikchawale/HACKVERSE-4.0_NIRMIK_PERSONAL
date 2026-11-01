import {test,expect} from '@playwright/test';

// Fixtures exist only in browser tests. The shipped homepage reads real API state.
function istHour(hoursAhead){
  const d=new Date(Date.now()+hoursAhead*3600000);
  const pieces=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',
    month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d);
  const value=type=>pieces.find(part=>part.type===type)?.value;
  return value('year')+'-'+value('month')+'-'+value('day')+'T'+value('hour')+':00';
}
function forecast({missing=false,stale=false}={}){
  return {
    status:stale?'stale_cache':'retrieved_live',
    retrieved_at_utc:new Date(Date.now()-(stale?4*3600000:2*60000)).toISOString(),
    forecast_age_hours:stale?4:0.03,
    attribution:'Open-Meteo (test fixture)',
    validated:{timezone:'Asia/Kolkata',units:{precipitation:'mm',precipitation_probability:'%'}},
    hours:Array.from({length:24},(_,i)=>({
      time:istHour(i+2),
      precipitation_mm:missing&&i===12?null:1,
      precipitation_probability_pct:20
    }))
  };
}
async function sources(page,model){
  await page.addInitScript(()=>localStorage.clear());
  await page.route('**/api/health',route=>route.fulfill({json:{ok:true,version:'test',disclaimer:'No field validation'}}));
  await page.route('**/api/sources',route=>route.fulfill({json:{sources:[],input_categories:['USER_REPORTED']}}));
  await page.route('**/api/forecast*',route=>route.fulfill({json:model}));
  await page.route('**/api/government-climate*',route=>route.fulfill({json:{status:'unavailable',days:[],notice:'No historical record'}}));
}
test('overview reports real-model test-fixture rainfall coverage, planning outlook and readiness without fake farmer inventory',async({page})=>{
  await sources(page,forecast());
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/');
  await expect(page.locator('#weatherValue')).toContainText('24 mm / 24h');
  await expect(page.locator('#weatherEvidenceNote')).toContainText('24/24 source hours');
  await expect(page.locator('#deadlineValue')).toHaveText('24h model outlook');
  await expect(page.locator('#resourcesValue')).toHaveText('4 planning inputs');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  await expect(page.locator('#snapshotDeadline')).toContainText('6 / 12 / 24h');
  await expect(page.locator('#snapshotAssessment')).toContainText('Engine ready');
  await expect(page.locator('section[data-page="0"] .kpis')).not.toContainText(/Not entered|Not selected|Not evaluated|Authentic forecast required/);
  const [left,right]=await Promise.all([
    page.locator('section[data-page="0"] .lower .panel').nth(0).boundingBox(),
    page.locator('section[data-page="0"] .lower .panel').nth(1).boundingBox()
  ]);
  expect(Math.abs(left.y+left.height-(right.y+right.height))).toBeLessThanOrEqual(2);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});
test('a partial or stale model never becomes a fabricated 24-hour rainfall total',async({page})=>{
  await sources(page,forecast({missing:true}));
  await page.goto('/');
  await expect(page.locator('#weatherValue')).toContainText('future model hours');
  await expect(page.locator('#weatherValue')).not.toContainText('mm / 24h');
  await page.route('**/api/forecast*',route=>route.fulfill({json:forecast({stale:true})}));
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#toggleForecast').click();
  await page.locator('#navDesktop [data-nav="0"]').click();
  await expect(page.locator('#weatherValue')).toHaveText('Refresh weather evidence');
  await expect(page.locator('#weatherValue')).not.toContainText('mm / 24h');
});
test('user-saved declarations and a genuine FastAPI response replace the homepage readouts',async({page})=>{
  await sources(page,forecast());
  await page.route('**/api/evaluate',route=>route.fulfill({json:{
    status:'blocked',unit:'handling_unit',message:'Declared baseline has insufficient capacity.',
    baseline:{status:'blocked',projected_target_units:10,projected_capacity_units:6,shortfall_units:4,
      constraints:[{id:'capacity',status:'blocked',explanation:'4 units below target',provenance:'USER_REPORTED'}],
      time_budget:{time_slack_hours:2}},
    packages:[],excluded_changes:[]
  }}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill(istHour(6));
  await page.locator('#saveDeadline').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#quantity').fill('10');
  await page.locator('#capacity').fill('6');
  await page.locator('#duration').fill('2');
  await page.locator('#readiness').selectOption('yes');
  await page.locator('#confirmInputs').check();
  await page.locator('#saveResources').click();
  await page.locator('#navDesktop [data-nav="0"]').click();
  await expect(page.locator('#resourcesValue')).toContainText('6 / 10');
  await expect(page.locator('#snapshotResource')).toContainText('6/10');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#runAssessment').click();
  await page.locator('#navDesktop [data-nav="0"]').click();
  await expect(page.locator('#feasibilityValue')).toContainText('BLOCKED');
  await expect(page.locator('#feasibilityEvidenceNote')).toContainText('4 unit shortfall');
  await expect(page.locator('#snapshotAssessment')).toContainText('FastAPI · BLOCKED');
});
test('overview remains legible on narrow mobile, with user-input-free state',async({page})=>{
  await sources(page,forecast());
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('#feasibilityValue')).toHaveText('FastAPI ready');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
});

test('all At a Glance values and captions share vertical anchors even when one caption is shorter',async({page})=>{
  await sources(page,forecast());
  for(const width of [1545,1440,1024,390]){
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await expect(page.locator('#resourcesValue')).toHaveText('4 planning inputs');
    const items=await page.locator('section[data-page="0"] .kpis > .kpi').evaluateAll(cards=>
      cards.map(card=>{
        const bounds=card.getBoundingClientRect();
        const value=card.querySelector('.kpi-value');
        const note=card.querySelector('.kpi-sub');
        const valueBounds=value.getBoundingClientRect();
        const noteBounds=note.getBoundingClientRect();
        return {x:bounds.x,y:bounds.y,
          valueY:valueBounds.y,noteY:noteBounds.y,
          valueH:valueBounds.height,noteH:noteBounds.height,
          autoMargin:getComputedStyle(value).marginTop};
      }));
    expect(items).toHaveLength(4);
    expect(items.every(row=>row.autoMargin==='0px')).toBe(true);
    for(const row of [items.slice(0,width<=1050?2:4),...(width<=1050?[items.slice(2,4)]:[])]){
      const anchor=row[0].valueY;
      expect(row.every(card=>Math.abs(card.valueY-anchor)<=2),
        'All KPI values should align within each grid row at '+width+'px').toBe(true);
    }
    if(width>=1440){
      const noteAnchor=items[0].noteY;
      expect(items.every(card=>Math.abs(card.noteY-noteAnchor)<=2),
        'Forecast, deadline, farm resources and feasibility captions must align at '+width+'px').toBe(true);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  }
});

test('KPI captions stay aligned with a multiline weather fallback, without truncating the message',async({page})=>{
  await sources(page,forecast());
  for(const width of [1545,1440,1024,390]){
    await page.setViewportSize({width,height:900});
    await page.goto('/');
    await expect(page.locator('#resourcesValue')).toHaveText('4 planning inputs');
    // UI-only text fixture: simulate a longer unavailable-source explanation,
    // not an actual or fabricated forecast measurement.
    await page.locator('#weatherValue').evaluate(el=>{
      el.textContent='Refresh weather evidence — source temporarily unavailable';
    });
    const cards=await page.locator('section[data-page="0"] .kpis > .kpi').evaluateAll(elements=>
      elements.map(card=>{
        const value=card.querySelector('.kpi-value'),sub=card.querySelector('.kpi-sub');
        return {valueY:value.getBoundingClientRect().y,
          captionY:sub.getBoundingClientRect().y,
          valueText:value.textContent?.trim(),
          margin:getComputedStyle(value).marginTop,
          layout:getComputedStyle(card).display,
          subgrid:getComputedStyle(card).gridTemplateRows};
      }));
    expect(cards).toHaveLength(4);
    expect(cards.every(c=>c.margin==='0px')).toBe(true);
    const groups=width<=1050?[cards.slice(0,2),cards.slice(2)]:[cards];
    for(const group of groups){
      const valueY=group[0].valueY,captionY=group[0].captionY;
      expect(group.every(item=>Math.abs(item.valueY-valueY)<=2)).toBe(true);
      expect(group.every(item=>Math.abs(item.captionY-captionY)<=2),
        'Multiline weather fallback must not displace neighboring captions at '+width+'px').toBe(true);
    }
    const text=await page.locator('#weatherValue').textContent();
    expect(text).toContain('source temporarily unavailable');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
  }
});
