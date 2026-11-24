/** Left stick and D-pad menu movement, with hysteresis and bounded repeat. */
export type MenuDirection = 'up' | 'down' | 'left' | 'right';

const neutral = .28;
const activate = .55;
const directions: readonly MenuDirection[] = ['up', 'down', 'left', 'right'];

function dpadMask(buttons: readonly boolean[]) {
  let mask = 0;
  for (let i = 0; i < directions.length; i++) {
    if (buttons[12 + i]) mask |= 1 << i;
  }
  return mask;
}

function axisSign(value: number) {
  return Math.abs(value) < neutral ? 0 : Math.sign(value);
}

export class PadMenuNavigation {
  private held: MenuDirection | null = null;
  private repeatAt = 0;
  private inheritedX = 0;
  private inheritedY = 0;
  private inheritedDpad = 0;

  /** Inputs held outside the menu must not move its focus on entry. */
  capture(x: number, y: number, buttons: readonly boolean[]) {
    this.inheritedX = axisSign(x);
    this.inheritedY = axisSign(y);
    this.inheritedDpad = dpadMask(buttons);
    this.held = null;
  }

  poll(x: number, y: number, buttons: readonly boolean[], now: number): MenuDirection | null {
    if (axisSign(x) !== this.inheritedX) this.inheritedX = 0;
    if (axisSign(y) !== this.inheritedY) this.inheritedY = 0;
    if (this.inheritedX) x = 0;
    if (this.inheritedY) y = 0;

    const dpad = dpadMask(buttons);
    this.inheritedDpad &= dpad;
    const freshDpad = dpad & ~this.inheritedDpad;
    let direction: MenuDirection | null = null;
    if (freshDpad) {
      direction = directions.find((_, i) => (freshDpad & (1 << i)) !== 0) ?? null;
    } else if (Math.max(Math.abs(x), Math.abs(y)) > activate) {
      direction = Math.abs(y) >= Math.abs(x) ? (y < 0 ? 'up' : 'down') : (x < 0 ? 'left' : 'right');
    } else if (Math.max(Math.abs(x), Math.abs(y)) >= neutral) {
      direction = this.held;
    }

    if (direction !== this.held) {
      this.held = direction;
      this.repeatAt = now + 420;
      return direction;
    }
    if (direction && now >= this.repeatAt) {
      this.repeatAt = now + 160;
      return direction;
    }
    return null;
  }
}
