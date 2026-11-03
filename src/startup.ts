import {loadingStep,loadingFailed} from './loading';
// Paint the HTML artwork/status before evaluating the large game module.
void loadingStep(0,'正在載入遊戲','下載遊戲與畫面素材，請稍候。')
 .then(()=>import('./main'))
 .catch(error=>{loadingFailed();console.error('Game startup failed',error);});
