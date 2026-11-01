import { test, expect } from '@playwright/test';

/* CF-RES-05: compact visual data-provenance cards and genuinely editable
   readiness checks. No API mocking, data invention or crop-safety assumptions. */
const page03 = page => page.locator('section.section[data-page="2"]');
async function openResources(page) {
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="2"]').click();
  await expect(page03(page)).toHaveClass(/active/);
}

test.describe('CF-RES-05 pictogram evidence and six input shortcuts', () => {
  test('two SVG pictograms replace static theory; both explanations toggle by keyboard', async ({page}) => {
    await openResources(page);
    const section=page03(page);
    const evidence=section.locator('.resource-evidence');
    const details=evidence.locator('.resource-proof-card');
    await expect(details).toHaveCount(2);
    await expect(details.locator('summary svg')).toHaveCount(2);
    await expect(details.nth(0)).not.toHaveAttribute('open', '');
    await expect(details.nth(1)).not.toHaveAttribute('open', '');
    await expect(evidence.locator('.resource-method-disclosure')).not.toHaveAttribute('open','');
    await details.nth(0).locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(details.nth(0)).toHaveAttribute('open','');
    await expect(details.nth(0)).toContainText('FastAPI determines feasibility only after you evaluate');
    await details.nth(1).locator('summary').click();
    await expect(details.nth(1)).toHaveAttribute('open','');
    await expect(details.nth(1)).toContainText('actual rainfall');
    await evidence.locator('.resource-method-disclosure summary').click();
    await expect(evidence.locator('.resource-method-disclosure')).toHaveAttribute('open','');
    await expect(evidence).toContainText('not success probabilities');
  });

  test('six inputs link to genuine existing form fields and update as entered', async ({page}) => {
    await openResources(page);
    const section=page03(page);
    const check=section.locator('.preparedness-card');
    await expect(check.locator('.prep-action')).toHaveCount(6);
    await expect(check.locator('#resourceCheckBadge')).toHaveText('0/6');
    await expect(check.locator('#resourceCompletenessProgress')).toHaveJSProperty('value',0);
    await check.locator('.prep-action[data-field="quantity"]').click();
    await expect(section.locator('#quantity')).toBeFocused();
    await section.locator('#quantity').fill('80');
    await section.locator('#capacity').fill('60');
    await section.locator('#duration').fill('3');
    await expect(check.locator('#resourceCheckBadge')).toHaveText('3/6');
    await expect(check.locator('#resourceCoverageValue')).toContainText('75%');
    await expect(check.locator('#resourceGapValue')).toContainText('20');
    await expect(check.locator('.prep-action[data-field="quantity"]')).toHaveAttribute('data-complete','true');
    await expect(check.locator('.prep-action[data-field="readiness"]')).toHaveAttribute('data-complete','false');
    await check.locator('.prep-action[data-field="readiness"]').click();
    await expect(section.locator('#readiness')).toBeFocused();
    await section.locator('#readiness').selectOption('no');
    await expect(check.locator('#resourceCheckBadge')).toHaveText('4/6');
    await expect(check.locator('.prep-action[data-field="readiness"]')).toHaveClass(/is-caution/);
    await expect(check.locator('#resourceMarginValue')).toContainText(/deadline|hours/i);
    await expect(check.locator('.prep-pathway')).not.toHaveAttribute('open','');
    await check.locator('.prep-pathway summary').click();
    await expect(check.locator('.resource-tree-node')).toHaveCount(4);
    await expect(section.locator('#runAssessment')).toHaveCount(1);
  });

  test('candidate deadline shortcut navigates rather than inventing an expected window', async ({page})=>{
    await openResources(page);
    const c=page03(page).locator('.prep-action[data-field="deadlineInput"]');
    await expect(c).toHaveAttribute('data-complete','false');
    await c.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('section.section[data-page="1"]')).toHaveClass(/active/);
    await expect(page.locator('#deadlineInput')).toBeVisible();
  });

  test('all three languages retain meaningful pictogram titles and responsive layout', async ({page})=>{
    await openResources(page);
    const section=page03(page);
    for(const lang of ['en','mr','hi']){
      await page.locator('#language').selectOption(lang);
      await expect(section.locator('.resource-proof-card strong').first()).not.toBeEmpty();
      await expect(section.locator('.prep-steps-label').first()).not.toBeEmpty();
      await expect(section.locator('.prep-action')).toHaveCount(6);
    }
    await page.locator('#language').selectOption('en');
  });

  for (const width of [1649,1200,1024,390]) {
    test('compact and usable at '+width+'px without overflow', async ({page})=>{
      await page.setViewportSize({width,height:900});
      await page.goto('/');
      const nav=width<=740 ? '#navMobile [data-nav="2"]' : '#navDesktop [data-nav="2"]';
      await page.locator(nav).click();
      const section=page03(page);
      await expect(section.locator('.resource-proof-card')).toHaveCount(2);
      await expect(section.locator('.prep-action')).toHaveCount(6);
      await expect(section.locator('#resourceNextAction')).toBeVisible();
      await expect(section.locator('#addChange')).toBeVisible();
      const measurements=await page.evaluate(()=>{
        const root=document.querySelector('section.section[data-page="2"]');
        const evidence=root.querySelector('.resource-evidence-grid');
        const proof=evidence.querySelector('.resource-proof-card');
        const rect=proof.getBoundingClientRect();
        return {horizontal:document.documentElement.scrollWidth > innerWidth+1,
          proofHeight:rect.height,proofWidth:rect.width,
          evidenceColumns:getComputedStyle(evidence).gridTemplateColumns.split(' ').length};
      });
      expect(measurements.horizontal).toBe(false);
      expect(measurements.proofHeight).toBeLessThan(230);
      expect(measurements.proofWidth).toBeGreaterThan(120);
      expect(measurements.evidenceColumns).toBe(width<=680?1:2);
    });
  }
});
