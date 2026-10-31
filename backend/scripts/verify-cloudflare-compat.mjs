// UTC guard for Cloudflare Wrangler compatibility_date.
// CI runners operate in UTC; a date already reached in India may still be in the
// UTC future and causes Wrangler to reject startup. No network or credentials.
import { readFileSync } from 'node:fs';
const text=readFileSync('wrangler.jsonc','utf8');
const match=/"compatibility_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"/.exec(text);
if(!match)throw Error('Wrangler compatibility date is missing or malformed.');
const specified=match[1],todayUTC=new Date().toISOString().slice(0,10);
if(specified>todayUTC)throw Error('Wrangler date '+specified+' is later than current UTC date '+todayUTC+'.');
console.log('Wrangler compatibility date validated: '+specified+' <= UTC '+todayUTC);
