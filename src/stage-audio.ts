// A tap can grant audio and orientation privileges only before the first await.
let launchAudio: AudioContext | undefined;
export function armStageAudio() {
  try {
    launchAudio = new AudioContext();
    void launchAudio.resume().catch(() => {});
  } catch { /* Audio may be unavailable. The driving controls can retry. */ }
}
export function takeStageAudio() {
  const audio = launchAudio;
  launchAudio = undefined;
  return audio;
}
