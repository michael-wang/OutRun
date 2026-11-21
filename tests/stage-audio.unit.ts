import {describe, expect, it, vi} from 'vitest';
import {resumeStageAudio} from '../src/stage-audio';

describe('stage audio activation', () => {
  it('allows one gesture to supersede a blocked autoplay attempt and shares in-flight attempts', async () => {
    const release: Array<() => void> = [];
    const resume = vi.fn(() => new Promise<void>(resolve => release.push(resolve)));
    const context = {state:'suspended', resume} as unknown as AudioContext;
    const automatic = resumeStageAudio(context, false);
    expect(resumeStageAudio(context, false)).toBe(automatic);
    const user = resumeStageAudio(context, true);
    expect(resumeStageAudio(context, true)).toBe(user);
    release[0]();
    await automatic;
    expect(resumeStageAudio(context, false)).toBe(user);
    release[1]();
    await user;
    expect(resume).toHaveBeenCalledTimes(2);
  });
  it('retries a rejected attempt and never resumes an already running graph', async () => {
    const resume = vi.fn().mockRejectedValueOnce(new Error('device unavailable')).mockResolvedValue(undefined);
    const context = {state:'suspended', resume};
    const attempt = () => resumeStageAudio(context as unknown as AudioContext, true);
    await expect(attempt()).rejects.toThrow('device unavailable');
    await attempt();
    context.state = 'running';
    await attempt();
    expect(resume).toHaveBeenCalledTimes(2);
  });
});
