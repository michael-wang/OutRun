import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({...base,webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true}});
// Worker-only tests need the Vite module server, not a production preview.
// This does not alter the application's build or release configuration.
