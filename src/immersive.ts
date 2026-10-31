type AppleNavigator = Navigator & { standalone?: boolean };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
export class Immersive {
  message = '';
  lockState: 'idle'|'locked'|'unsupported'|'denied' = 'idle';
  pending = false;
  constructor(private root: HTMLElement, private changed: () => void) {
    document.addEventListener('fullscreenchange', () => { this.changed(); });
    matchMedia('(display-mode: fullscreen)').addEventListener('change', () => this.changed());
    matchMedia('(display-mode: standalone)').addEventListener('change', () => this.changed());
  }
  get isIPhone() { return /iPhone|iPod/.test(navigator.userAgent); }
  get installed() { return (navigator as AppleNavigator).standalone===true || matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches; }
  get needsIPhoneHelp() { return this.isIPhone && !this.installed && (!this.root.requestFullscreen || document.fullscreenEnabled===false); }
  /** Only offer one-tap landscape when this browser exposes both required APIs. */
  get canAutoLandscape() {
    const orientation=screen.orientation as LockableOrientation | undefined;
    return !this.isIPhone && typeof orientation?.lock==='function' &&
      (this.installed || (document.fullscreenEnabled!==false && typeof this.root.requestFullscreen==='function'));
  }
  get active() { return document.fullscreenElement === this.root; }
  async enter() {
    if(this.pending) return;
    if(this.needsIPhoneHelp) {
      this.lockState='unsupported';
      this.message='On iPhone, rotate manually. For more screen space, open this site in Safari, tap Share → Add to Home Screen, then launch from the Home Screen icon.';
      this.changed();
      return;
    }
    this.pending=true; this.message=''; this.changed();
    try {
      if(!this.installed && !this.active) {
        if(!this.root.requestFullscreen) throw new Error('unsupported');
        // Invoked synchronously from a tap, before awaiting any other work.
        await this.root.requestFullscreen({navigationUI:'hide'});
        if(!this.active) throw new Error('not entered');
      }
      const orientation=screen.orientation as LockableOrientation;
      if(!orientation?.lock) {
        this.lockState='unsupported'; this.message='Rotate your device to landscape. Orientation lock is unavailable.';
      } else {
        try { await orientation.lock('landscape'); this.lockState='locked'; }
        catch { this.lockState='denied'; this.message='Rotate your device to landscape. Automatic rotation was not allowed.'; }
      }
    } catch {
      this.message='Fullscreen unavailable. Press F or click Fullscreen to retry. Rotate to landscape if needed.';
    } finally { this.pending=false; this.changed(); }
  }
  async toggle() {
    if(this.active) {
      try { await document.exitFullscreen(); screen.orientation?.unlock?.(); this.lockState='idle'; this.message=''; }
      catch { this.message='Could not exit fullscreen. Use the browser Back or Escape control.'; }
      this.changed();
    } else await this.enter();
  }
  snapshot(){return {active:this.active,installed:this.installed,lockState:this.lockState,pending:this.pending,message:this.message};}
}
