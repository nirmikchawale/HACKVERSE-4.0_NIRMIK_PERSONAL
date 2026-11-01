/** Fail the Cloudflare build before upload when the Python runtime SDK is absent.
 * The SDK must be vendored into python_modules/ by Cloudflare's pywrangler sync.
 * This checks actual generated artifacts; it does not create or fake an SDK.
 */
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const sdkInit=resolve(root,'python_modules','workers','__init__.py');
const workerMain=resolve(root,'backend','worker.py');
if(!existsSync(workerMain))throw Error('Cloudflare Python worker entrypoint missing: backend/worker.py');
if(!existsSync(sdkInit)) {
  throw Error('CF-SDK-MISSING: python_modules/workers/__init__.py not vendored. '+
    'Cloudflare preview will fail startup with error 10021. '+
    'Confirm pywrangler sync and workers-runtime-sdk dependency resolution before deployment.');
}
process.stdout.write('Cloudflare SDK vendored PASS: python_modules/workers/__init__.py\n');
