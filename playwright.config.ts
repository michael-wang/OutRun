import { defineConfig } from '@playwright/test';
export default defineConfig({testDir:'tests',outputDir:'test-results/playwright', timeout:120000, workers:1, use:{baseURL:'http://127.0.0.1:5173',headless:true,channel:process.env.OUTRUN_BROWSER||undefined,launchOptions:{args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}},webServer:[
  ...(process.env.OUTRUN_SITE_BASE&&process.env.OUTRUN_PREFLIGHT!=='1'?[]:[{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true}]),
  ...(process.env.OUTRUN_PREFLIGHT==='1'?[]:[{command:'npm run preview -- --port 4173 --strictPort',url:'http://127.0.0.1:4173'+(process.env.OUTRUN_SITE_BASE??'/'),reuseExistingServer:false}])
]});
