import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:['option-b.local.spec.ts','race-ready.spec.ts','race-recovery.spec.ts','player-first-start.spec.ts'],timeout:180000,workers:1,
 outputDir:'test-results/option-b',use:{baseURL:'http://127.0.0.1:5183',channel:'chrome',headless:true,viewport:{width:1600,height:900}}});
