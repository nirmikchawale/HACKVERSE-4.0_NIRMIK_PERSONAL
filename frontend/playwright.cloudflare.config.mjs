import {defineConfig} from '@playwright/test';
const baseURL=process.env.CLOUDFLARE_PREVIEW_URL;
if(!baseURL) throw Error('CLOUDFLARE_PREVIEW_URL is required');
const parsed=new URL(baseURL);
if(parsed.protocol!=='https:' || !parsed.hostname.endsWith('.workers.dev') ||
  parsed.pathname!=='/' || parsed.search || parsed.hash) throw Error('Only actual Cloudflare HTTPS preview origin is allowed');
export default defineConfig({
 testDir:'./tests/cloudflare',retries:0,workers:1,timeout:45000,
 expect:{timeout:25000},reporter:[['list']],
 outputDir:'test-results/cloudflare-hosted',
 use:{baseURL,trace:'retain-on-failure',screenshot:'only-on-failure',actionTimeout:20000}
});
