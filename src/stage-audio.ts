// A tap can grant audio and orientation privileges only before the first await.
let launchAudio: AudioContext | undefined;
// Chromium can leave an autoplay resume pending until a later user gesture.
const pending = new WeakMap<AudioContext, { activated: boolean; result: Promise<void> }>();

export function resumeStageAudio(context: AudioContext, activated = navigator.userActivation?.isActive === true) {
  if (context.state === 'running') return Promise.resolve();
  const previous = pending.get(context);
  if (previous && (previous.activated || !activated)) return previous.result;

  const result = context.resume().finally(() => {
    if (pending.get(context)?.result === result) pending.delete(context);
  });
  pending.set(context, { activated, result });
  return result;
}

export function armStageAudio() {
  try {
    launchAudio ??= new AudioContext();
    void resumeStageAudio(launchAudio).catch(() => {});
  } catch { /* Audio may be unavailable. The driving controls can retry. */ }
}
export function takeStageAudio() {
  const audio = launchAudio;
  launchAudio = undefined;
  return audio;
}
