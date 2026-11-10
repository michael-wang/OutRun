import { stages, type RacingStage } from './racing-stages';
import { armStageAudio } from './stage-audio';
import { immersive } from './immersive';

const boot = document.getElementById('boot')!;
const surface = document.getElementById('game-loading')!;

async function enter(stage: RacingStage) {
  if (!stage.enter || !stage.loading) return;
  boot.hidden = true;
  surface.hidden = false;
  document.documentElement.dataset.loading = 'true';
  document.getElementById('stage-loading-name')!.textContent = stage.name;
  const art = document.getElementById('stage-art')!;
  art.querySelector('source')!.srcset = import.meta.env.BASE_URL + stage.loading.portrait;
  art.querySelector('img')!.src = import.meta.env.BASE_URL + stage.loading.landscape;
  document.getElementById('stage-retry')!.onclick = () => {
    history.replaceState({...history.state, retryStage: stage.id}, '');
    location.reload();
  };
  try {
    const loading = await import('./loading');
    loading.loadingStarted('正在載入關卡', '');
    await loading.loadingStep(0, '正在載入關卡', '');
    try { await stage.enter(); }
    catch (error) {
      loading.loadingFailed('關卡資源無法載入，請檢查連線後再試一次。');
      console.error('Stage preparation failed', error);
    }
  } catch (error) {
    surface.dataset.phase = 'error';
    surface.setAttribute('aria-busy','false');
    document.getElementById('loading-title')!.textContent = '關卡載入失敗';
    document.getElementById('startup-fallback')!.hidden = false;
    console.error('Stage loading failed', error);
  }
}

async function bootMenu() {
  const retry = stages.find(stage => stage.enter && stage.id === history.state?.retryStage);
  if (retry) {
    const {retryStage: _, ...rest} = history.state;
    history.replaceState(rest, '');
    await enter(retry);
    return;
  }
  const { mountMenu } = await import('./racing-menu');
  mountMenu(stage => {
    armStageAudio();
    if (matchMedia('(pointer:coarse)').matches && !immersive.isIPhone)
      void immersive.enter();
    void enter(stage);
  });
  boot.hidden = true;
  delete document.documentElement.dataset.loading;
}

void bootMenu().catch(error => {
  document.getElementById('boot-error')!.hidden = false;
  console.error('Stage menu failed', error);
});
