import { defineConfig } from 'vite';

// Development/CI proxy only. Vercel's static Vite build does NOT provide a Python
// runtime merely because this proxy exists; release requires separate routing.
const apiProxy = {'/api': {target: 'http://127.0.0.1:8000', changeOrigin: false}};
export default defineConfig({server: {proxy: apiProxy}, preview: {proxy: apiProxy}});
