import {expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {speedometerMarkup} from '../src/speedometer';

const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');

it('speedometer keeps meaningful high-contrast geometry but no opaque face',()=>{
 const markup=speedometerMarkup();
 expect(markup).toContain('class="dial-rim"');
 expect(markup).toContain('id="speed-needle"');
 expect(markup).toContain('id="gear"');
 expect(markup).not.toContain('id="dial-face"');
 expect(markup).not.toContain('fill="url(#dial-face)"');
 expect(markup).not.toMatch(/<circle cx="100" cy="100" r="9[48]" fill=/);
});

it('transparent scenic controls use a quiet pressed state, not always-on colored panels',()=>{
 expect(css).toMatch(/header #pause,\s*#touch\.active button\[data-control\],[\s\S]*?background:transparent/);
 expect(css).toContain('#drive-readout:not([hidden])');
 expect(css).toContain('#touch.active button[data-control]:is(:active,.pressed,.active)');
 expect(css).toContain('#touch.active #steering-strip:is(:active,.pressed)');
 expect(css).toContain('background:rgba(16,55,64,.24)');
 expect(css).toContain('#drive-fps-diagnostic button:active');
});
