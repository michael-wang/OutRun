import type { InputState } from './handling';
export type Control = 'left' | 'right' | 'gas' | 'brake';
const keyControls: Record<string, Control> = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'gas', ArrowUp: 'gas', KeyS: 'brake', ArrowDown: 'brake' };
export const SETTINGS_KEY = 'first-drive-controls-swapped';
export function readSwapped(storage: Pick<Storage, 'getItem'> = localStorage): boolean { try { return storage.getItem(SETTINGS_KEY) === 'true'; } catch { return false; } }
export function saveSwapped(value: boolean, storage: Pick<Storage, 'setItem'> = localStorage): void { try { storage.setItem(SETTINGS_KEY, String(value)); } catch { /* Private browsing can disable persistence. */ } }

/** Separate sources ensure releasing one finger never releases another held input. */
export class InputLatch {
  private sources = new Map<string, Control>();
  press(source: string, control: Control) { this.sources.set(source, control); }
  release(source: string) { this.sources.delete(source); }
  clear() { this.sources.clear(); }
  snapshot(): InputState {
    const values = [...this.sources.values()];
    return { gas: values.includes('gas'), brake: values.includes('brake'), steer: Number(values.includes('right')) - Number(values.includes('left')) };
  }
  held(control: Control) { return [...this.sources.values()].includes(control); }
}

export class InputController extends InputLatch {
  private buttons: HTMLElement[];
  constructor(root: Document | HTMLElement = document) {
    super();
    this.buttons = Array.from(root.querySelectorAll<HTMLElement>('[data-control]'));
    const paint = () => this.buttons.forEach(button => button.classList.toggle('pressed', this.held(button.dataset.control as Control)));
    window.addEventListener('keydown', event => { const control = keyControls[event.code]; if (control) { event.preventDefault(); this.press(`key:${event.code}`, control); paint(); } });
    window.addEventListener('keyup', event => { this.release(`key:${event.code}`); paint(); });
    this.buttons.forEach(button => {
      button.addEventListener('pointerdown', event => { event.preventDefault(); button.setPointerCapture(event.pointerId); this.press(`pointer:${event.pointerId}`, button.dataset.control as Control); paint(); });
      const release = (event: PointerEvent) => { this.release(`pointer:${event.pointerId}`); paint(); };
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', event => event.preventDefault());
    });
    window.addEventListener('blur', () => this.clear());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.clear(); });
  }
  override clear() { super.clear(); this.buttons?.forEach(button => button.classList.remove('pressed')); }
}
