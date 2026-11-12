import {it,expect} from 'vitest';
import {revealStageSelect} from '../src/stage-navigation';

it('unmasks the stage selector when returning from a running race',()=>{
 const overlay={hidden:false},root={dataset:{loading:'true',playerUi:'true'}};
 revealStageSelect(overlay,root);
 expect(overlay.hidden).toBe(true);
 expect(root.dataset).not.toHaveProperty('loading');
 expect(root.dataset).toHaveProperty('playerUi','true');
 // Repeated exits do not resurrect the old loading artwork.
 revealStageSelect(overlay,root);
 expect(overlay.hidden).toBe(true);
});
