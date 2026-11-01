import {test,expect} from '@playwright/test';

// CF-FEAS-06: task-first personal assessment. No invented farmer records or
// weather values: B-03 exercises the actual FastAPI; other checks stay UI-only.
test('idle assessment exposes only actionable inputs, no dead metric or empty panels',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(page.locator('#resultHero')).toBeVisible();
  await expect(page.locator('#resultTitle')).toContainText('Not evaluated');
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await expect(page.locator('#farmResultPanel')).toBeHidden();
  await expect(page.locator('#resetAssessment')).toBeHidden();
  await expect(page.locator('#feasPlanningAction')).toBeVisible();
  await expect(page.locator('#feasResourcesAction')).toBeVisible();
  await expect(page.locator('#runAssessment')).toBeEnabled();
  await expect(page.locator('section[data-page="3"] .farm-eval-disclosure')).not.toHaveAttribute('open','');
  await page.locator('section[data-page="3"] .farm-eval-disclosure summary').click();
  await expect(page.locator('.farm-eval-disclosure')).toHaveAttribute('open','');
  await expect(page.locator('.farm-eval-disclosure')).toContainText('not a crop-safety');
  await page.locator('#runAssessment').click();
  await expect(page.locator('#resultTitle')).toContainText('Not evaluated');
  await expect(page.locator('#resultReason')).toContainText(/deadline|resource|confirm|valid|Jalna/i);
  await expect(page.locator('#resetAssessment')).toBeVisible();
  await page.locator('#resetAssessment').click();
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await expect(page.locator('#farmResultPanel')).toBeHidden();
  await expect(page.locator('#resetAssessment')).toBeHidden();
  await expect(page.locator('#constraintList .constraint-line')).toHaveCount(0);
});
test('direct step navigation works with keyboard, including untouched source explorer',async({page})=>{
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(page.locator('#fw-count-all')).toHaveText('100',{timeout:25000});
  await page.locator('#feasPlanningAction').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('section.section[data-page="1"]')).toHaveClass(/active/);
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#feasResourcesAction').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(page.locator('#fw-count-all')).toHaveText('100');
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
});
test('mobile compact assessment wraps without overflow and retains working links',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.locator('#navMobile [data-nav="3"]').click();
  await expect(page.locator('#resultHero')).toBeVisible();
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await expect(page.locator('#farmResultPanel')).toBeHidden();
  const [a,b,c]=await Promise.all(['#feasPlanningAction','#feasResourcesAction','#runAssessment'].map(s=>page.locator(s).isVisible()));
  expect(a&&b&&c).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)).toBe(false);
  await page.locator('#feasResourcesAction').click();
  await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
});

// Integration case: real submitted data, real deterministic Python evaluator.
// This never fulfills a fake API response or claims that a plan is field-safe.
test('genuine FastAPI result reveals clickable metrics, one optional explanation, and next actions',async({page})=>{
  test.skip(process.env.B03_INTEGRATION!=='true','Requires genuine FastAPI/Uvicorn.');
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#deadlineInput').fill('2099-01-01T12:00');
  await page.locator('#saveDeadline').click();
  await page.locator('#navDesktop [data-nav="2"]').click();
  await page.locator('#quantity').fill('10');
  await page.locator('#capacity').fill('6');
  await page.locator('#duration').fill('1');
  await page.locator('#readiness').selectOption('yes');
  await page.locator('#confirmInputs').check();
  await page.locator('#saveResources').click();
  await page.locator('#navDesktop [data-nav="3"]').click();
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await page.locator('#runAssessment').click();
  await expect(page.locator('#resultTitle')).toHaveText('API VERIFIED · BLOCKED',{timeout:20000});
  await expect(page.locator('#farmResultMetrics')).toBeVisible();
  await expect(page.locator('#farmResultPanel')).toBeVisible();
  await expect(page.locator('#resultGap')).toHaveText('4');
  await expect(page.locator('#resetAssessment')).toBeVisible();
  await expect(page.locator('#farmExplanation')).not.toHaveAttribute('open','');
  await page.locator('#farmExplanation summary').click();
  await expect(page.locator('#farmExplanation')).toHaveAttribute('open','');
  await expect(page.locator('#constraintList .constraint-line')).not.toHaveCount(0);
  await expect(page.locator('#decisionDiagnostics')).toContainText('BLOCKED');
  await page.locator('#resultGap').locator('..').click();
  await expect(page.locator('section.section[data-page="2"]')).toHaveClass(/active/);
  await page.locator('#navDesktop [data-nav="3"]').click();
  await page.locator('#resetAssessment').click();
  await expect(page.locator('#farmResultMetrics')).toBeHidden();
  await expect(page.locator('#farmResultPanel')).toBeHidden();
});
