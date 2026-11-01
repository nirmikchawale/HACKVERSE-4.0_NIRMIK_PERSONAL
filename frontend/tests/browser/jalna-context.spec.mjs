import {test,expect} from '@playwright/test';

// UI fixtures only. Public Cloudflare certificates check the genuine API.
const context = (soil=null) => ({
  location:'Jalna city approximate reference, Maharashtra, India',
  soil:{
    reference_year:2011,
    classes:[
      {id:'deep_black',reported_percent:13.37},
      {id:'medium_deep',reported_percent:21.36},
      {id:'shallow',reported_percent:65.27},
    ],
  },
  conditions:{
    status:'retrieved_live',
    model:{valid_time_local:'2026-11-01T13:00',values:{
      temperature_2m:29.2,relative_humidity_2m:64,
      wind_speed_10m:8.2,soil_temperature_0cm:33.4,
      soil_moisture_0_to_1cm:soil,
    }},
  },
});

test('Jalna displays sourced model readings and historical district soils without inferring farm type',async({page})=>{
  await page.route('**/api/jalna-agri-context**',route=>route.fulfill({status:200,
    contentType:'application/json',body:JSON.stringify(context(.19))}));
  await page.goto('/');
  await expect(page.locator('#jalnaContext')).toBeAttached();
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#jalnaContext')).toBeVisible();
  await expect(page.locator('#jalnaContext')).toContainText('Weather and soil around Jalna');
  await expect(page.locator('#jalnaContext')).toContainText('29.2 °C');
  await expect(page.locator('#jalnaContext')).toContainText('0.19 m³/m³');
  await expect(page.locator('#jalnaContext')).toContainText('13.37%');
  await expect(page.locator('#jalnaContext')).toContainText('65.27%');
  await expect(page.locator('#jalnaContext')).toContainText('do not identify the soil in your own field');
  await page.locator('#jalnaContext details summary').click();
  await expect(page.locator('#jalnaContext a[href*="icar-crida"]')).toBeVisible();
});

test('missing modeled soil reading stays unavailable rather than a zero claim',async({page})=>{
  await page.route('**/api/jalna-agri-context**',route=>route.fulfill({status:200,
    contentType:'application/json',body:JSON.stringify(context())}));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#jalnaContext')).toContainText('Not available');
  await expect(page.locator('#jalnaContext')).not.toContainText('0 m³/m³');
});

test('Jalna context has simple Marathi/Hindi labels and a real refresh',async({page})=>{
  let calls=0;
  await page.route('**/api/jalna-agri-context**',route=>{
    calls++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(context(.2))});
  });
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await page.locator('#language').selectOption('mr');
  await expect(page.locator('#jalnaContext')).toContainText('जालना भागातलं हवामान');
  await page.locator('#language').selectOption('hi');
  await expect(page.locator('#jalnaContext')).toContainText('जालना का मौसम और मिट्टी');
  await page.locator('#refreshJalnaContext').click();
  await expect.poll(()=>calls).toBeGreaterThanOrEqual(2);
  await expect(page.locator('#jalnaContext')).toContainText('0.2 m³/m³');
});

test('provider failure shows no fabricated current weather and still explains local scope',async({page})=>{
  await page.route('**/api/jalna-agri-context**',route=>route.abort('failed'));
  await page.goto('/');
  await page.locator('#navDesktop [data-nav="1"]').click();
  await expect(page.locator('#jalnaContext')).toContainText('Current model readings are unavailable');
  await expect(page.locator('#jalnaContext')).not.toContainText('29.2 °C');
  await expect(page.locator('#jalnaContext')).toContainText('Jalna city reference area');
});
