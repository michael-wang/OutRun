type AppleNavigator = Navigator & { standalone?: boolean };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };
export class Immersive {
  message = '';
  lockState: 'idle'|'locked'|'unsupported'|'denied' = 'idle';
  pending = false;
  private requestId = 0;
  constructor(private root: HTMLElement, public changed: () => void) {
    document.addEventListener('fullscreenchange', () => {
      if(!document.fullscreenElement) {
        // Android Back can exit before the preceding orientation lock settles.
        this.requestId++;
        this.pending=false;
        this.lockState='idle';
      }
      this.changed();
    });
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
    const requestId=++this.requestId;
    this.pending=true; this.message=''; this.changed();
    try {
      if(!this.installed && !this.active) {
        if(!this.root.requestFullscreen) throw new Error('unsupported');
        // Invoked synchronously from a tap, before awaiting any other work.
        await this.root.requestFullscreen({navigationUI:'hide'});
        if(requestId!==this.requestId)return;
        if(!this.active) throw new Error('not entered');
      }
      const orientation=screen.orientation as LockableOrientation;
      if(!orientation?.lock) {
        this.lockState='unsupported'; this.message='請手動橫放手機。';
      } else {
        await orientation.lock('landscape');
        if(requestId===this.requestId)this.lockState='locked';
      }
    } catch {
      if(requestId!==this.requestId)return;
      this.lockState='denied';
      this.message='無法自動切換橫向，請手動橫放手機。';
    } finally {
      if(requestId===this.requestId){
        this.pending=false;
        this.root.toggleAttribute('data-manual-landscape',this.lockState==='denied'||this.lockState==='unsupported');
        this.changed();
      }
    }
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

export const immersive = new Immersive(document.documentElement, () => {});

/** Lives in the menu, loading surface or portrait drive overlay; CSS only shows
 * the control on a portrait touch screen. Each retry owns a fresh user gesture. */
export function landscapeControl() {
  const control=document.createElement('div');
  control.className='landscape-control';
  const hint=document.createElement('small');
  hint.setAttribute('role','status');
  hint.textContent=immersive.isIPhone?'請關閉直向鎖定並橫放手機。':'請手動橫放手機。';
  if(immersive.canAutoLandscape){
    const button=document.createElement('button');
    button.type='button';
    button.textContent='切換橫向';
    hint.className='landscape-fallback';
    button.onclick=()=>{void immersive.enter();};
    control.append(button);
  }
  control.append(hint);
  return control;
}
