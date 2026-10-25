import { defineConfig } from '@playwright/test';
import {mkdirSync} from 'node:fs';
for(const version of ['v0.2','v0.2.1','v0.3','v0.3.1','v0.3.2','v0.4','v0.4.1'])mkdirSync(`docs/evidence/v0.4.2/regressions/${version}`,{recursive:true});
export default defineConfig({testDir:'tests', timeout:120000, workers:1, use:{baseURL:'http://127.0.0.1:5173',headless:true,channel:process.env.OUTRUN_BROWSER||undefined,launchOptions:{args:process.env.OUTRUN_BROWSER?[]:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}},webServer:[{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true},{command:'npm run preview -- --port 4173 --strictPort',url:'http://127.0.0.1:4173',reuseExistingServer:false}]});
