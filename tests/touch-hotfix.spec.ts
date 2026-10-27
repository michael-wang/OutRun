import { menuAction,controlPoint } from './ui';
import { test, expect, Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
const snapshot = (page: Page) => page.evaluate(() => (window as any).__drive.snapshot());

test('mobile long holds retain independent pointers and suppress only gameplay browser defaults', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 960, height: 432 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: undefined, configurable: true }));
  await page.goto('/?pace=1.75');
  await page.locator('#drive').click();
  await page.evaluate(() => {
    (window as any).controlPointers = {};
    document.querySelectorAll<HTMLElement>('[data-control],#steering-strip').forEach(button => button.addEventListener('pointerdown', e => {
      (window as any).controlPointers[button.dataset.control||'steering'] = e.pointerId;
    }));
  });
  const client = await context.newCDPSession(page);
  const point = (control: string, id: number) => controlPoint(page,control,id);
  const gas = await point('gas', 1), left = await point('left', 2);
  const trace: any[] = [];
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gas] });
  const started = Date.now();
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const state = await snapshot(page); trace.push({ phase: 'gas', ...state });
    expect(state.inputs).toEqual({ gas: true, brake: false, steer: 0 });
    expect(state.mode).toBe('playing');
    expect(state.speed).toBeGreaterThan(0);
  }
  expect(Date.now() - started).toBeGreaterThanOrEqual(15000);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gas, left] });
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(1000);
    const state = await snapshot(page); trace.push({ phase: 'gas+left', ...state });
    expect(state.inputs).toEqual({ gas: true, brake: false, steer: -1 });
    expect(state.mode).toBe('playing');
  }
  expect(await page.evaluate(() => getSelection()?.toString())).toBe('');
  for (const control of ['steering', 'gas', 'brake']) {
    const policies = await page.locator(control==='steering'?'#steering-strip':`[data-control=${control}]`).evaluate(button => {
      const style = getComputedStyle(button);
      return { touch: style.touchAction, selection: style.userSelect, webkitSelection: style.getPropertyValue('-webkit-user-select'),
        canceled: ['contextmenu', 'selectstart', 'dragstart'].map(type => !button.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }))) };
    });
    expect(policies).toEqual({ touch: 'none', selection: 'none', webkitSelection: 'none', canceled: [true, true, true] });
  }
  mkdirSync('docs/evidence/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.2.1', { recursive: true });
  await page.screenshot({ path: 'docs/evidence/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.2.1/touch-long-hold.png' });
  // CDP touchEnd lists the contacts being released, not the contacts remaining.
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [left] });
  expect((await snapshot(page)).inputs).toEqual({ gas: true, brake: false, steer: 0 });
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gas, left] });
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [gas] });
  expect((await snapshot(page)).inputs).toEqual({ gas: false, brake: false, steer: -1 });
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  expect((await snapshot(page)).inputs).toEqual({ gas: false, brake: false, steer: 0 });
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [gas, left] });
  // Activate pending capture before deliberately releasing it.
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [gas, { ...left, x: left.x + 1 }] });
  await page.locator('#steering-strip').evaluate(button => button.releasePointerCapture((window as any).controlPointers.steering));
  // Flush the pending lostpointercapture event with the next real pointer update.
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [gas, { ...left, x: left.x + 2 }] });
  expect((await snapshot(page)).inputs).toEqual({ gas: true, brake: false, steer: 0 });
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  expect((await snapshot(page)).inputs).toEqual({ gas: false, brake: false, steer: 0 });
  await expect(page.locator('#touch .pressed')).toHaveCount(0);
  await client.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await menuAction(page,'settings');
  const ordinary = await page.locator('#preferences').evaluate(panel => ({
    context: panel.dispatchEvent(new Event('contextmenu', { bubbles: true, cancelable: true })),
    selection: panel.dispatchEvent(new Event('selectstart', { bubbles: true, cancelable: true })),
    userSelect: getComputedStyle(panel).userSelect,
    touch: getComputedStyle(panel).touchAction
  }));
  expect(ordinary).toEqual({ context: true, selection: true, userSelect: 'auto', touch: 'auto' });
  await page.locator('#swap').check();
  await page.locator('#close-settings').click();
  await page.reload();
  await expect(page.locator('#swap')).toBeChecked();
  expect(errors).toEqual([]);
  writeFileSync('docs/evidence/v0.7d2/regressions/v0.7d1/regressions/v0.7d/regressions/v0.7c1/regressions/v0.7c/regressions/v0.2.1/touch-long-hold.json', JSON.stringify({ physicalAndroidVibration: 'UNVERIFIED', errors, trace }, null, 2));
  await context.close();
});
