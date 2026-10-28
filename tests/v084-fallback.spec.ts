import {stageReady} from './stage-ready';
import{test,expect}from'@playwright/test';
test('offline archive failure gives explicit download fallback',async({page})=>{await page.route('**/__outrun_capture',r=>r.fulfill({status:404,body:'missing'}));await page.goto('/?stage=1&seed=1');await stageReady(page);await page.keyboard.press('KeyP');const download=page.waitForEvent('download');await page.keyboard.press('F8');await expect(page.locator('#photo-status')).toContainText('PC save unconfirmed');expect((await download).suggestedFilename()).toMatch(/^outrun-.*\.png$/);});
